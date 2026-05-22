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
  if (!homework) return "ДЗ не прикреплено";
  if (homework.status === "SUBMITTED") return "ДЗ выполнено учеником";
  return "ДЗ прикреплено";
}

export default async function TeacherLessonListPage({
  params,
}: {
  params: Promise<{ teacherId: string }>;
}) {
  const { teacherId } = await params;
  const teacher = await db.teacherProfile.findUnique({ where: { id: teacherId } });
  if (!teacher) notFound();

  const lessons = await db.lesson.findMany({
    include: {
      homework: { orderBy: { createdAt: "desc" }, take: 1 },
      student: true,
    },
    orderBy: { startsAt: "desc" },
    where: { teacherId: teacher.id, status: { not: "CANCELLED" } },
  });

  return (
    <DashboardShell
      nav={[
        { href: `/teacher/${teacher.id}/dashboard`, label: "Кабинет", description: "главная" },
        { href: "#schedule-modal", label: "Расписание", description: "календарь" },
      ]}
      profile={{
        id: teacher.id,
        initials: getInitials(teacher.fullName),
        name: teacher.fullName,
        status: "Преподаватель · уроки",
        meta: "Ближайшие и завершенные уроки",
      }}
      logoutHref="/api/auth/logout"
      roleLabel="Кабинет учителя"
      scheduleEditable
      scheduleTeacherId={teacher.id}
    >
      <Panel title="Уроки">
        {lessons.length ? (
          <div className="list">
            {lessons.map((lesson) => (
              <div className="list-item lesson-list-item" key={lesson.id}>
                <strong>{lesson.student.fullName} · {lesson.id}</strong>
                <span>{formatDate(lesson.startsAt)} · {lesson.status} · {getHomeworkStatus(lesson.homework[0])}</span>
                <div>
                  <Link className="button primary" href={`/teacher/${teacher.id}/lesson/${lesson.id}`}>Открыть урок</Link>
                  <Link className="button" href={`/teacher/${teacher.id}/homework/${lesson.id}`}>ДЗ и чат</Link>
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
