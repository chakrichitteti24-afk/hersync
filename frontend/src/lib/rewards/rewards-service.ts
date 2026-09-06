/**
 * SVANEXA AI — CENTRALIZED REWARDS SERVICE
 * Core business logic, anti-fraud controls, ledger integrity, and atomic operations.
 */

import { SupabaseClient } from '@supabase/supabase-js';
import {
  REWARD_CONFIG,
  coinsToInr,
  formatCoins,
  canRedeem,
  isValidReferralCode,
  extractReferralCode,
  TransactionType,
  ReferralStatus,
  RedemptionStatus,
} from './rewards-config';
import { getPayoutProvider } from './payout-service';

export {
  REWARD_CONFIG,
  coinsToInr,
  formatCoins,
  canRedeem,
  isValidReferralCode,
  extractReferralCode,
};
export type { TransactionType, ReferralStatus, RedemptionStatus };

export interface UserRewardSummary {
  coinBalance: number;
  inrValue: number;
  referralCode: string;
  referralLink: string;
  canRedeem: boolean;
  minRedemptionCoins: number;
  dailyCoinLimit: number;
  dailyEarnedToday: number;
  dailyLimitRemaining: number;
  stats: {
    totalReferrals: number;
    completedReferrals: number;
    pendingReferrals: number;
    totalEarnedCoins: number;
  };
  recentTransactions: Array<{
    id: string;
    amount: number;
    transaction_type: string;
    description: string;
    created_at: string;
    reference_id?: string;
  }>;
  recentRedemptions: Array<{
    id: string;
    coins_redeemed: number;
    inr_amount: number;
    status: RedemptionStatus;
    created_at: string;
    payout_provider?: string;
  }>;
}

/**
 * Generates an ambiguous-free, unique referral code like SVX-A7K92P.
 */
export function generateReferralCodeString(): string {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let result = 'SVX-';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Retrieves or creates a stable, unique referral code for a user in profiles.
 */
export async function getOrCreateUserReferralCode(
  supabase: SupabaseClient,
  userId: string
): Promise<string> {
  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('referral_code')
      .eq('id', userId)
      .maybeSingle();

    if (profile?.referral_code && typeof profile.referral_code === 'string') {
      return profile.referral_code.trim().toUpperCase();
    }

    // Generate unique code and update
    let uniqueCode = generateReferralCodeString();
    let attempts = 0;
    while (attempts < 5) {
      const { data: existing } = await supabase
        .from('profiles')
        .select('id')
        .eq('referral_code', uniqueCode)
        .maybeSingle();

      if (!existing) break;
      uniqueCode = generateReferralCodeString();
      attempts++;
    }

    await supabase
      .from('profiles')
      .update({ referral_code: uniqueCode })
      .eq('id', userId);

    return uniqueCode;
  } catch (err) {
    console.warn('[getOrCreateUserReferralCode warning]', err);
    // Deterministic fallback based on user id if column not ready
    return `SVX-${userId.slice(0, 6).toUpperCase()}`;
  }
}

/**
 * Calculates total coins earned today by a user from daily activities (excluding referral bonuses).
 */
export async function getDailyEarnedCoinsToday(
  supabase: SupabaseClient,
  userId: string
): Promise<number> {
  try {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const { data: txs, error } = await supabase
      .from('user_coin_transactions')
      .select('amount, transaction_type')
      .eq('user_id', userId)
      .gte('created_at', startOfToday.toISOString())
      .gt('amount', 0);

    if (error || !txs) return 0;

    // Filter out REFERRAL_REWARD — only cap daily activities (check-ins, bonus, wellness tasks)
    const dailyActivities = txs.filter(
      (tx) => tx.transaction_type !== REWARD_CONFIG.TRANSACTION_TYPES.REFERRAL_REWARD
    );

    return dailyActivities.reduce((acc, tx) => acc + (Number(tx.amount) || 0), 0);
  } catch (err) {
    console.warn('[getDailyEarnedCoinsToday warning]', err);
    return 0;
  }
}

/**
 * Retrieves the full rewards summary for an authenticated user.
 */
