-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('OWNER', 'WALKER');

-- CreateEnum
CREATE TYPE "DogSize" AS ENUM ('SMALL', 'MEDIUM', 'LARGE');

-- CreateEnum
CREATE TYPE "WalkRequestStatus" AS ENUM ('OPEN', 'ASSIGNED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "OfferStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED');

-- CreateEnum
CREATE TYPE "WalkAssignmentStatus" AS ENUM ('PENDING', 'COMPLETED', 'CANCELLED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "bio" TEXT,
    "city" TEXT NOT NULL,
    "zone" TEXT NOT NULL,
    "averageRating" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Dog" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "size" "DogSize" NOT NULL,
    "behavior" TEXT NOT NULL,
    "age" INTEGER,
    "specialNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Dog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WalkRequest" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "dogId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "startTime" TEXT NOT NULL,
    "durationMinutes" INTEGER NOT NULL,
    "zone" TEXT NOT NULL,
    "suggestedPrice" DOUBLE PRECISION NOT NULL,
    "status" "WalkRequestStatus" NOT NULL DEFAULT 'OPEN',
    "details" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WalkRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Offer" (
    "id" TEXT NOT NULL,
    "walkRequestId" TEXT NOT NULL,
    "walkerId" TEXT NOT NULL,
    "offeredPrice" DOUBLE PRECISION NOT NULL,
    "message" TEXT,
    "status" "OfferStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Offer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WalkAssignment" (
    "id" TEXT NOT NULL,
    "walkRequestId" TEXT NOT NULL,
    "walkerId" TEXT NOT NULL,
    "status" "WalkAssignmentStatus" NOT NULL DEFAULT 'PENDING',
    "actualStartTime" TIMESTAMP(3),
    "actualEndTime" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WalkAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Review" (
    "id" TEXT NOT NULL,
    "walkAssignmentId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_city_zone_idx" ON "User"("city", "zone");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE INDEX "Dog_ownerId_idx" ON "Dog"("ownerId");

-- CreateIndex
CREATE INDEX "WalkRequest_ownerId_idx" ON "WalkRequest"("ownerId");

-- CreateIndex
CREATE INDEX "WalkRequest_status_date_idx" ON "WalkRequest"("status", "date");

-- CreateIndex
CREATE INDEX "WalkRequest_zone_idx" ON "WalkRequest"("zone");

-- CreateIndex
CREATE INDEX "Offer_walkRequestId_idx" ON "Offer"("walkRequestId");

-- CreateIndex
CREATE INDEX "Offer_walkerId_idx" ON "Offer"("walkerId");

-- CreateIndex
CREATE UNIQUE INDEX "Offer_walkRequestId_walkerId_key" ON "Offer"("walkRequestId", "walkerId");

-- CreateIndex
CREATE UNIQUE INDEX "WalkAssignment_walkRequestId_key" ON "WalkAssignment"("walkRequestId");

-- CreateIndex
CREATE INDEX "WalkAssignment_walkerId_idx" ON "WalkAssignment"("walkerId");

-- CreateIndex
CREATE INDEX "WalkAssignment_status_idx" ON "WalkAssignment"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Review_walkAssignmentId_key" ON "Review"("walkAssignmentId");

-- CreateIndex
CREATE INDEX "Review_authorId_idx" ON "Review"("authorId");

-- AddForeignKey
ALTER TABLE "Dog" ADD CONSTRAINT "Dog_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WalkRequest" ADD CONSTRAINT "WalkRequest_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WalkRequest" ADD CONSTRAINT "WalkRequest_dogId_fkey" FOREIGN KEY ("dogId") REFERENCES "Dog"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Offer" ADD CONSTRAINT "Offer_walkRequestId_fkey" FOREIGN KEY ("walkRequestId") REFERENCES "WalkRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Offer" ADD CONSTRAINT "Offer_walkerId_fkey" FOREIGN KEY ("walkerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WalkAssignment" ADD CONSTRAINT "WalkAssignment_walkRequestId_fkey" FOREIGN KEY ("walkRequestId") REFERENCES "WalkRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WalkAssignment" ADD CONSTRAINT "WalkAssignment_walkerId_fkey" FOREIGN KEY ("walkerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_walkAssignmentId_fkey" FOREIGN KEY ("walkAssignmentId") REFERENCES "WalkAssignment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
