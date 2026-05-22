import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/server/db";

export const dynamic = "force-dynamic";

export default async function StudentDashboardRedirectPage() {
  const cookieStore = await cookies();
  const participantId = cookieStore.get("school_os_participant_id")?.value;
  const student =
    (participantId
      ? await db.studentProfile.findUnique({ select: { id: true }, where: { id: participantId } })
      : null) ??
    (await db.studentProfile.findFirst({ orderBy: { id: "asc" }, select: { id: true } }));

  if (student) redirect(`/student/${student.id}/dashboard`);

  return (
    <main className="site-shell">
      <section className="auth-card" style={{ margin: "18px auto 0" }}>
        <p className="eyebrow">Кабинет ученика</p>
        <h1>Пока нет профиля ученика</h1>
        <Link className="button primary" href="/student/register">Зарегистрировать ученика</Link>
      </section>
    </main>
  );
}
