import prisma from "@/clients/prisma"
import { WalletType } from "@prisma/client"
import * as bcrypt from "bcryptjs"

const PLATFORM_EMAIL = "platform@collabrio.local"

/**
 * Returns the platform wallet, creating it (and the platform system user) if
 * it does not already exist.
 *
 * Uses `upsert` on the unique email / userId columns so concurrent callers
 * never race to create duplicate rows (fixes the P2002 error that the previous
 * `findFirst` + `create` inline pattern could trigger).
 */
export async function getOrCreatePlatformWallet() {
  // Fast path — wallet already exists
  const existing = await prisma.wallet.findFirst({
    where: { walletType: WalletType.PLATFORM },
  })
  if (existing) return existing

  // Upsert on the unique email so a concurrent second call reuses the same user
  // instead of racing to create a duplicate.
  const platformUser = await prisma.user.upsert({
    where: { email: PLATFORM_EMAIL },
    update: {},
    create: {
      email: PLATFORM_EMAIL,
      username: "collabrio_platform",
      passwordHash: await bcrypt.hash(
        process.env.PLATFORM_SEED_PASSWORD ?? "PlatformAdmin@2026",
        10
      ),
      userType: "BRAND",
      onboarding: "COMPLETE",
    },
  })

  // Wallet.userId is unique — upsert instead of create so a losing race reuses the row.
  return prisma.wallet.upsert({
    where: { userId: platformUser.id },
    update: {},
    create: {
      userId: platformUser.id,
      walletType: WalletType.PLATFORM,
      currentBalance: 0,
      pendingBalance: 0,
      totalEarned: 0,
      totalSpent: 0,
    },
  })
}
