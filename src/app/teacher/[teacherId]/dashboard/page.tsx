import Link from "next/link";
import { notFound } from "next/navigation";
import { DashboardShell, Panel } from "@/components/DashboardShell";
import { LessonSummaryCard } from "@/components/LessonFocusCard";
import { TeacherBalanceHeader } from "@/components/ScheduleCalendar";
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

export default async function TeacherDashboardPage({
  params,
}: {
  params: Promise<{ teacherId: string }>;
}) {
  const { teacherId } = await params;
  const teacher = await db.teacherProfile.findUnique({
    where: {
      id: teacherId,
    },
  });

  if (!teacher) notFound();

  const nextLesson = await db.lesson.findFirst({
    include: {
      student: true,
    },
    orderBy: {
      startsAt: "asc",
    },
    where: {
      startsAt: {
        gte: new Date(),
      },
      status: "SCHEDULED",
      teacherId: teacher.id,
    },
  });
  const upcomingLessons = await db.lesson.findMany({
    include: {
      student: true,
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
      teacherId: teacher.id,
    },
  });
  const students = await db.studentProfile.findMany({
    orderBy: {
      id: "asc",
    },
    take: 20,
    where: {
      lessons: {
        some: {
          teacherId: teacher.id,
        },
      },
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
      student: true,
    },
    orderBy: {
      actualEndedAt: "desc",
    },
    take: 10,
    where: {
      OR: [{ actualEndedAt: { not: null } }, { status: "COMPLETED" }],
      teacherId: teacher.id,
    },
  });
  const pendingHomeworkLessons = homeworkQueue.filter((lesson) => {
    const homework = lesson.homework[0];
    return !homework || homework.status !== "SUBMITTED";
  });
  const firstStudent = nextLesson?.student ?? students[0] ?? null;

  const lessonHref = `/teacher/${teacher.id}/lesson`;
  const nav = [
    { href: "#schedule-modal", label: "Расписание", description: "открыть календарь" },
    { href: lessonHref, label: "Урок", description: "открыть страницу урока" },
  ];

  return (
    <DashboardShell
      coverSlot={<TeacherBalanceHeader />}
      dashboardHomeLayout
      nav={nav}
      profile={{
        id: teacher.id,
        initials: getInitials(teacher.fullName),
        name: teacher.fullName,
        status: "Преподаватель · активный профиль",
        meta: "Europe/Budapest",
      }}
      logoutHref="/api/auth/logout"
      roleLabel="Кабинет учителя"
      scheduleEditable
      scheduleTeacherId={teacher.id}
    >
      <div className="social-content-grid lesson-page-grid">
        <main className="social-wall dashboard-home">
          <Panel title="Ближайший урок">
            <LessonSummaryCard
              counterpart={{
                id: firstStudent?.id ?? "S00000",
                initials: firstStudent ? getInitials(firstStudent.fullName) : "S",
                meta: "Ученик · Europe/Budapest",
                name: firstStudent?.fullName ?? "Ученик еще не назначен",
              }}
              initialLesson={toSummaryLesson(nextLesson)}
              lessonHref={lessonHref}
              studentIds={firstStudent ? [firstStudent.id] : []}
              teacherIds={[teacher.id]}
            />
          </Panel>

          <Panel title="Домашнее задание после урока">
            {pendingHomeworkLessons.length ? (
              <div className="dashboard-card-grid homework-grid">
                {pendingHomeworkLessons.map((lesson) => {
                  const homework = lesson.homework[0];

                  return (
                    <div className="dashboard-mini-card homework-card" key={lesson.id}>
                      <strong>{lesson.student.fullName}</strong>
                      <span>{lesson.id}</span>
                      <p>
                        {homework
                          ? "ДЗ прикреплено, ученик еще не отметил выполнение"
                          : "Домашнее задание не прикреплено"}
                      </p>
                      <Link className="button" href={`/teacher/${teacher.id}/homework/${lesson.id}`}>
                        {homework ? "Редактировать ДЗ" : "Прикрепить ДЗ"}
                      </Link>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="empty-state compact">Нет завершенных уроков, ожидающих ДЗ.</div>
            )}
          </Panel>

          <Panel title="Ближайшие занятия">
            {upcomingLessons.length ? (
              <div className="dashboard-card-grid lesson-mini-grid">
                {upcomingLessons.map((lesson) => (
                  <div className="dashboard-mini-card lesson-mini-card" key={lesson.id}>
                    <span>{formatLessonDate(lesson.startsAt)}</span>
                    <strong>{formatLessonTime(lesson.startsAt)}</strong>
                    <p>{lesson.student.fullName}</p>
                    <small>{lesson.id}</small>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state compact">Ближайших занятий пока нет.</div>
            )}
          </Panel>

          <Panel title="Ученики">
            {students.length ? (
              <div className="dashboard-card-grid participant-mini-grid">
                {students.map((student) => (
                  <div className="dashboard-mini-card participant-mini-card" key={student.id}>
                    <div className="mini-avatar">{getInitials(student.fullName)}</div>
                    <strong>{student.fullName}</strong>
                    <span>{student.id}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state compact">Пока нет учеников в расписании этого учителя.</div>
            )}
          </Panel>
        </main>
      </div>
    </DashboardShell>
  );
}