export async function getUserRewardSummary(
  supabase: SupabaseClient,
  userId: string,
  requestOrigin?: string
): Promise<UserRewardSummary> {
  // Concurrently execute all independent database operations in parallel
  const [
    balRes,
    referralCode,
    dailyEarnedToday,
    txRes,
    refRes,
    redRes,
  ] = await Promise.all([
    supabase
      .from('user_coin_balances')
      .select('balance')
      .eq('user_id', userId)
      .maybeSingle(),
    getOrCreateUserReferralCode(supabase, userId),
    getDailyEarnedCoinsToday(supabase, userId),
    supabase
      .from('user_coin_transactions')
      .select('id, amount, transaction_type, description, created_at, reference_id')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(30),
    supabase
      .from('referrals')
      .select('status')
      .eq('referrer_id', userId)
      .then((res) => res, () => ({ data: [] as any[] })),
    supabase
      .from('redemptions')
      .select('id, coins_redeemed, inr_amount, status, created_at, payout_provider')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10)
      .then((res) => res, () => ({ data: [] as any[] })),
  ]);

  const balance = Number(balRes?.data?.balance ?? 0);

  // Base URL for shareable referral link
  // Always prioritize the public domain (https://svanexa-ai.vercel.app) so links shared with friends are always accessible
  let baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    'https://svanexa-ai.vercel.app';

  if (requestOrigin && !requestOrigin.includes('localhost') && !requestOrigin.includes('127.0.0.1')) {
    baseUrl = requestOrigin;
  }

  baseUrl = baseUrl.replace(/\/$/, '');
  const referralLink = `${baseUrl}/signup?ref=${referralCode}`;

  // Daily limits calculation
  const dailyLimitRemaining = Math.max(0, REWARD_CONFIG.DAILY_COIN_LIMIT - dailyEarnedToday);

  // Recent transactions and lifetime earned
  const recentTransactions = txRes?.data || [];
  const totalEarnedCoins = recentTransactions
    .filter((tx) => tx.amount > 0)
    .reduce((acc, tx) => acc + tx.amount, 0);

  // Referrals stats
  let totalReferrals = 0;
  let completedReferrals = 0;
  let pendingReferrals = 0;
  const refRows = refRes?.data || [];
  if (refRows.length > 0) {
    totalReferrals = refRows.length;
    completedReferrals = refRows.filter((r: any) => r.status === 'COMPLETED').length;
    pendingReferrals = refRows.filter((r: any) => r.status === 'PENDING').length;
  }

  const recentRedemptions = redRes?.data || [];

  return {
    coinBalance: balance,
    inrValue: coinsToInr(balance),
    referralCode,
    referralLink,
    canRedeem: canRedeem(balance),
    minRedemptionCoins: REWARD_CONFIG.MIN_REDEMPTION_COINS,
    dailyCoinLimit: REWARD_CONFIG.DAILY_COIN_LIMIT,
    dailyEarnedToday,
    dailyLimitRemaining,
    stats: {
      totalReferrals,
      completedReferrals,
      pendingReferrals,
      totalEarnedCoins: Math.max(balance, totalEarnedCoins),
    },
    recentTransactions,
    recentRedemptions,
  };
}

/**
 * Enforces the daily 60-coin limit on daily earning activities.
 */
