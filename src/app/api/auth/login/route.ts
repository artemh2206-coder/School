import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/server/db";

const schema = z.object({
  identifier: z.string().optional().or(z.literal("")),
  password: z.string().optional(),
  role: z.enum(["STUDENT", "TEACHER", "ADMIN"]),
});

export async function POST(request: Request) {
  const formData = await request.formData();
  const payload = schema.parse({
    identifier: formData.get("identifier"),
    password: formData.get("password"),
    role: formData.get("role"),
  });
  const identifier = payload.identifier?.trim() ?? "";
  const normalizedId = identifier.toUpperCase();

  let redirectTo = "/admin";

  if (payload.role === "STUDENT") {
    const student =
      (identifier
        ? await db.studentProfile.findFirst({
            select: { id: true },
            where: {
              OR: [
                { id: normalizedId },
                { fullName: { equals: identifier, mode: "insensitive" } },
              ],
            },
          })
        : null) ??
      (await db.studentProfile.findFirst({ orderBy: { id: "asc" }, select: { id: true } }));

    if (!student) redirect("/student/login");
    redirectTo = `/student/${student.id}/dashboard`;
  }

  if (payload.role === "TEACHER") {
    const teacher =
      (identifier
        ? await db.teacherProfile.findFirst({
            select: { id: true },
            where: {
              OR: [
                { id: normalizedId },
                { fullName: { equals: identifier, mode: "insensitive" } },
              ],
            },
          })
        : null) ??
      (await db.teacherProfile.findFirst({ orderBy: { id: "asc" }, select: { id: true } }));

    if (!teacher) redirect("/teacher/login");
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
