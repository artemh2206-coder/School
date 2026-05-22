import Link from "next/link";
import { notFound } from "next/navigation";
import { DashboardShell, Panel } from "@/components/DashboardShell";
import { LessonSummaryCard } from "@/components/LessonFocusCard";
import { TeacherBalanceHeader, UpcomingLessons } from "@/components/ScheduleCalendar";
import { getInitials } from "@/lib/platform-participants";
import { db } from "@/server/db";

export const dynamic = "force-dynamic";

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
  const nextLesson = teacher
    ? await db.lesson.findFirst({
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
      })
    : null;
  const students = teacher
    ? await db.studentProfile.findMany({
        orderBy: {
          id: "asc",
        },
        take: 8,
        where: {
          lessons: {
            some: {
              teacherId: teacher.id,
            },
          },
        },
      })
    : [];
  const firstStudent = nextLesson?.student ?? students[0] ?? null;

  if (!teacher) notFound();

  const lessonHref = `/teacher/${teacher.id}/lesson`;
  const nav = [
    { href: "#schedule-modal", label: "Расписание", description: "открыть календарь" },
    { href: lessonHref, label: "Урок", description: "открыть страницу урока" },
    { href: "#Материалы", label: "Материалы", description: "библиотека и выдача" },
    { href: "#Ученики", label: "Ученики", description: "карточки учеников" },
  ];

  return (
    <DashboardShell
      coverSlot={<TeacherBalanceHeader />}
      nav={nav}
      profile={{
        id: teacher.id,
        initials: getInitials(teacher.fullName),
        name: teacher.fullName,
        status: "Преподаватель · активный профиль",
        meta: "Europe/Budapest",
      }}
      roleLabel="Кабинет учителя"
      scheduleEditable
      scheduleTeacherId={teacher.id}
    >
      <div className="social-content-grid lesson-page-grid">
        <main className="social-wall">
          <Panel title="Ближайший урок">
            <LessonSummaryCard
              counterpart={{
                id: firstStudent?.id ?? "S00000",
                initials: firstStudent ? getInitials(firstStudent.fullName) : "S",
                meta: "Ученик · Europe/Budapest",
                name: firstStudent?.fullName ?? "Ученик еще не назначен",
              }}
              lessonHref={lessonHref}
              studentIds={firstStudent ? [firstStudent.id] : []}
              teacherIds={[teacher.id]}
            />
          </Panel>
          <Panel title="Материалы">
            <div className="empty-state">Материалы добавим следующим шагом.</div>
          </Panel>
          <Panel title="Ближайшие занятия">
            <UpcomingLessons teacherIds={[teacher.id]} />
          </Panel>
          <Panel title="Ученики">
            {students.length ? (
              <div className="list">
                {students.map((student) => (
                  <div className="list-item" key={student.id}>
                    <strong>{student.fullName} · {student.id}</strong>
                    <span>Ученик этого учителя</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">Пока нет учеников в расписании этого учителя.</div>
            )}
          </Panel>
          <Panel title="Профиль">
            <Link className="button" href="/api/auth/logout">Выйти</Link>
          </Panel>
        </main>
      </div>
    </DashboardShell>
  );
}