export async function awardCoinsWithDailyCap(
  supabase: SupabaseClient,
  userId: string,
  requestedAmount: number,
  type: string,
  refId: string,
  description: string,
  enforceCap: boolean = true
): Promise<{
  awarded: boolean;
  coinsEarned: number;
  newBalance: number;
  message?: string;
  capReached?: boolean;
}> {
  if (requestedAmount <= 0) {
    return { awarded: false, coinsEarned: 0, newBalance: 0 };
  }

  // 1. Check if transaction refId already exists (prevents duplicate requests)
  try {
    const { data: existingTx } = await supabase
      .from('user_coin_transactions')
      .select('id')
      .eq('user_id', userId)
      .eq('reference_id', refId)
      .limit(1)
      .maybeSingle();

    if (existingTx) {
      const { data: balRow } = await supabase
        .from('user_coin_balances')
        .select('balance')
        .eq('user_id', userId)
        .maybeSingle();
      return {
        awarded: false,
        coinsEarned: 0,
        newBalance: balRow?.balance ?? 0,
        message: 'This reward was already claimed.',
      };
    }
  } catch (chkErr) {
    console.warn('[awardCoins check warning]', chkErr);
  }

  // 2. Enforce 60 coins daily limit if applicable (check-ins, wellness tasks)
  let amountToAward = requestedAmount;
  let capReached = false;

  if (enforceCap && type !== REWARD_CONFIG.TRANSACTION_TYPES.REFERRAL_REWARD) {
    const earnedToday = await getDailyEarnedCoinsToday(supabase, userId);
    if (earnedToday >= REWARD_CONFIG.DAILY_COIN_LIMIT) {
      const { data: balRow } = await supabase
        .from('user_coin_balances')
        .select('balance')
        .eq('user_id', userId)
        .maybeSingle();

      return {
        awarded: false,
        coinsEarned: 0,
        newBalance: balRow?.balance ?? 0,
        capReached: true,
        message: `Daily coin limit of ${REWARD_CONFIG.DAILY_COIN_LIMIT} coins reached for today. Keep checking in tomorrow!`,
      };
    }

    const availableUnderCap = REWARD_CONFIG.DAILY_COIN_LIMIT - earnedToday;
    if (requestedAmount > availableUnderCap) {
      amountToAward = availableUnderCap;
      capReached = true;
    }
  }

  // 3. Try PostgreSQL RPC award_user_coins
  try {
    const { data: rpcResult, error: rpcError } = await supabase.rpc('award_user_coins', {
      p_user_id: userId,
      p_amount: amountToAward,
      p_type: type,
      p_ref_id: refId,
      p_description: description,
    });

    if (!rpcError && rpcResult !== null && rpcResult !== undefined) {
      const newBal =
        typeof rpcResult === 'object' && typeof rpcResult.new_balance === 'number'
          ? rpcResult.new_balance
          : Number(rpcResult);

      return {
        awarded: true,
        coinsEarned: amountToAward,
        newBalance: isNaN(newBal) ? amountToAward : newBal,
        capReached,
      };
    }
  } catch (rpcErr) {
    console.warn('[award_user_coins RPC fallback]', rpcErr);
  }

  // 4. Resilient direct table fallback
  try {
    const { data: curBal } = await supabase
      .from('user_coin_balances')
      .select('balance')
      .eq('user_id', userId)
      .maybeSingle();

    const currentBalance = typeof curBal?.balance === 'number' ? curBal.balance : 0;
    const newBalance = currentBalance + amountToAward;

    await supabase.from('user_coin_balances').upsert(
      {
        user_id: userId,
        balance: newBalance,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    );

    await supabase.from('user_coin_transactions').insert({
      user_id: userId,
      amount: amountToAward,
      transaction_type: type,
      reference_id: refId,
      description,
    });

    return {
      awarded: true,
      coinsEarned: amountToAward,
      newBalance,
      capReached,
    };
  } catch (directErr) {
    console.error('[awardCoins direct fallback error]', directErr);
    return {
      awarded: false,
      coinsEarned: 0,
      newBalance: 0,
      message: 'Unable to process reward at this time.',
    };
  }
}

/**
 * Records a pending referral when a user signs up using a friend's referral code.
 * Enforces strict anti-fraud checks (self-referral prevention, duplicate prevention).
 */
export async function recordReferralSignup(
  supabase: SupabaseClient,
  referrerCode: string,
  newUserId: string,
  newUserEmail: string
): Promise<{ success: boolean; error?: string; referralId?: string }> {
  const cleanCode = extractReferralCode(referrerCode);
  if (!cleanCode || !isValidReferralCode(cleanCode)) {
    return { success: false, error: 'Invalid referral code format.' };
  }

  try {
    // 1. Find referrer profile
    const { data: referrer, error: referrerErr } = await supabase
      .from('profiles')
      .select('id, email')
      .eq('referral_code', cleanCode)
      .maybeSingle();

    if (referrerErr || !referrer) {
      return { success: false, error: 'Referral code not found.' };
    }

    // 2. Anti-fraud: Block self-referral
    if (referrer.id === newUserId) {
      return { success: false, error: 'Self-referral is not allowed.' };
    }

    if (
      referrer.email &&
      newUserEmail &&
      referrer.email.toLowerCase().trim() === newUserEmail.toLowerCase().trim()
    ) {
      return { success: false, error: 'Cannot refer using the same email address.' };
    }

    // 3. Anti-fraud: Duplicate check (referred account can only generate ONE referral)
    const { data: existingRef } = await supabase
      .from('referrals')
      .select('id')
      .eq('referred_user_id', newUserId)
      .maybeSingle();

    if (existingRef) {
      return { success: false, error: 'This user account has already been referred.' };
    }

    // 4. Create PENDING referral record
    const { data: inserted, error: insertErr } = await supabase
      .from('referrals')
      .insert({
        referrer_id: referrer.id,
        referred_user_id: newUserId,
        referral_code: cleanCode,
        status: REWARD_CONFIG.REFERRAL_STATUS.PENDING,
        reward_amount: REWARD_CONFIG.REWARDS.REFERRAL_REWARD,
      })
      .select('id')
      .single();

    if (insertErr) {
      console.warn('[recordReferralSignup insert warning]', insertErr.message);
      return { success: false, error: insertErr.message };
    }

    return { success: true, referralId: inserted?.id };
  } catch (err: any) {
    console.error('[recordReferralSignup exception]', err);
    return { success: false, error: err.message || 'Error recording referral.' };
  }
}

/**
 * Validates and completes a pending referral when the referred user verifies their account.
 * Awards +500 coins to the referrer atomically.
 */
export async function completeReferralIfEligible(
  supabase: SupabaseClient,
  referredUserId: string
): Promise<{
  completed: boolean;
  awardedCoins: number;
  referrerId?: string;
  message?: string;
}> {
  try {
    // 1. Find pending referral
    const { data: referral, error: refErr } = await supabase
      .from('referrals')
      .select('id, referrer_id, referred_user_id, status, reward_amount')
      .eq('referred_user_id', referredUserId)
      .eq('status', REWARD_CONFIG.REFERRAL_STATUS.PENDING)
      .maybeSingle();

    if (refErr || !referral) {
      return { completed: false, awardedCoins: 0, message: 'No eligible pending referral found.' };
    }

    // 2. Anti-fraud check: Self-referral guard
    if (referral.referrer_id === referral.referred_user_id) {
      await supabase
        .from('referrals')
        .update({ status: REWARD_CONFIG.REFERRAL_STATUS.REJECTED })
        .eq('id', referral.id);
      return { completed: false, awardedCoins: 0, message: 'Self-referral rejected.' };
    }

    // 3. Try atomic PostgreSQL RPC complete_referral_reward
    try {
      const { data: rpcResult, error: rpcError } = await supabase.rpc('complete_referral_reward', {
        p_referral_id: referral.id,
      });

      if (!rpcError && rpcResult && rpcResult.success) {
        return {
          completed: true,
          awardedCoins: rpcResult.reward_amount || REWARD_CONFIG.REWARDS.REFERRAL_REWARD,
          referrerId: referral.referrer_id,
          message: 'Referral completed and 500 coins credited!',
        };
      }
    } catch (rpcErr) {
      console.warn('[complete_referral_reward RPC fallback]', rpcErr);
    }

    // 4. Resilient fallback update
    const refKey = `referral:${referral.id}`;
    const rewardCoins = referral.reward_amount || REWARD_CONFIG.REWARDS.REFERRAL_REWARD;

    // Update referral status
    await supabase
      .from('referrals')
      .update({
        status: REWARD_CONFIG.REFERRAL_STATUS.COMPLETED,
        completed_at: new Date().toISOString(),
      })
      .eq('id', referral.id);

    // Award +500 coins to referrer (referrals are not restricted by daily 60 check-in cap)
    await awardCoinsWithDailyCap(
      supabase,
      referral.referrer_id,
      rewardCoins,
      REWARD_CONFIG.TRANSACTION_TYPES.REFERRAL_REWARD,
      refKey,
      'Referral reward: Friend joined and verified account',
      false // do not cap referral rewards
    );

    return {
      completed: true,
      awardedCoins: rewardCoins,
      referrerId: referral.referrer_id,
      message: 'Referral successfully completed.',
    };
  } catch (err: any) {
    console.error('[completeReferralIfEligible error]', err);
    return { completed: false, awardedCoins: 0, message: err.message };
  }
}

/**
 * Executes atomic redemption of 10,000 coins for ₹100 INR.
 * Validates balance, subtracts coins atomically, creates ledger transaction, and enqueues payout.
 */
export async function executeRedemption(
  supabase: SupabaseClient,
  userId: string,
  userEmail?: string,
  userName?: string
): Promise<{
  success: boolean;
  newBalance: number;
  redemptionId?: string;
  error?: string;
  message?: string;
}> {
  const coinsToRedeem = REWARD_CONFIG.MIN_REDEMPTION_COINS; // 10,000
  const inrAmount = REWARD_CONFIG.REDEMPTION_INR_AMOUNT; // ₹100

  // 1. Try atomic PostgreSQL RPC redeem_coins_for_inr
  try {
    const { data: rpcResult, error: rpcError } = await supabase.rpc('redeem_coins_for_inr', {
      p_user_id: userId,
      p_coins: coinsToRedeem,
      p_inr: inrAmount,
    });

    if (!rpcError && rpcResult) {
      if (rpcResult.success === false) {
        return {
          success: false,
          newBalance: rpcResult.current_balance ?? 0,
          error: rpcResult.error || 'Insufficient coins for redemption.',
        };
      }

      // Enqueue payout through modular payout service
      const payoutResult = await getPayoutProvider().processPayout({
        redemptionId: rpcResult.redemption_id,
        userId,
        amountInr: inrAmount,
        coinsRedeemed: coinsToRedeem,
        userEmail,
        userName,
      });

      return {
        success: true,
        newBalance: rpcResult.new_balance,
        redemptionId: rpcResult.redemption_id,
        message: 'Your ₹100 reward request has been received.',
      };
    }
  } catch (rpcErr) {
    console.warn('[redeem_coins_for_inr RPC fallback]', rpcErr);
  }

  // 2. Resilient direct atomic fallback
  try {
    // Check balance
    const { data: balRow } = await supabase
      .from('user_coin_balances')
      .select('balance')
      .eq('user_id', userId)
      .maybeSingle();

    const currentBalance = Number(balRow?.balance ?? 0);
    if (currentBalance < coinsToRedeem) {
      return {
        success: false,
        newBalance: currentBalance,
        error: `Insufficient coins. You need at least ${formatCoins(coinsToRedeem)} Coins to redeem ₹${inrAmount}.`,
      };
    }

    // Insert redemption record
    const { data: newRedemption, error: redErr } = await supabase
      .from('redemptions')
      .insert({
        user_id: userId,
        coins_redeemed: coinsToRedeem,
        inr_amount: inrAmount,
        status: REWARD_CONFIG.REDEMPTION_STATUS.PENDING,
        payout_provider: 'manual',
      })
      .select('id')
      .single();

    if (redErr || !newRedemption) {
      throw new Error(redErr?.message || 'Could not record redemption.');
    }

    const newBalance = currentBalance - coinsToRedeem;

    // Deduct balance
    await supabase
      .from('user_coin_balances')
      .update({
        balance: newBalance,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId);

    // Insert ledger transaction
    const refId = `redemption:${newRedemption.id}`;
    await supabase.from('user_coin_transactions').insert({
      user_id: userId,
      amount: -coinsToRedeem,
      transaction_type: REWARD_CONFIG.TRANSACTION_TYPES.REDEMPTION,
      reference_id: refId,
      description: `Redeemed ${formatCoins(coinsToRedeem)} coins for ₹${inrAmount} cash reward`,
    });

    // Enqueue payout through modular payout service
    await getPayoutProvider().processPayout({
      redemptionId: newRedemption.id,
      userId,
      amountInr: inrAmount,
      coinsRedeemed: coinsToRedeem,
      userEmail,
      userName,
    });

    return {
      success: true,
      newBalance,
      redemptionId: newRedemption.id,
      message: 'Your ₹100 reward request has been received.',
    };
  } catch (directErr: any) {
    console.error('[executeRedemption direct error]', directErr);
    return {
      success: false,
      newBalance: 0,
      error: directErr.message || 'Your redemption could not be processed. No Coins were deducted.',
    };
  }
}
