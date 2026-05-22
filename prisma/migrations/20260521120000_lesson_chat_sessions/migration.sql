-- AlterTable
ALTER TABLE "Lesson"
ADD COLUMN "actualStartedAt" TIMESTAMP(3),
ADD COLUMN "actualEndedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "ChatThread"
ADD COLUMN "lessonId" TEXT;

-- AlterTable
ALTER TABLE "ChatMessage"
ADD COLUMN "senderName" TEXT,
ADD COLUMN "senderRole" "UserRole";

-- CreateIndex
CREATE UNIQUE INDEX "ChatThread_lessonId_key" ON "ChatThread"("lessonId");

-- AddForeignKey
ALTER TABLE "ChatThread" ADD CONSTRAINT "ChatThread_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;
