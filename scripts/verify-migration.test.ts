import { describe, it, expect, vi, beforeAll, afterAll } from "vitest"
import prisma from "../clients/prisma"
import { getOrCreatePlatformWallet } from "../clients/platformWallet"
import crypto from "crypto"
import { PaymentStatus, TransactionStatus, TransactionType } from "@prisma/client"

vi.setConfig({ testTimeout: 15000 })

// Mock NextAuth
vi.mock("next-auth/next", () => ({
  getServerSession: vi.fn()
}))
import { getServerSession } from "next-auth/next"

import { PATCH as approveHandler } from "../app/api/brand/content/[collabId]/route"
import { PATCH as cancelHandler } from "../app/api/brand/dashboard/route"
import { POST as webhookHandler } from "../app/api/razorpay/webhook/route"
import { POST as payoutHandler } from "../app/api/razorpay/payout/route"
import { GET as cronHandler } from "../app/api/cron/snapshot/route"

const WEBHOOK_SECRET = "test_webhook_secret"
const CRON_SECRET = "test_cron_secret"

describe("Migration Verifications", () => {
  let platformWallet: any;
  let testUsers: any[] = [];
  let testPackages: any[] = [];
  let testCollabs: any[] = [];
  let testAccounts: any[] = [];
  
  beforeAll(async () => {
    process.env.RAZORPAY_WEBHOOK_SECRET = WEBHOOK_SECRET
    process.env.CRON_SECRET = CRON_SECRET
    platformWallet = await getOrCreatePlatformWallet()
  })
  
  afterAll(async () => {
    // Cleanup generated mock entities in reverse dependency order
    const accountIds = testAccounts.map(a => a.id)
    const igAccountIds = testAccounts.map(a => a.igAccountId)
    const collabIds = testCollabs.map(c => c.id)
    const pkgIds = testPackages.map(p => p.id)
    const userIds = testUsers.map(u => u.id)

    if (igAccountIds.length > 0) {
      await prisma.analyticsJob.deleteMany({ where: { igAccountId: { in: igAccountIds } } })
    }
    if (accountIds.length > 0) {
      await prisma.creatorSocialAccount.deleteMany({ where: { id: { in: accountIds } } })
    }
    
    if (collabIds.length > 0) {
      await prisma.sagaLog.deleteMany({ where: { collabId: { in: collabIds } } })
      await prisma.transaction.deleteMany({ where: { collabId: { in: collabIds } } })
      await prisma.packageCollaboration.deleteMany({ where: { collabId: { in: collabIds } } })
      await prisma.collaboration.deleteMany({ where: { id: { in: collabIds } } })
    }
    
    if (pkgIds.length > 0) {
      await prisma.package.deleteMany({ where: { id: { in: pkgIds } } })
    }

    if (userIds.length > 0) {
      // Prisma user deletion (cascades profiles and wallets if configured, or just deletes them)
      for (const uid of userIds) {
        await prisma.user.delete({ where: { id: uid } }).catch(() => {})
      }
    }
  })

  const createMockEntities = async () => {
    const nonce = crypto.randomBytes(4).toString("hex")
    const creatorUser = await prisma.user.create({
      data: {
        email: `creator_${nonce}@test.com`,
        username: `creator_${nonce}`,
        passwordHash: "dummy",
        userType: "CREATOR",
        wallet: { create: { walletType: "CREATOR", currentBalance: 0, pendingBalance: 0, totalEarned: 0, totalSpent: 0 } },
        creatorProfile: { create: { niche: "Testing" } }
      },
      include: { wallet: true, creatorProfile: true }
    })

    const brandUser = await prisma.user.create({
      data: {
        email: `brand_${nonce}@test.com`,
        username: `brand_${nonce}`,
        passwordHash: "dummy",
        userType: "BRAND",
        wallet: { create: { walletType: "BRAND", currentBalance: 1000, pendingBalance: 0, totalEarned: 0, totalSpent: 0 } },
        brandProfile: { create: { bio: "Testing" } }
      },
      include: { wallet: true, brandProfile: true }
    })
    testUsers.push(creatorUser, brandUser)

    const pkg = await prisma.package.create({
      data: {
        creatorId: creatorUser.creatorProfile!.id,
        title: "Test Package",
        price: 1000,
        mediaType: "REEL",
        deliveryTimeDays: 7
      }
    })
    testPackages.push(pkg)

    const collab = await prisma.collaboration.create({
      data: {
        brandId: brandUser.brandProfile!.id,
        creatorId: creatorUser.creatorProfile!.id,
        packageId: pkg.id,
        collabStatus: "ACTIVE",
        PaymentStatus: "PLATFORM_HOLD",
        content: {
          create: {
            packageId: pkg.id,
            contentStatus: "SUBMITTED",
            PaymentStatus: "PLATFORM_HOLD",
            contentDraft: [{ url: "test", type: "vid" }]
          }
        }
      }
    })
    testCollabs.push(collab)

    return { creatorUser, brandUser, pkg, collab }
  }

  it("should prevent double payout on concurrent approve (Idempotency Guard)", async () => {
    const { brandUser, creatorUser, collab, pkg } = await createMockEntities()
    
    // Simulate Razorpay verify having put 1000 in platform pending
    await prisma.wallet.update({
      where: { id: platformWallet.id },
      data: { pendingBalance: { increment: 1000 } }
    })
    await prisma.wallet.update({
      where: { id: brandUser.wallet!.id },
      data: { currentBalance: 0, totalSpent: 1000 }
    })
    const initialPlatformPending = (await prisma.wallet.findUnique({ where: { id: platformWallet.id } }))!.pendingBalance
    
    // Mock Session as Brand
    vi.mocked(getServerSession).mockResolvedValue({ user: { id: brandUser.id, role: "BRAND" } } as any)
    
    const req1 = new Request(`http://localhost:3000/api/brand/content/${collab.id}`, { method: "PATCH", body: JSON.stringify({ action: "approve" }) })
    const req2 = new Request(`http://localhost:3000/api/brand/content/${collab.id}`, { method: "PATCH", body: JSON.stringify({ action: "approve" }) })
    
    // FIRE RACE CONDITION
    const [res1, res2] = await Promise.all([
      approveHandler(req1 as any, { params: Promise.resolve({ collabId: collab.id }) } as any),
      approveHandler(req2 as any, { params: Promise.resolve({ collabId: collab.id }) } as any)
    ])
    
    expect(res1.status === 200 || res2.status === 200).toBe(true)
    
    // ASSERTIONS
    const finalCreatorWallet = await prisma.wallet.findUnique({ where: { id: creatorUser.wallet!.id } })
    const expectedCreatorCredit = 900 // 1000 - 10%
    expect(finalCreatorWallet!.currentBalance.toNumber()).toBe(expectedCreatorCredit)
    
    // Assert exactly 1 creator earning transaction
    const txCount = await prisma.transaction.count({
      where: { collabId: collab.id, type: TransactionType.CREATOR_EARNING }
    })
    expect(txCount).toBe(1)
    
    // Assert Platform Pending went down by exactly 1000
    const finalPlatformWallet = await prisma.wallet.findUnique({ where: { id: platformWallet.id } })
    expect(initialPlatformPending.sub(finalPlatformWallet!.pendingBalance).toNumber()).toBe(1000)
    
    // Assert exactly 2 SagaLog rows with the correct terminal statuses
    const sagas = await prisma.sagaLog.findMany({ where: { collabId: collab.id } })
    expect(sagas.length).toBe(2)
    expect(sagas.some(s => s.step === "RELEASE_ESCROW")).toBe(true)
    expect(sagas.some(s => s.step === "ALREADY_APPROVED")).toBe(true)
  })

  it("should prevent double refund on concurrent cancel", async () => {
    const { brandUser, collab } = await createMockEntities()
    
    await prisma.wallet.update({
      where: { id: platformWallet.id },
      data: { pendingBalance: { increment: 1000 } }
    })
    await prisma.wallet.update({
      where: { id: brandUser.wallet!.id },
      data: { currentBalance: 0, totalSpent: 1000 }
    })
    const initialPlatformPending = (await prisma.wallet.findUnique({ where: { id: platformWallet.id } }))!.pendingBalance
    
    vi.mocked(getServerSession).mockResolvedValue({ user: { id: brandUser.id, role: "BRAND" } } as any)
    
    const body = JSON.stringify({ collabId: collab.id, action: "cancel" })
    const req1 = new Request(`http://localhost/api/brand/dashboard`, { method: "PATCH", body })
    const req2 = new Request(`http://localhost/api/brand/dashboard`, { method: "PATCH", body })
    
    const [res1, res2] = await Promise.all([
      cancelHandler(req1 as any),
      cancelHandler(req2 as any)
    ])
    
    expect(res1.status === 200 || res2.status === 200).toBe(true)
    
    // Assert exactly 1 refund
    const txCount = await prisma.transaction.count({
      where: { collabId: collab.id, type: TransactionType.REFUND }
    })
    expect(txCount).toBe(1)
    
    const finalBrandWallet = await prisma.wallet.findUnique({ where: { id: brandUser.wallet!.id } })
    expect(finalBrandWallet!.totalSpent.toNumber()).toBe(500) // 50% refunded since draft was submitted
    expect(finalBrandWallet!.currentBalance.toNumber()).toBe(500)
    
    const finalPlatformWallet = await prisma.wallet.findUnique({ where: { id: platformWallet.id } })
    expect(initialPlatformPending.sub(finalPlatformWallet!.pendingBalance).toNumber()).toBe(1000)
  })

  it("should handle webhook correctly (fromWalletId fix)", async () => {
    // Setup a failed payout transaction in DB pointing to the brand's wallet as source
    const { brandUser, collab } = await createMockEntities()
    const poutId = "pout_" + crypto.randomBytes(4).toString("hex")
    
    const tx = await prisma.transaction.create({
      data: {
        externalPaymentId: poutId,
        amount: 1000,
        type: TransactionType.PAYOUT,
        status: TransactionStatus.PENDING,
        fromWalletId: brandUser.wallet!.id, // The wallet debited during payout
        toWalletId: platformWallet.id, // Dummy destination
        collabId: collab.id
      }
    })
    
    // Create pending saga
    const saga = await prisma.sagaLog.create({
      data: {
        sagaType: "PAYOUT",
        status: "PENDING",
        collabId: collab.id,
        step: "INITIALIZED"
      }
    })

    const payload = JSON.stringify({ 
      event: "payout.failed", 
      payload: { payout: { entity: { id: poutId, amount: 100000 } } } // amount is paise
    })
    
    const signature = crypto.createHmac("sha256", WEBHOOK_SECRET).update(payload).digest("hex")
    const req = new Request(`http://localhost/webhook`, {
      method: "POST", headers: { "x-razorpay-signature": signature }, body: payload
    })
    
    const res = await webhookHandler(req as any)
    expect(res.status).toBe(200)
    
    // Assert the Brand Wallet (fromWalletId) was credited back the 1000
    const finalBrandWallet = await prisma.wallet.findUnique({ where: { id: brandUser.wallet!.id } })
    expect(finalBrandWallet!.currentBalance.toNumber()).toBe(2000) // 1000 init + 1000 refund
    
    const finalSaga = await prisma.sagaLog.findUnique({ where: { id: saga.id } })
    expect(finalSaga!.status).toBe("COMPENSATED")
  })

  it("should push jobs to the analytics worker route (Push Model)", async () => {
    // 1. Setup mock eligible account
    const { creatorUser } = await createMockEntities()
    const account = await prisma.creatorSocialAccount.create({
      data: {
        creatorId: creatorUser.creatorProfile!.id,
        platform: "INSTAGRAM",
        connected: true,
        igAccountId: "test_ig_account_123",
        accessToken: "dummy_token"
      }
    })
    testAccounts.push(account)

    // 2. Spy on global fetch to assert processAnalyticsJobs calls it correctly
    const fetchSpy = vi.spyOn(global, "fetch").mockResolvedValue(new Response(JSON.stringify({ ok: true })))

    // 3. Trigger the cron producer
    const req = new Request(`http://localhost/api/cron/snapshot`, {
      headers: { "Authorization": `Bearer ${CRON_SECRET}` }
    })
    
    const res = await cronHandler(req as any)
    const data = await res.json()

    // 4. Assert Producer behavior
    expect(res.status).toBe(200)
    expect(data.accountsFound).toBeGreaterThanOrEqual(1)
    expect(data.jobsPushed).toBeGreaterThanOrEqual(1)

    // 5. Assert push behavior (fetch spy)
    expect(fetchSpy).toHaveBeenCalled()
    // Find the fetch call that contains our job
    let testJobId: string | null = null
    for (const call of fetchSpy.mock.calls) {
      if (typeof call[1]?.body === "string") {
        const body = JSON.parse(call[1].body)
        const job = await prisma.analyticsJob.findUnique({ where: { id: body.jobId } })
        if (job?.igAccountId === "test_ig_account_123") {
          testJobId = body.jobId
          break
        }
      }
    }
    
    expect(testJobId).toBeTruthy()
    
    // Assert DB job state
    const testJob = await prisma.analyticsJob.findUnique({ where: { id: testJobId! } })
    expect(testJob).toBeDefined()
    expect(testJob!.status).toBe("QUEUED")
    
    fetchSpy.mockRestore()
  })
})
