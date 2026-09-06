import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/utils/supabase/server';
import { extractDateFromRequest } from '@/utils/date-utils';

import { REWARD_CONFIG } from '@/lib/rewards/rewards-config';
import { awardCoinsWithDailyCap } from '@/lib/rewards/rewards-service';

type CheckinSlot = 'morning' | 'afternoon' | 'evening';
const VALID_SLOTS: CheckinSlot[] = ['morning', 'afternoon', 'evening'];
const SLOT_COIN_AMOUNT = REWARD_CONFIG.REWARDS.DAILY_CHECKIN_SLOT;
const BONUS_COIN_AMOUNT = REWARD_CONFIG.REWARDS.DAILY_CHECKIN_ALL_BONUS;

export async function POST(req: Request) {
  try {
    const { supabase, user, error: authError } = await getAuthenticatedUser(req);

    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const userId = user.id;
    const body = await req.json();
    const { slot, claimBonus, date: bodyDate } = body as { slot?: CheckinSlot; claimBonus?: boolean; date?: string };

    const serverToday = new Date().toISOString().split('T')[0];
    const today = serverToday; // Always use server date — never trust client-supplied date

    // Reject if client sent a different date (prevents re-claiming past slots)
    if (bodyDate && bodyDate !== serverToday) {
      return NextResponse.json(
        { success: false, error: 'Claims can only be made for today.' },
        { status: 400 }
      );
    }

    // ── Validation ────────────────────────────────────────────────────────────
    if (slot && !VALID_SLOTS.includes(slot)) {
      return NextResponse.json(
        { success: false, error: 'Invalid slot. Must be morning, afternoon, or evening.' },
        { status: 400 }
      );
    }

    if (!slot && !claimBonus) {
      return NextResponse.json(
        { success: false, error: 'Provide either { slot } or { claimBonus: true }' },
        { status: 400 }
      );
    }

    // ── Load today's check-in meta ─────────────────────────────────────────────
    const { data: checkinRows } = await supabase
      .from('daily_checkins')
      .select('id, summary')
      .eq('user_id', userId)
      .eq('date', today)
      .limit(1);

    const checkinRow = checkinRows && checkinRows.length > 0 ? checkinRows[0] : null;

    let slotMeta: Record<string, any> = {};
    if (checkinRow?.summary) {
      try {
        slotMeta = JSON.parse(checkinRow.summary);
      } catch {
        slotMeta = {};
      }
    }

    // ── Handle slot claim ─────────────────────────────────────────────────────
    if (slot) {
      if (!slotMeta[slot]?.completed) {
        return NextResponse.json(
          { success: false, error: `${slot} check-in has not been completed yet.` },
          { status: 400 }
        );
      }

      const slotRef = `checkin:${today}:${slot}`;
      const slotCapName = slot.charAt(0).toUpperCase() + slot.slice(1);

      const { awarded, coinsEarned, newBalance, message: awardMsg, capReached } = await awardCoinsWithDailyCap(
        supabase,
        userId,
        SLOT_COIN_AMOUNT,
        'checkin_slot',
        slotRef,
        `${slotCapName} check-in reward claimed`,
        true
      );

      // Mark claimed in slotMeta
      if (awarded && checkinRow?.id) {
        slotMeta[slot] = { ...slotMeta[slot], claimed: true };
        await supabase
          .from('daily_checkins')
          .update({ summary: JSON.stringify(slotMeta), updated_at: new Date().toISOString() })
          .eq('id', checkinRow.id);
      }

      return NextResponse.json({
        success: true,
        data: {
          slot,
          awarded,
          alreadyClaimed: !awarded && !capReached,
          capReached,
          coinsEarned,
          newBalance,
          message: capReached
            ? `Daily limit of ${REWARD_CONFIG.DAILY_COIN_LIMIT} coins reached today.`
            : awarded
            ? `+${coinsEarned} coins claimed for your ${slotCapName} check-in! 🪙`
            : awardMsg || `${slotCapName} reward was already claimed.`,
        },
      });
    }

    // ── Handle daily bonus claim ──────────────────────────────────────────────
    if (claimBonus) {
      const allComplete = VALID_SLOTS.every((s) => slotMeta[s]?.completed);
      if (!allComplete) {
        return NextResponse.json(
          { success: false, error: 'Complete all 3 daily check-ins first to claim the bonus.' },
          { status: 400 }
        );
      }

      const bonusRef = `checkin:${today}:all_slots_bonus`;

      const { awarded: bonusAwarded, coinsEarned: bonusCoins, newBalance, message: bonusMsg, capReached: bonusCap } = await awardCoinsWithDailyCap(
        supabase,
        userId,
        BONUS_COIN_AMOUNT,
        'checkin_all_bonus',
        bonusRef,
        'Daily bonus: All 3 check-ins completed and claimed!',
        true
      );

      if (bonusAwarded && checkinRow?.id) {
        slotMeta['_bonusClaimed'] = true;
        await supabase
          .from('daily_checkins')
          .update({ summary: JSON.stringify(slotMeta), updated_at: new Date().toISOString() })
          .eq('id', checkinRow.id);
      }

      return NextResponse.json({
        success: true,
        data: {
          bonusAwarded,
          alreadyClaimed: !bonusAwarded && !bonusCap,
          capReached: bonusCap,
          coinsEarned: bonusCoins,
          newBalance,
          message: bonusCap
            ? `Daily limit of ${REWARD_CONFIG.DAILY_COIN_LIMIT} coins reached today.`
            : bonusAwarded
            ? `+${bonusCoins} bonus coins for completing all daily check-ins! 🌟`
            : bonusMsg || 'Daily bonus was already claimed.',
        },
      });
    }

    return NextResponse.json({ success: false, error: 'Invalid request.' }, { status: 400 });

  } catch (error: any) {
    console.error('[checkin/claim POST error]', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
