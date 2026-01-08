/*
  Warnings:

  - Added the required column `agreedPrice` to the `WalkAssignment` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'TRANSFER', 'OTHER');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('UNPAID', 'PAID');

-- CreateEnum
CREATE TYPE "PlatformFeeStatus" AS ENUM ('DUE', 'SETTLED');

-- AlterTable
ALTER TABLE "WalkAssignment" ADD COLUMN     "agreedPrice" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "paidAt" TIMESTAMP(3),
ADD COLUMN     "paymentMethod" "PaymentMethod" NOT NULL DEFAULT 'OTHER',
ADD COLUMN     "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'UNPAID',
ADD COLUMN     "platformFeeAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "platformFeeRate" DOUBLE PRECISION NOT NULL DEFAULT 0.15,
ADD COLUMN     "platformFeeSettledAt" TIMESTAMP(3),
ADD COLUMN     "platformFeeStatus" "PlatformFeeStatus" NOT NULL DEFAULT 'DUE';
