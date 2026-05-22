import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/server/db";

export const dynamic = "force-dynamic";

export default async function TeacherDashboardRedirectPage() {
  const cookieStore = await cookies();
  const participantId = cookieStore.get("school_os_participant_id")?.value;
  const teacher =
    (participantId
      ? await db.teacherProfile.findUnique({ select: { id: true }, where: { id: participantId } })
      : null) ??
    (await db.teacherProfile.findFirst({ orderBy: { id: "asc" }, select: { id: true } }));

  if (teacher) redirect(`/teacher/${teacher.id}/dashboard`);

  return (
    <main className="site-shell">
      <section className="auth-card" style={{ margin: "18px auto 0" }}>
        <p className="eyebrow">Кабинет учителя</p>
        <h1>Пока нет профиля учителя</h1>
        <Link className="button primary" href="/teacher/register">Зарегистрировать учителя</Link>
      </section>
    </main>
  );
}
