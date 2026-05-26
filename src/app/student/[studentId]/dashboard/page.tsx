import Link from "next/link";
import { notFound } from "next/navigation";
import { DashboardShell, Panel } from "@/components/DashboardShell";
import { LessonSummaryCard } from "@/components/LessonFocusCard";
import { getInitials } from "@/lib/platform-participants";
import { db } from "@/server/db";

export const dynamic = "force-dynamic";

function formatLessonDate(date: Date) {
  return date.toLocaleDateString("ru-RU", { day: "2-digit", month: "short" });
}

function formatLessonTime(date: Date) {
  return date.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
}

function toSummaryLesson(lesson: { endsAt: Date; id: string; startsAt: Date } | null) {
  if (!lesson) return null;

  return {
    day: (lesson.startsAt.getUTCDay() + 6) % 7,
    end: lesson.endsAt.getUTCHours(),
    id: lesson.id,
    month: lesson.startsAt.getUTCMonth(),
    start: lesson.startsAt.getUTCHours(),
    startsAtIso: lesson.startsAt.toISOString(),
  };
}

export default async function StudentDashboardPage({
  params,
}: {
  params: Promise<{ studentId: string }>;
}) {
  const { studentId } = await params;
  const student = await db.studentProfile.findUnique({
    include: {
      preferredTeacher: true,
    },
    where: {
      id: studentId,
    },
  });

  if (!student) notFound();

  const nextLesson = await db.lesson.findFirst({
    include: {
      teacher: true,
    },
    orderBy: {
      startsAt: "asc",
    },
    where: {
      startsAt: {
        gte: new Date(),
      },
      status: "SCHEDULED",
      studentId: student.id,
    },
  });
  const assignedTeacher = student.preferredTeacher;
  const upcomingLessons = await db.lesson.findMany({
    include: {
      teacher: true,
    },
    orderBy: {
      startsAt: "asc",
    },
    take: 15,
    where: {
      startsAt: {
        gte: new Date(),
      },
      status: "SCHEDULED",
      studentId: student.id,
    },
  });
  const homeworkQueue = await db.lesson.findMany({
    include: {
      homework: {
        orderBy: {
          createdAt: "desc",
        },
        take: 1,
      },
      teacher: true,
    },
    orderBy: {
      actualEndedAt: "desc",
    },
    take: 10,
    where: {
      OR: [{ actualEndedAt: { not: null } }, { status: "COMPLETED" }],
      studentId: student.id,
    },
  });
  const pendingHomeworkLessons = homeworkQueue.filter((lesson) => lesson.homework[0]?.status !== "SUBMITTED");

  const lessonHref = `/student/${student.id}/lesson`;
  const nav = [
    { href: lessonHref, label: "Уроки", description: "открыть список уроков" },
    { href: "#schedule-modal", label: "Расписание", description: "открыть календарь" },
    assignedTeacher
      ? { href: `/student/${student.id}/teacher`, label: "Мой учитель", description: "профиль учителя" }
      : { href: `/student/${student.id}/teachers`, label: "Выбрать учителя", description: "каталог учителей" },
  ];

  return (
    <DashboardShell
      dashboardHomeLayout
      nav={nav}
      profile={{
        id: student.id,
        initials: getInitials(student.fullName),
        name: student.fullName,
        status: "Ученик · активный профиль",
        meta: "Europe/Budapest",
      }}
      logoutHref="/api/auth/logout"
      roleLabel="Кабинет ученика"
    >
      <div className="social-content-grid lesson-page-grid">
        <main className="social-wall dashboard-home">
          <Panel title="Ближайший урок">
            <LessonSummaryCard
              counterpart={{
                id: assignedTeacher?.id ?? "T00000",
                initials: assignedTeacher ? getInitials(assignedTeacher.fullName) : "T",
                meta: "Учитель · Europe/Budapest",
                name: assignedTeacher?.fullName ?? "Учитель еще не назначен",
              }}
              initialLesson={toSummaryLesson(nextLesson)}
              lessonHref={lessonHref}
              studentIds={[student.id]}
              teacherIds={assignedTeacher ? [assignedTeacher.id] : []}
            />
          </Panel>

          <Panel title="Закрепленный учитель">
            {assignedTeacher ? (
              <div className="dashboard-card-grid teacher-profile-grid">
                <div className="dashboard-mini-card participant-mini-card teacher-mini-card">
                  <div className="mini-avatar">{getInitials(assignedTeacher.fullName)}</div>
                  <strong>{assignedTeacher.fullName}</strong>
                  <span>{assignedTeacher.id}</span>
                  <p>{assignedTeacher.headline ?? "Основной преподаватель"}</p>
                  <Link className="button" href={`/student/${student.id}/teacher`}>
                    Открыть профиль
                  </Link>
                </div>
              </div>
            ) : (
              <div className="empty-state compact teacher-empty-choice">
                <strong>Учитель пока не выбран.</strong>
                <span>Выберите преподавателя по языку, цене, рейтингу и видео-презентации.</span>
                <Link className="button primary" href={`/student/${student.id}/teachers`}>
                  Выбрать учителя
                </Link>
              </div>
            )}
          </Panel>

          <Panel title="Домашнее задание">
            {pendingHomeworkLessons.length ? (
              <div className="dashboard-card-grid homework-grid">
                {pendingHomeworkLessons.map((lesson) => {
                  const homework = lesson.homework[0];

                  return (
                    <div className="dashboard-mini-card homework-card" key={lesson.id}>
                      <strong>{lesson.teacher.fullName}</strong>
                      <span>{lesson.id}</span>
                      <p>
                        {homework
                          ? "ДЗ прикреплено, ожидает выполнения"
                          : "Урок ждет прикрепления ДЗ учителем"}
                      </p>
                      {homework ? (
                        <Link className="button" href={`/student/${student.id}/homework/${lesson.id}`}>
                          Перейти к ДЗ
                        </Link>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="empty-state compact">Нет уроков, ожидающих домашнее задание.</div>
            )}
          </Panel>

          <Panel title="Ближайшие занятия">
            {upcomingLessons.length ? (
              <div className="dashboard-card-grid lesson-mini-grid">
                {upcomingLessons.map((lesson) => (
                  <div className="dashboard-mini-card lesson-mini-card" key={lesson.id}>
                    <span>{formatLessonDate(lesson.startsAt)}</span>
                    <strong>{formatLessonTime(lesson.startsAt)}</strong>
                    <p>{lesson.teacher.fullName}</p>
                    <small>{lesson.id}</small>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state compact">Ближайших занятий пока нет.</div>
            )}
          </Panel>
        </main>
      </div>
    </DashboardShell>
  );
}
