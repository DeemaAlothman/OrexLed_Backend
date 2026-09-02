-- CreateEnum
CREATE TYPE "VideoStyle" AS ENUM ('REALISTIC', 'CINEMATIC', 'ANIMATED', 'MINIMAL');

-- CreateEnum
CREATE TYPE "VideoAspectRatio" AS ENUM ('LANDSCAPE', 'PORTRAIT');

-- CreateEnum
CREATE TYPE "VideoGenerationStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

-- CreateTable
CREATE TABLE "video_generations" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "style" "VideoStyle",
    "aspectRatio" "VideoAspectRatio" NOT NULL DEFAULT 'LANDSCAPE',
    "imagePath" TEXT,
    "status" "VideoGenerationStatus" NOT NULL DEFAULT 'PENDING',
    "videoPath" TEXT,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "video_generations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "video_generations_userId_idx" ON "video_generations"("userId");

-- AddForeignKey
ALTER TABLE "video_generations" ADD CONSTRAINT "video_generations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
