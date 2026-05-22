-- CreateTable
CREATE TABLE "LessonPresence" (
    "id" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "connectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "disconnectedAt" TIMESTAMP(3),

    CONSTRAINT "LessonPresence_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LessonPresence_lessonId_participantId_role_key" ON "LessonPresence"("lessonId", "participantId", "role");

-- CreateIndex
CREATE INDEX "LessonPresence_lessonId_role_lastSeenAt_idx" ON "LessonPresence"("lessonId", "role", "lastSeenAt");

-- AddForeignKey
ALTER TABLE "LessonPresence" ADD CONSTRAINT "LessonPresence_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AlterTable
ALTER TABLE "Lesson"
ADD COLUMN "transcriptRetainUntil" TIMESTAMP(3),
ADD COLUMN "transcriptPurgedAt" TIMESTAMP(3);
