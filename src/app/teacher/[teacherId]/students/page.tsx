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

export default async function TeacherStudentsPage({
  params,
}: {
  params: Promise<{ teacherId: string }>;
}) {
  const { teacherId } = await params;
  const teacher = await db.teacherProfile.findUnique({ where: { id: teacherId } });
  if (!teacher) notFound();

  const lessons = await db.lesson.findMany({
    include: {
      student: true,
    },
    orderBy: {
      startsAt: "desc",
    },
    where: {
      teacherId: teacher.id,
      status: {
        not: "CANCELLED",
      },
    },
  });

  const students = Array.from(
    lessons
      .reduce(
        (items, lesson) => {
          const current = items.get(lesson.studentId);
          const lessonCount = (current?.lessonCount ?? 0) + 1;
          const nextLesson =
            lesson.startsAt >= new Date() && (!current?.nextLesson || lesson.startsAt < current.nextLesson.startsAt)
              ? { id: lesson.id, startsAt: lesson.startsAt }
              : current?.nextLesson ?? null;

          items.set(lesson.studentId, {
            fullName: lesson.student.fullName,
            id: lesson.studentId,
            lessonCount,
            nextLesson,
            timezone: lesson.student.timezone,
          });

          return items;
        },
        new Map<
          string,
          {
            fullName: string;
            id: string;
            lessonCount: number;
            nextLesson: { id: string; startsAt: Date } | null;
            timezone: string;
          }
        >(),
      )
      .values(),
  ).sort((left, right) => left.fullName.localeCompare(right.fullName, "ru"));

  return (
    <DashboardShell
      nav={[
        { href: `/teacher/${teacher.id}/dashboard`, label: "Кабинет", description: "главная" },
        { href: "#schedule-modal", label: "Расписание", description: "календарь" },
        { href: `/teacher/${teacher.id}/lesson`, label: "Уроки", description: "список уроков" },
        { href: `/teacher/${teacher.id}/profile`, label: "Профиль", description: "витрина для учеников" },
      ]}
      profile={{
        id: teacher.id,
        initials: getInitials(teacher.fullName),
        name: teacher.fullName,
        status: "Преподаватель · ученики",
        meta: "Ученики, привязанные через расписание",
      }}
      hideProfileCard
      logoutHref="/api/auth/logout"
      roleLabel="Кабинет учителя"
      scheduleEditable
      scheduleTeacherId={teacher.id}
    >
      <Panel title="Ученики">
        {students.length ? (
          <div className="dashboard-card-grid participant-mini-grid">
            {students.map((student) => (
              <div className="dashboard-mini-card participant-mini-card" key={student.id}>
                <div className="mini-avatar">{getInitials(student.fullName)}</div>
                <strong>{student.fullName}</strong>
                <span>{student.id}</span>
                <p>{student.timezone}</p>
                <small>{student.lessonCount} уроков</small>
                {student.nextLesson ? (
                  <Link className="button" href={`/teacher/${teacher.id}/lesson/${student.nextLesson.id}`}>
                    {formatDate(student.nextLesson.startsAt)}
                  </Link>
                ) : (
                  <small>Ближайший урок не назначен</small>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">Пока нет учеников, привязанных к этому учителю через расписание.</div>
        )}
      </Panel>
    </DashboardShell>
  );
}
