import { notFound } from "next/navigation";
import { Suspense } from "react";
import { LessonRoomShell } from "@/components/LessonRoomShell";
import { db } from "@/server/db";

export const dynamic = "force-dynamic";

export default async function TeacherLiveLessonPage({
  params,
}: {
  params: Promise<{ lessonId: string; teacherId: string }>;
}) {
  const { lessonId, teacherId } = await params;
  const teacher = await db.teacherProfile.findUnique({ where: { id: teacherId } });
  const lesson = await db.lesson.findFirst({ where: { id: lessonId, teacherId } });
  if (!teacher || !lesson) notFound();

  return (
    <Suspense>
      <LessonRoomShell
        backHref={`/teacher/${teacher.id}/lesson`}
        lessonId={lesson.id}
        participantId={teacher.id}
        participantName={teacher.fullName}
        participantRole="TEACHER"
        teacherIds={[teacher.id]}
      />
    </Suspense>
  );
}
