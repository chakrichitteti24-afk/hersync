import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/utils/supabase/server';

function maskIdentity(email?: string, name?: string): string {
  if (name && name.trim()) {
    const parts = name.trim().split(' ');
    return parts[0] + (parts.length > 1 ? ` ${parts[1][0]}.` : '');
  }
  if (email && email.includes('@')) {
    const [local, domain] = email.split('@');
    const masked = local.length <= 2 ? local : `${local.slice(0, 2)}***`;
    return `${masked}@${domain}`;
  }
  return 'Friend';
}

export async function GET(req: Request) {
  try {
    const { supabase, user, error: authError } = await getAuthenticatedUser(req);

    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Query referrals where user is referrer
    const { data: referrals, error: refError } = await supabase
      .from('referrals')
      .select('id, referred_user_id, referral_code, status, reward_amount, created_at, completed_at')
      .eq('referrer_id', user.id)
      .order('created_at', { ascending: false });

    if (refError) {
      // Table may not exist yet or empty
      return NextResponse.json({ success: true, data: [] });
    }

    // Enhance with masked friend info from profiles
    const enhanced = await Promise.all(
      (referrals || []).map(async (ref: any) => {
        let friendDisplay = 'Friend';
        try {
          const { data: prof } = await supabase
            .from('profiles')
            .select('first_name, email')
            .eq('id', ref.referred_user_id)
            .maybeSingle();

          if (prof) {
            friendDisplay = maskIdentity(prof.email, prof.first_name);
          }
        } catch {}

        return {
          id: ref.id,
          friend: friendDisplay,
          status: ref.status,
          rewardAmount: ref.status === 'COMPLETED' ? ref.reward_amount : 0,
          potentialReward: ref.reward_amount,
          createdAt: ref.created_at,
          completedAt: ref.completed_at,
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: enhanced,
    });
  } catch (error: any) {
    console.error('[rewards/referrals GET error]', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
