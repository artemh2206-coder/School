import Link from "next/link";
import { notFound } from "next/navigation";
import { DashboardShell, Panel } from "@/components/DashboardShell";
import { getInitials } from "@/lib/platform-participants";
import { db } from "@/server/db";

export const dynamic = "force-dynamic";

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

function getHomeworkStatus(homework: { status: string } | undefined) {
  if (!homework) return "ДЗ ожидает учителя";
  if (homework.status === "SUBMITTED") return "ДЗ выполнено";
  return "ДЗ прикреплено";
}

export default async function StudentLessonListPage({
  params,
}: {
  params: Promise<{ studentId: string }>;
}) {
  const { studentId } = await params;
  const student = await db.studentProfile.findUnique({ where: { id: studentId } });
  if (!student) notFound();

  const lessons = await db.lesson.findMany({
    include: {
      homework: { orderBy: { createdAt: "desc" }, take: 1 },
      teacher: true,
    },
    orderBy: { startsAt: "desc" },
    where: { studentId: student.id, status: { not: "CANCELLED" } },
  });

  return (
    <DashboardShell
      nav={[
        { href: `/student/${student.id}/dashboard`, label: "Кабинет", description: "главная" },
        { href: `/student/${student.id}/teacher`, label: "Мой учитель", description: "профиль учителя" },
        { href: `/student/${student.id}/teachers`, label: "Сменить учителя", description: "каталог учителей" },
      ]}
      profile={{
        id: student.id,
        initials: getInitials(student.fullName),
        name: student.fullName,
        status: "Ученик · уроки",
        meta: "Ближайшие и завершенные уроки",
      }}
      logoutHref="/api/auth/logout"
      roleLabel="Кабинет ученика"
    >
      <Panel title="Уроки">
        {lessons.length ? (
          <div className="list">
            {lessons.map((lesson) => (
              <div className="list-item lesson-list-item" key={lesson.id}>
                <strong>{lesson.teacher.fullName} · {lesson.id}</strong>
                <span>{formatDate(lesson.startsAt)} · {lesson.status} · {getHomeworkStatus(lesson.homework[0])}</span>
                <div>
                  <Link className="button primary" href={`/student/${student.id}/lesson/${lesson.id}`}>Открыть урок</Link>
                  <Link className="button" href={`/student/${student.id}/homework/${lesson.id}`}>ДЗ и чат</Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">Уроков пока нет.</div>
        )}
      </Panel>
    </DashboardShell>
  );
}
