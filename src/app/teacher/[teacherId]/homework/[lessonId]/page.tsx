import { notFound } from "next/navigation";
import { Suspense } from "react";
import { TeacherHomeworkControl } from "@/components/HomeworkActionForm";
import { LessonRoomShell } from "@/components/LessonRoomShell";
import { db } from "@/server/db";

export const dynamic = "force-dynamic";

export default async function TeacherHomeworkPage({
  params,
}: {
  params: Promise<{ lessonId: string; teacherId: string }>;
}) {
  const { lessonId, teacherId } = await params;
  const teacher = await db.teacherProfile.findUnique({ where: { id: teacherId } });
  const lesson = await db.lesson.findFirst({
    include: { homework: { orderBy: { createdAt: "desc" }, take: 1 } },
    where: { id: lessonId, teacherId },
  });
  if (!teacher || !lesson) notFound();

  const homework = lesson.homework[0];

  return (
    <Suspense>
      <LessonRoomShell
        backHref={`/teacher/${teacher.id}/lesson`}
        chatOnly
        controlSlot={
          <TeacherHomeworkControl
            isAttached={Boolean(homework)}
            isSubmitted={homework?.status === "SUBMITTED"}
            lessonId={lesson.id}
            teacherId={teacher.id}
          />
        }
        lessonId={lesson.id}
        participantId={teacher.id}
        participantName={teacher.fullName}
        participantRole="TEACHER"
      />
    </Suspense>
  );
}
