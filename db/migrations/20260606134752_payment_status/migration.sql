-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('UNPAID', 'BRAND_PAID', 'PLATFORM_HOLD', 'CREATOR_PAID', 'REFUNDED');

-- AlterTable
ALTER TABLE "Collaboration" ADD COLUMN     "PaymentStatus" "PaymentStatus" NOT NULL DEFAULT 'UNPAID';

-- AlterTable
ALTER TABLE "PackageCollaboration" ADD COLUMN     "PaymentStatus" "PaymentStatus" NOT NULL DEFAULT 'UNPAID';
