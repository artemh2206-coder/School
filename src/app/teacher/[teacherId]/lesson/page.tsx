import { notFound } from "next/navigation";
import { Suspense } from "react";
import { LessonRoomShell } from "@/components/LessonRoomShell";
import { db } from "@/server/db";

export const dynamic = "force-dynamic";

export default async function TeacherLessonPage({
  params,
}: {
  params: Promise<{ teacherId: string }>;
}) {
  const { teacherId } = await params;
  const teacher = await db.teacherProfile.findUnique({
    where: {
      id: teacherId,
    },
  });

  if (!teacher) notFound();

  return (
    <Suspense>
      <LessonRoomShell
        backHref={`/teacher/${teacher.id}/dashboard`}
        participantId={teacher.id}
        participantName={teacher.fullName}
        participantRole="TEACHER"
        teacherIds={[teacher.id]}
      />
    </Suspense>
  );
}
