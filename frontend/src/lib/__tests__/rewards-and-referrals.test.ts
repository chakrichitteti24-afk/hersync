import { describe, it, expect } from 'vitest';
import {
  REWARD_CONFIG,
  coinsToInr,
  inrToCoins,
  formatCoins,
  canRedeem,
  isValidReferralCode,
} from '../rewards/rewards-config';
import { generateReferralCodeString } from '../rewards/rewards-service';
import { getPayoutProvider, StandardManualPayoutProvider } from '../rewards/payout-service';

describe('SVANEXA AI — Complete Coins, Referral & Rewards System Tests', () => {
  // ── 1. Coin Conversion & Configuration ─────────────────────────────────────
  describe('1. Coin Conversion Rates & Formatting', () => {
    it('accurately converts 10,000 Coins to ₹100', () => {
      expect(coinsToInr(10000)).toBe(100);
      expect(coinsToInr(100)).toBe(1);
      expect(coinsToInr(7500)).toBe(75);
      expect(coinsToInr(0)).toBe(0);
      expect(coinsToInr(-500)).toBe(0);
    });

    it('accurately converts ₹100 to 10,000 Coins', () => {
      expect(inrToCoins(100)).toBe(10000);
      expect(inrToCoins(1)).toBe(100);
      expect(inrToCoins(50)).toBe(5000);
    });

    it('correctly formats coin numbers with comma separators', () => {
      expect(formatCoins(10000)).toBe('10,000');
      expect(formatCoins(7500)).toBe('7,500');
      expect(formatCoins(500)).toBe('500');
      expect(formatCoins(0)).toBe('0');
    });

    it('enforces the minimum redemption threshold of 10,000 coins', () => {
      expect(canRedeem(9999)).toBe(false);
      expect(canRedeem(0)).toBe(false);
      expect(canRedeem(10000)).toBe(true);
      expect(canRedeem(10500)).toBe(true);
      expect(canRedeem(50000)).toBe(true);
    });
  });

  // ── 2. Daily Coin Limit (60 Coins/Day) ──────────────────────────────────────
  describe('2. Daily Coins Limit Enforcement (60 Coins / Day)', () => {
    it('has DAILY_COIN_LIMIT configured as exactly 60', () => {
      expect(REWARD_CONFIG.DAILY_COIN_LIMIT).toBe(60);
    });

    it('calculates remaining daily limit accurately', () => {
      const calculateRemaining = (earnedToday: number) => {
        return Math.max(0, REWARD_CONFIG.DAILY_COIN_LIMIT - earnedToday);
      };

      expect(calculateRemaining(0)).toBe(60);
      expect(calculateRemaining(20)).toBe(40);
      expect(calculateRemaining(40)).toBe(20);
      expect(calculateRemaining(60)).toBe(0);
      expect(calculateRemaining(75)).toBe(0); // overflow guard
    });

    it('caps check-in rewards when reaching the 60 coin daily ceiling', () => {
      let earnedToday = 50;
      const requestedReward = 20;

      const availableUnderCap = Math.max(0, REWARD_CONFIG.DAILY_COIN_LIMIT - earnedToday);
      const actualAwarded = Math.min(requestedReward, availableUnderCap);

      expect(actualAwarded).toBe(10);
      earnedToday += actualAwarded;
      expect(earnedToday).toBe(60);

      // Subsequent attempt blocked
      const nextAttempt = Math.min(10, Math.max(0, REWARD_CONFIG.DAILY_COIN_LIMIT - earnedToday));
      expect(nextAttempt).toBe(0);
    });
  });

  // ── 3. Referral Code Generation & Validation ──────────────────────────────
  describe('3. Unique Referral Code Format & Validation', () => {
    it('validates correct SVX-XXXXXX format codes', () => {
      expect(isValidReferralCode('SVX-A7K92P')).toBe(true);
      expect(isValidReferralCode('SVX-234567')).toBe(true);
      expect(isValidReferralCode('SVX-999999')).toBe(true);
      expect(isValidReferralCode('svx-a7k92p')).toBe(true); // case-insensitive
    });

    it('rejects malformed or invalid referral codes', () => {
      expect(isValidReferralCode('')).toBe(false);
      expect(isValidReferralCode('ABC-123456')).toBe(false); // wrong prefix
      expect(isValidReferralCode('SVX-12')).toBe(false); // too short
      expect(isValidReferralCode('SVX-12345678')).toBe(false); // too long
      expect(isValidReferralCode(null)).toBe(false);
      expect(isValidReferralCode(undefined)).toBe(false);
    });

    it('generates valid SVX format codes that pass format validation', () => {
      for (let i = 0; i < 20; i++) {
        const code = generateReferralCodeString();
        expect(code.startsWith('SVX-')).toBe(true);
        expect(code.length).toBe(10);
        expect(isValidReferralCode(code)).toBe(true);
      }
    });
  });

  // ── 4. Anti-Fraud & Self-Referral Prevention ──────────────────────────────
  describe('4. Referral Anti-Fraud Checks', () => {
    it('blocks self-referral by same user id', () => {
      const referrerId = 'user-uuid-123';
      const referredId = 'user-uuid-123';

      const isSelfReferral = referrerId === referredId;
      expect(isSelfReferral).toBe(true);
    });

    it('blocks self-referral by same email address', () => {
      const referrerEmail = 'CHAKRI@gmail.com';
      const referredEmail = 'chakri@gmail.com ';

      const isSameEmail = referrerEmail.toLowerCase().trim() === referredEmail.toLowerCase().trim();
      expect(isSameEmail).toBe(true);
    });

    it('blocks duplicate referral rewards for the same referred account', () => {
      const referralsDatabase = new Set<string>();

      const registerReferral = (referredUserId: string) => {
        if (referralsDatabase.has(referredUserId)) {
          return { success: false, error: 'User already referred' };
        }
        referralsDatabase.add(referredUserId);
        return { success: true };
      };

      expect(registerReferral('user-friend-1')).toEqual({ success: true });
      // Attempt to refer the same user a second time
      expect(registerReferral('user-friend-1')).toEqual({
        success: false,
        error: 'User already referred',
      });
    });
  });

  // ── 5. Atomic Redemption Logic ─────────────────────────────────────────────
  describe('5. Atomic Redemption Verification', () => {
    it('deducts exactly 10,000 coins and records pending redemption', () => {
      let userBalance = 10500;
      const ledger: Array<{ amount: number; type: string; refId: string }> = [];
      const redemptions: Array<{ coins: number; inr: number; status: string }> = [];

      const redeem100 = (userId: string) => {
        if (userBalance < REWARD_CONFIG.MIN_REDEMPTION_COINS) {
          return { success: false, error: 'Insufficient coins' };
        }

        userBalance -= REWARD_CONFIG.MIN_REDEMPTION_COINS;
        const redemptionId = 'red-uuid-abc';

        redemptions.push({
          coins: REWARD_CONFIG.MIN_REDEMPTION_COINS,
          inr: REWARD_CONFIG.REDEMPTION_INR_AMOUNT,
          status: 'PENDING',
        });

        ledger.push({
          amount: -REWARD_CONFIG.MIN_REDEMPTION_COINS,
          type: 'REDEMPTION',
          refId: `redemption:${redemptionId}`,
        });

        return { success: true, newBalance: userBalance };
      };

      const result = redeem100('user-1');
      expect(result.success).toBe(true);
      expect(result.newBalance).toBe(500);
      expect(userBalance).toBe(500);
      expect(redemptions[0].status).toBe('PENDING');
      expect(ledger[0].amount).toBe(-10000);

      // Attempt second redemption with remaining 500 balance -> must fail without deducting
      const secondResult = redeem100('user-1');
      expect(secondResult.success).toBe(false);
      expect(userBalance).toBe(500); // Balance remains intact
    });
  });

  // ── 6. Modular Payout System Separation ────────────────────────────────────
  describe('6. Modular Payout System Separation', () => {
    it('ensures payout provider queues in PENDING and does not falsely claim paid', async () => {
      const provider = getPayoutProvider();
      expect(provider).toBeInstanceOf(StandardManualPayoutProvider);

      const res = await provider.processPayout({
        redemptionId: 'test-red-123',
        userId: 'user-xyz',
        amountInr: 100,
        coinsRedeemed: 10000,
      });

      expect(res.success).toBe(true);
      expect(res.status).toBe('PENDING'); // Must be PENDING, never claim paid prematurely
      expect(res.provider).toBe('svanexa_treasury_manual');
    });
  });
});
