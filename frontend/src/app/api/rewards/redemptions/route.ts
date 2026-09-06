import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/utils/supabase/server';

export async function GET(req: Request) {
  try {
    const { supabase, user, error: authError } = await getAuthenticatedUser(req);

    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { data: redemptions, error } = await supabase
      .from('redemptions')
      .select('id, coins_redeemed, inr_amount, status, payout_provider, payout_reference, created_at, updated_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ success: true, data: [] });
    }

    return NextResponse.json({
      success: true,
      data: redemptions || [],
    });
  } catch (error: any) {
    console.error('[rewards/redemptions GET error]', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
