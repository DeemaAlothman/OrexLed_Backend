-- CreateTable
CREATE TABLE "projects" (
    "id" TEXT NOT NULL,
    "imagePath" TEXT NOT NULL,
    "videoPath" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);
