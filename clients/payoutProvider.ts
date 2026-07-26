/**
 * Payout provider abstraction.
 *
 * Right now the only implementation (`RazorpayPayoutProvider`) throws because
 * real payouts require the platform to complete Razorpay business KYC / fund
 * account onboarding.  Once that's done, swap in a real implementation without
 * touching any call sites.
 */

export interface PayoutResult {
  payoutId: string
  status: "PROCESSED" | "PENDING" | "FAILED"
}

export interface PayoutProvider {
  initiatePayout(params: {
    fundAccountId: string
    amountPaise: number
    collabId: string
  }): Promise<PayoutResult>
}

/**
 * Current implementation — not onboarded for real payouts.
 */
export class RazorpayPayoutProvider implements PayoutProvider {
  async initiatePayout(_params: {
    fundAccountId: string
    amountPaise: number
    collabId: string
  }): Promise<PayoutResult> {
    throw new ProviderNotOnboardedError(
      "Razorpay payouts require business KYC and fund_account onboarding — not available for this account."
    )
  }
}

/**
 * Thrown when the provider is not yet onboarded for real payouts.
 * Callers can catch this specifically to return a 501 to the client.
 */
export class ProviderNotOnboardedError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "ProviderNotOnboardedError"
  }
}
