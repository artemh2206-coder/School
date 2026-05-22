import Link from "next/link";
import { notFound } from "next/navigation";
import { DashboardShell, Panel } from "@/components/DashboardShell";
import { LessonSummaryCard } from "@/components/LessonFocusCard";
import { UpcomingLessons } from "@/components/ScheduleCalendar";
import { getInitials } from "@/lib/platform-participants";
import { db } from "@/server/db";

export const dynamic = "force-dynamic";

export default async function StudentDashboardPage({
  params,
}: {
  params: Promise<{ studentId: string }>;
}) {
  const { studentId } = await params;
  const student = await db.studentProfile.findUnique({
    where: {
      id: studentId,
    },
  });
  const nextLesson = student
    ? await db.lesson.findFirst({
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
      })
    : null;
  const teacher =
    nextLesson?.teacher ??
    (await db.teacherProfile.findFirst({
      orderBy: {
        id: "asc",
      },
    }));
  const homeworkQueue = student
    ? await db.lesson.findMany({
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
      })
    : [];
  const pendingHomeworkLessons = homeworkQueue.filter((lesson) => lesson.homework[0]?.status !== "SUBMITTED");

  if (!student) notFound();

  const lessonHref = `/student/${student.id}/lesson`;
  const nav = [
    { href: lessonHref, label: "Урок", description: "открыть страницу урока" },
    { href: "#schedule-modal", label: "Расписание", description: "открыть календарь" },
    { href: "#Домашнее задание", label: "Домашка", description: "задания и проверка" },
  ];

  return (
    <DashboardShell
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
        <main className="social-wall">
          <Panel title="Ближайший урок">
            <LessonSummaryCard
              counterpart={{
                id: teacher?.id ?? "T00000",
                initials: teacher ? getInitials(teacher.fullName) : "T",
                meta: "Учитель · Europe/Budapest",
                name: teacher?.fullName ?? "Учитель еще не назначен",
              }}
              lessonHref={lessonHref}
              studentIds={[student.id]}
              teacherIds={teacher ? [teacher.id] : []}
            />
          </Panel>
          <Panel title="Ближайшие занятия">
            <UpcomingLessons studentIds={[student.id]} />
          </Panel>
          <Panel title="Домашнее задание">
            {pendingHomeworkLessons.length ? (
              <div className="list">
                {pendingHomeworkLessons.map((lesson) => {
                  const homework = lesson.homework[0];

                  return (
                    <div className="list-item" key={lesson.id}>
                      <strong>{lesson.teacher.fullName} · {lesson.id}</strong>
                      <span>
                        {homework ? "Домашнее задание прикреплено · ожидает выполнения" : "Урок ждет прикрепления ДЗ учителем"}
                      </span>
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
              <div className="empty-state">Нет уроков, ожидающих домашнее задание.</div>
            )}
          </Panel>
        </main>
      </div>
    </DashboardShell>
  );
}
