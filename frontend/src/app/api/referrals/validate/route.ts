import { NextResponse } from 'next/server';
import { createAdminClient } from '@/utils/supabase/server';
import { isValidReferralCode, extractReferralCode } from '@/lib/rewards/rewards-config';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const raw = searchParams.get('code') || searchParams.get('ref') || '';
    const cleanCode = extractReferralCode(raw);

    if (!cleanCode || !isValidReferralCode(cleanCode)) {
      return NextResponse.json(
        { success: false, error: 'Invalid referral code format. Codes are in format SVX-XXXXXX.' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    const { data: referrer, error } = await supabase
      .from('profiles')
      .select('id, first_name, username')
      .eq('referral_code', cleanCode)
      .maybeSingle();

    if (error || !referrer) {
      return NextResponse.json(
        { success: false, error: 'Referral code not found.' },
        { status: 404 }
      );
    }

    const name = referrer.first_name || referrer.username || 'A friend';

    return NextResponse.json({
      success: true,
      data: {
        valid: true,
        referralCode: cleanCode,
        referrerName: name,
      },
    });
  } catch (error: any) {
    console.error('[referrals/validate GET error]', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const raw = body.code || body.referralCode || '';
    const cleanCode = extractReferralCode(raw);

    if (!cleanCode || !isValidReferralCode(cleanCode)) {
      return NextResponse.json(
        { success: false, error: 'Invalid referral code format.' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    const { data: referrer, error } = await supabase
      .from('profiles')
      .select('id, first_name, username')
      .eq('referral_code', cleanCode)
      .maybeSingle();

    if (error || !referrer) {
      return NextResponse.json(
        { success: false, error: 'Referral code not found.' },
        { status: 404 }
      );
    }

    const name = referrer.first_name || referrer.username || 'A friend';

    return NextResponse.json({
      success: true,
      data: {
        valid: true,
        referralCode: cleanCode,
        referrerName: name,
      },
    });
  } catch (error: any) {
    console.error('[referrals/validate POST error]', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
