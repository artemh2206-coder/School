import { notFound } from "next/navigation";
import { Suspense } from "react";
import { LessonRoomShell } from "@/components/LessonRoomShell";
import { db } from "@/server/db";

export const dynamic = "force-dynamic";

export default async function StudentLessonPage({
  params,
}: {
  params: Promise<{ studentId: string }>;
}) {
  const { studentId } = await params;
  const student = await db.studentProfile.findUnique({
    where: {
      id: studentId,
    },
  });

  if (!student) notFound();

  return (
    <Suspense>
      <LessonRoomShell
        backHref={`/student/${student.id}/dashboard`}
        participantId={student.id}
        participantName={student.fullName}
        participantRole="STUDENT"
        studentIds={[student.id]}
      />
    </Suspense>
  );
}
