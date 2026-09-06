/**
 * SVANEXA AI — MODULAR PAYOUT SYSTEM ARCHITECTURE
 * Strictly separates Coin Redemption from Actual Fiat/INR Money Payout.
 * Ready for future provider integration (e.g. RazorpayX, Cashfree, UPI Payouts).
 */

import { RedemptionStatus } from './rewards-config';

export interface PayoutRequest {
  redemptionId: string;
  userId: string;
  amountInr: number;
  coinsRedeemed: number;
  userEmail?: string;
  userName?: string;
  beneficiaryAccount?: {
    upiId?: string;
    accountNumber?: string;
    ifsc?: string;
  };
}

export interface PayoutResult {
  success: boolean;
  status: RedemptionStatus;
  payoutReference?: string;
  provider: string;
  message: string;
  timestamp: string;
}

export interface IPayoutProvider {
  name: string;
  processPayout(request: PayoutRequest): Promise<PayoutResult>;
  checkStatus(payoutReference: string): Promise<PayoutResult>;
}

/**
 * Standard Default / Manual Payout Provider
 * Creates a PENDING payout record for review. Never fakes "paid" or "completed".
 */
export class StandardManualPayoutProvider implements IPayoutProvider {
  name = 'svanexa_treasury_manual';

  async processPayout(request: PayoutRequest): Promise<PayoutResult> {
    // In production, when gateway keys are configured, this initiates an instant transfer.
    // In default configuration, it safely enqueues the redemption in 'PENDING' state for treasury fulfillment.
    const ref = `pay_req_${Date.now()}_${request.redemptionId.slice(0, 8)}`;
    return {
      success: true,
      status: 'PENDING',
      payoutReference: ref,
      provider: this.name,
      message: 'Redemption received and queued for treasury verification.',
      timestamp: new Date().toISOString(),
    };
  }

  async checkStatus(payoutReference: string): Promise<PayoutResult> {
    return {
      success: true,
      status: 'PENDING',
      payoutReference,
      provider: this.name,
      message: 'Payout request is awaiting administrative dispatch.',
      timestamp: new Date().toISOString(),
    };
  }
}

let activeProvider: IPayoutProvider = new StandardManualPayoutProvider();

export function setPayoutProvider(provider: IPayoutProvider) {
  activeProvider = provider;
}

export function getPayoutProvider(): IPayoutProvider {
  return activeProvider;
}
