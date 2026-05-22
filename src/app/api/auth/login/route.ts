import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/server/db";

const schema = z.object({
  participantId: z.string().optional().or(z.literal("")),
  password: z.string().optional(),
  role: z.enum(["STUDENT", "TEACHER", "ADMIN"]),
});

export async function POST(request: Request) {
  const formData = await request.formData();
  const payload = schema.parse({
    participantId: formData.get("participantId"),
    password: formData.get("password"),
    role: formData.get("role"),
  });
  const participantId = payload.participantId?.trim().toUpperCase() ?? "";

  let redirectTo = "/admin";

  if (payload.role === "STUDENT") {
    const student =
      (participantId
        ? await db.studentProfile.findUnique({ select: { id: true }, where: { id: participantId } })
        : null) ??
      (await db.studentProfile.findFirst({ orderBy: { id: "asc" }, select: { id: true } }));

    if (!student) redirect("/login?role=STUDENT");
    redirectTo = `/student/${student.id}/dashboard`;
  }

  if (payload.role === "TEACHER") {
    const teacher =
      (participantId
        ? await db.teacherProfile.findUnique({ select: { id: true }, where: { id: participantId } })
        : null) ??
      (await db.teacherProfile.findFirst({ orderBy: { id: "asc" }, select: { id: true } }));

    if (!teacher) redirect("/login?role=TEACHER");
    redirectTo = `/teacher/${teacher.id}/dashboard`;
  }

  const cookieStore = await cookies();
  cookieStore.set("school_os_role", payload.role, {
    httpOnly: true,
    path: "/",
    sameSite: "lax",
  });
  if (payload.role === "STUDENT" || payload.role === "TEACHER") {
    cookieStore.set("school_os_participant_id", redirectTo.split("/")[2], {
      httpOnly: true,
      path: "/",
      sameSite: "lax",
    });
  }

  redirect(redirectTo);
}
