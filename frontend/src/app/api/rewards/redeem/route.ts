import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/utils/supabase/server';
import { executeRedemption } from '@/lib/rewards/rewards-service';

export async function POST(req: Request) {
  try {
    const { supabase, user, error: authError } = await getAuthenticatedUser(req);

    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const email = user.email || undefined;
    const userName = (user.user_metadata?.first_name || user.user_metadata?.full_name || 'User') as string;

    const result = await executeRedemption(supabase, user.id, email, userName);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error || 'Your redemption could not be processed. No Coins were deducted.',
          data: { newBalance: result.newBalance },
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        newBalance: result.newBalance,
        redemptionId: result.redemptionId,
        message: result.message || 'Your ₹100 reward request has been received.',
      },
    });
  } catch (error: any) {
    console.error('[rewards/redeem POST error]', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Your redemption could not be processed. No Coins were deducted.' },
      { status: 500 }
    );
  }
}
