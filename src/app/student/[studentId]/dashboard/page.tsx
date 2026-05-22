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
            <div className="empty-state">Задания появятся после первых уроков.</div>
          </Panel>
          <Panel title="Профиль">
            <Link className="button" href="/api/auth/logout">Выйти</Link>
          </Panel>
        </main>
      </div>
    </DashboardShell>
  );
}
