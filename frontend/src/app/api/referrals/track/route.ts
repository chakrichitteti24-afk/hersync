import { NextResponse } from 'next/server';
import { createAdminClient } from '@/utils/supabase/server';
import { recordReferralSignup } from '@/lib/rewards/rewards-service';
import { extractReferralCode } from '@/lib/rewards/rewards-config';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { referralCode, newUserId, newUserEmail } = body;
    const cleanCode = extractReferralCode(referralCode);

    if (!cleanCode || !newUserId || !newUserEmail) {
      return NextResponse.json(
        { success: false, error: 'Missing or invalid required parameters (referralCode, newUserId, newUserEmail).' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();
    const result = await recordReferralSignup(supabase, cleanCode, newUserId, newUserEmail);

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      data: { referralId: result.referralId },
    });
  } catch (error: any) {
    console.error('[referrals/track POST error]', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
