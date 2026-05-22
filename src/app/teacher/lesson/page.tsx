import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/server/db";

export const dynamic = "force-dynamic";

export default async function TeacherLessonRedirectPage() {
  const cookieStore = await cookies();
  const participantId = cookieStore.get("school_os_participant_id")?.value;
  const teacher =
    (participantId
      ? await db.teacherProfile.findUnique({ select: { id: true }, where: { id: participantId } })
      : null) ??
    (await db.teacherProfile.findFirst({ orderBy: { id: "asc" }, select: { id: true } }));

  redirect(teacher ? `/teacher/${teacher.id}/lesson` : "/teacher/register");
}
