/*
  Warnings:

  - A unique constraint covering the columns `[dniNumber]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `updatedAt` to the `Offer` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('PENDING', 'VERIFIED', 'REJECTED');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('WALK_REQUEST_CREATED', 'OFFER_RECEIVED', 'OFFER_ACCEPTED', 'WALK_ASSIGNED', 'WALK_CANCELLED', 'WALK_STARTED', 'WALK_COMPLETED', 'REVIEW_RECEIVED');

-- CreateEnum
CREATE TYPE "EnergyLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- AlterEnum
ALTER TYPE "WalkAssignmentStatus" ADD VALUE 'IN_PROGRESS';

-- AlterEnum
ALTER TYPE "WalkRequestStatus" ADD VALUE 'IN_PROGRESS';

-- AlterTable
ALTER TABLE "Dog" ADD COLUMN     "breed" TEXT,
ADD COLUMN     "energyLevel" "EnergyLevel" NOT NULL DEFAULT 'MEDIUM',
ADD COLUMN     "needsMuzzle" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "notesForWalker" TEXT,
ADD COLUMN     "photoUrl" TEXT,
ADD COLUMN     "pullsLeash" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "reactiveWithDogs" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "reactiveWithPeople" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "behavior" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Offer" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "Review" ADD COLUMN     "walkerId" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "acceptsLarge" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "acceptsMedium" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "acceptsSmall" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "addressReference" TEXT,
ADD COLUMN     "addressType" TEXT,
ADD COLUMN     "baseCity" TEXT,
ADD COLUMN     "baseZone" TEXT,
ADD COLUMN     "dniBackPhotoUrl" TEXT,
ADD COLUMN     "dniFrontPhotoUrl" TEXT,
ADD COLUMN     "dniNumber" TEXT,
ADD COLUMN     "experienceText" TEXT,
ADD COLUMN     "isAvailable" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "isVerifiedWalker" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "latitude" DOUBLE PRECISION,
ADD COLUMN     "longitude" DOUBLE PRECISION,
ADD COLUMN     "maxDogsAtOnce" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "profilePhotoUrl" TEXT,
ADD COLUMN     "serviceRadiusKm" INTEGER NOT NULL DEFAULT 5,
ADD COLUMN     "termsAccepted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "verificationStatus" "VerificationStatus" NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "WalkAssignment" ADD COLUMN     "actualDurationMinutes" INTEGER,
ADD COLUMN     "behaviorRating" TEXT,
ADD COLUMN     "cancelReason" TEXT,
ADD COLUMN     "cancelledAt" TIMESTAMP(3),
ADD COLUMN     "cancelledBy" TEXT,
ADD COLUMN     "didPee" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "didPoop" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "earlyEndReason" TEXT,
ADD COLUMN     "reportNotes" TEXT;

-- AlterTable
ALTER TABLE "WalkRequest" ADD COLUMN     "addressReference" TEXT,
ADD COLUMN     "addressType" TEXT,
ADD COLUMN     "city" TEXT,
ADD COLUMN     "country" TEXT,
ADD COLUMN     "latitude" DOUBLE PRECISION,
ADD COLUMN     "longitude" DOUBLE PRECISION;

-- CreateTable
CREATE TABLE "LegalAcceptance" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "termsVersion" TEXT NOT NULL,
    "acceptedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ipAddress" TEXT,
    "userAgent" TEXT,

    CONSTRAINT "LegalAcceptance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupportTicket" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SupportTicket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WalkPhoto" (
    "id" TEXT NOT NULL,
    "walkAssignmentId" TEXT NOT NULL,
    "uploaderId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WalkPhoto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FavoriteWalker" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "walkerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FavoriteWalker_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BlockedWalker" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "walkerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BlockedWalker_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL,
    "walkRequestId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "receiverId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "link" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LegalAcceptance_userId_idx" ON "LegalAcceptance"("userId");

-- CreateIndex
CREATE INDEX "SupportTicket_userId_idx" ON "SupportTicket"("userId");

-- CreateIndex
CREATE INDEX "WalkPhoto_walkAssignmentId_idx" ON "WalkPhoto"("walkAssignmentId");

-- CreateIndex
CREATE INDEX "FavoriteWalker_ownerId_idx" ON "FavoriteWalker"("ownerId");

-- CreateIndex
CREATE UNIQUE INDEX "FavoriteWalker_ownerId_walkerId_key" ON "FavoriteWalker"("ownerId", "walkerId");

-- CreateIndex
CREATE INDEX "BlockedWalker_ownerId_idx" ON "BlockedWalker"("ownerId");

-- CreateIndex
CREATE UNIQUE INDEX "BlockedWalker_ownerId_walkerId_key" ON "BlockedWalker"("ownerId", "walkerId");

-- CreateIndex
CREATE INDEX "Message_walkRequestId_idx" ON "Message"("walkRequestId");

-- CreateIndex
CREATE INDEX "Notification_userId_idx" ON "Notification"("userId");

-- CreateIndex
CREATE INDEX "Notification_isRead_idx" ON "Notification"("isRead");

-- CreateIndex
CREATE INDEX "Review_walkerId_idx" ON "Review"("walkerId");

-- CreateIndex
CREATE UNIQUE INDEX "User_dniNumber_key" ON "User"("dniNumber");

-- AddForeignKey
ALTER TABLE "LegalAcceptance" ADD CONSTRAINT "LegalAcceptance_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportTicket" ADD CONSTRAINT "SupportTicket_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WalkPhoto" ADD CONSTRAINT "WalkPhoto_walkAssignmentId_fkey" FOREIGN KEY ("walkAssignmentId") REFERENCES "WalkAssignment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_walkerId_fkey" FOREIGN KEY ("walkerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FavoriteWalker" ADD CONSTRAINT "FavoriteWalker_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FavoriteWalker" ADD CONSTRAINT "FavoriteWalker_walkerId_fkey" FOREIGN KEY ("walkerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlockedWalker" ADD CONSTRAINT "BlockedWalker_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlockedWalker" ADD CONSTRAINT "BlockedWalker_walkerId_fkey" FOREIGN KEY ("walkerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_walkRequestId_fkey" FOREIGN KEY ("walkRequestId") REFERENCES "WalkRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
