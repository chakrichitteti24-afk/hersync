/**
 * SVANEXA AI — CENTRALIZED REWARD & COIN CONFIGURATION
 * Single source of truth for reward rules, conversion rates, and transaction types.
 */

export const REWARD_CONFIG = {
  // Official Conversion Rate: 10,000 Coins = ₹100 => 100 Coins = ₹1
  COIN_TO_INR_RATIO: 100,
  MIN_REDEMPTION_COINS: 10000,
  REDEMPTION_INR_AMOUNT: 100,

  // Daily earning limits: Max 60 coins per day from daily activities (check-ins, daily tasks)
  DAILY_COIN_LIMIT: 60,

  // Reward Amounts
  REWARDS: {
    DAILY_CHECKIN_SLOT: 10,
    DAILY_CHECKIN_ALL_BONUS: 10,
    REFERRAL_REWARD: 500,
    WELLNESS_TASK: 5,
  },

  // Authoritative Transaction Types
  TRANSACTION_TYPES: {
    DAILY_CHECKIN_REWARD: 'DAILY_CHECKIN_REWARD',
    REFERRAL_REWARD: 'REFERRAL_REWARD',
    REDEMPTION: 'REDEMPTION',
    ADMIN_ADJUSTMENT: 'ADMIN_ADJUSTMENT',
    STORE_PURCHASE: 'store_purchase',
    // Backwards-compatible aliases
    CHECKIN_SLOT: 'checkin_slot',
    CHECKIN_ALL_BONUS: 'checkin_all_bonus',
    WELLNESS_TASK: 'wellness_task',
  } as const,

  // Referral Statuses
  REFERRAL_STATUS: {
    PENDING: 'PENDING',
    COMPLETED: 'COMPLETED',
    REJECTED: 'REJECTED',
  } as const,

  // Redemption Statuses
  REDEMPTION_STATUS: {
    PENDING: 'PENDING',
    PROCESSING: 'PROCESSING',
    COMPLETED: 'COMPLETED',
    FAILED: 'FAILED',
  } as const,
} as const;

export type TransactionType = typeof REWARD_CONFIG.TRANSACTION_TYPES[keyof typeof REWARD_CONFIG.TRANSACTION_TYPES];
export type ReferralStatus = typeof REWARD_CONFIG.REFERRAL_STATUS[keyof typeof REWARD_CONFIG.REFERRAL_STATUS];
export type RedemptionStatus = typeof REWARD_CONFIG.REDEMPTION_STATUS[keyof typeof REWARD_CONFIG.REDEMPTION_STATUS];

/**
 * Converts a coin amount to INR.
 * 100 Coins = ₹1
 */
export function coinsToInr(coins: number): number {
  if (!coins || coins <= 0) return 0;
  return Math.floor(coins / REWARD_CONFIG.COIN_TO_INR_RATIO);
}

/**
 * Converts INR to equivalent coins.
 * ₹1 = 100 Coins
 */
export function inrToCoins(inr: number): number {
  if (!inr || inr <= 0) return 0;
  return Math.floor(inr * REWARD_CONFIG.COIN_TO_INR_RATIO);
}

/**
 * Formats a coin balance with thousands separators (e.g., 7500 -> "7,500").
 */
export function formatCoins(coins: number): string {
  const validNum = typeof coins === 'number' && !isNaN(coins) ? coins : 0;
  return new Intl.NumberFormat('en-IN').format(validNum);
}

/**
 * Checks whether the balance qualifies for minimum cash redemption.
 */
export function canRedeem(coins: number): boolean {
  return typeof coins === 'number' && coins >= REWARD_CONFIG.MIN_REDEMPTION_COINS;
}

/**
 * Extracts a referral code (SVX-XXXXXX) from raw user input, query strings, or full URLs.
 * Handles:
 * - "SVX-PM5UEK"
 * - "svx-pm5uek"
 * - "https://svanexa-ai.vercel.app/signup?ref=SVX-PM5UEK"
 * - "http://localhost:3000/signup?ref=SVX-PM5UEK"
 */
export function extractReferralCode(input?: string | null): string | null {
  if (!input || typeof input !== 'string') return null;
  const match = input.match(/SVX-[A-Z0-9]{6}/i);
  return match ? match[0].toUpperCase() : null;
}

/**
 * Validates the format of a user referral code (SVX-XXXXXX).
 */
export function isValidReferralCode(code?: string | null): boolean {
  if (!code || typeof code !== 'string') return false;
  return /^SVX-[A-Z0-9]{6}$/i.test(code.trim());
}

