import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/server/db";

export const dynamic = "force-dynamic";

export default async function StudentLessonRedirectPage() {
  const cookieStore = await cookies();
  const participantId = cookieStore.get("school_os_participant_id")?.value;
  const student =
    (participantId
      ? await db.studentProfile.findUnique({ select: { id: true }, where: { id: participantId } })
      : null) ??
    (await db.studentProfile.findFirst({ orderBy: { id: "asc" }, select: { id: true } }));

  redirect(student ? `/student/${student.id}/lesson` : "/student/register");
}
