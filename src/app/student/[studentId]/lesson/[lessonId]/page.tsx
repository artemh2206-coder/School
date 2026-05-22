import { notFound } from "next/navigation";
import { Suspense } from "react";
import { LessonRoomShell } from "@/components/LessonRoomShell";
import { db } from "@/server/db";

export const dynamic = "force-dynamic";

export default async function StudentLiveLessonPage({
  params,
}: {
  params: Promise<{ lessonId: string; studentId: string }>;
}) {
  const { lessonId, studentId } = await params;
  const student = await db.studentProfile.findUnique({ where: { id: studentId } });
  const lesson = await db.lesson.findFirst({ where: { id: lessonId, studentId } });
  if (!student || !lesson) notFound();

  return (
    <Suspense>
      <LessonRoomShell
        backHref={`/student/${student.id}/lesson`}
        lessonId={lesson.id}
        participantId={student.id}
        participantName={student.fullName}
        participantRole="STUDENT"
        studentIds={[student.id]}
      />
    </Suspense>
  );
}
