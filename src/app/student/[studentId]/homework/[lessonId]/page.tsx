import { notFound } from "next/navigation";
import { Suspense } from "react";
import { StudentHomeworkControl } from "@/components/HomeworkActionForm";
import { LessonRoomShell } from "@/components/LessonRoomShell";
import { db } from "@/server/db";

export const dynamic = "force-dynamic";

export default async function StudentHomeworkPage({
  params,
}: {
  params: Promise<{ lessonId: string; studentId: string }>;
}) {
  const { lessonId, studentId } = await params;
  const student = await db.studentProfile.findUnique({ where: { id: studentId } });
  const lesson = await db.lesson.findFirst({
    include: { homework: { orderBy: { createdAt: "desc" }, take: 1 } },
    where: { id: lessonId, studentId },
  });
  if (!student || !lesson) notFound();

  const homework = lesson.homework[0];

  return (
    <Suspense>
      <LessonRoomShell
        backHref={`/student/${student.id}/lesson`}
        chatOnly
        controlSlot={
          <StudentHomeworkControl
            isAttached={Boolean(homework)}
            isSubmitted={homework?.status === "SUBMITTED"}
            lessonId={lesson.id}
            studentId={student.id}
          />
        }
        lessonId={lesson.id}
        participantId={student.id}
        participantName={student.fullName}
        participantRole="STUDENT"
      />
    </Suspense>
  );
}
