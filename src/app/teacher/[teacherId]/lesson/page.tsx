import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarCheck2, CircleCheck, Clock3, FileCheck2, FileClock, FileWarning } from "lucide-react";
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

function getHomeworkStatusClass(homework: { status: string } | undefined) {
  if (!homework) return "missing";
  if (homework.status === "SUBMITTED") return "submitted";
  return "attached";
}

function getHomeworkFilterStatus(homework: { status: string } | undefined) {
  if (!homework) return "missing";
  if (homework.status === "SUBMITTED") return "submitted";
  return "attached";
}

function getHomeworkStatusIcon(homework: { status: string } | undefined) {
  if (!homework) return <FileWarning size={15} />;
  if (homework.status === "SUBMITTED") return <FileCheck2 size={15} />;
  return <FileClock size={15} />;
}

function getSessionMetaStatus(status: string, endsAt: Date, now: Date) {
  if (status === "COMPLETED" || endsAt < now) return "Завершена";
  if (status === "SCHEDULED") return "Запланирована";
  return status;
}

function getSessionFilterStatus(
  lesson: { actualEndedAt: Date | null; endsAt: Date; id: string; startsAt: Date; status: string },
  now: Date,
  nextLessonId?: string,
) {
  if (lesson.status === "COMPLETED" || Boolean(lesson.actualEndedAt) || lesson.endsAt < now) return "completed";
  if (lesson.id === nextLessonId) return "next";
  return "planned";
}

function getTimeUntil(date: Date, now: Date) {
  const totalMinutes = Math.max(0, Math.round((date.getTime() - now.getTime()) / 60000));
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;

  if (days > 0) return `${days} д ${hours} ч`;
  if (hours > 0) return `${hours} ч ${minutes} мин`;
  return `${minutes} мин`;
}

export default async function TeacherLessonListPage({
  params,
  searchParams,
}: {
  params: Promise<{ teacherId: string }>;
  searchParams: Promise<{
    homeworkStatus?: string;
    sessionStatus?: string;
    sort?: string;
    studentId?: string;
  }>;
}) {
  const { teacherId } = await params;
  const filters = await searchParams;
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
  const now = new Date();
  const nextLessonId = lessons
    .filter((lesson) => lesson.status === "SCHEDULED" && lesson.startsAt >= now)
    .sort((left, right) => left.startsAt.getTime() - right.startsAt.getTime())[0]?.id;
  const selectedStudentId = filters.studentId ?? "all";
  const selectedSessionStatus = filters.sessionStatus ?? "all";
  const selectedHomeworkStatus = filters.homeworkStatus ?? "all";
  const selectedSort = filters.sort === "asc" ? "asc" : "desc";
  const studentOptions = Array.from(
    new Map(lessons.map((lesson) => [lesson.studentId, { fullName: lesson.student.fullName, id: lesson.studentId }])).values(),
  ).sort((left, right) => left.fullName.localeCompare(right.fullName, "ru"));
  const filteredLessons = lessons
    .filter((lesson) => selectedStudentId === "all" || lesson.studentId === selectedStudentId)
    .filter((lesson) => selectedSessionStatus === "all" || getSessionFilterStatus(lesson, now, nextLessonId) === selectedSessionStatus)
    .filter((lesson) => selectedHomeworkStatus === "all" || getHomeworkFilterStatus(lesson.homework[0]) === selectedHomeworkStatus)
    .sort((left, right) => {
      const diff = left.startsAt.getTime() - right.startsAt.getTime();
      return selectedSort === "asc" ? diff : -diff;
    });

  return (
    <DashboardShell
      nav={[
        { href: `/teacher/${teacher.id}/dashboard`, label: "Кабинет", description: "главная" },
        { href: "#schedule-modal", label: "Расписание", description: "календарь" },
        { href: `/teacher/${teacher.id}/students`, label: "Ученики", description: "список учеников" },
        { href: `/teacher/${teacher.id}/profile`, label: "Профиль", description: "витрина для учеников" },
      ]}
      profile={{
        id: teacher.id,
        initials: getInitials(teacher.fullName),
        name: teacher.fullName,
        status: "Преподаватель · уроки",
        meta: "Ближайшие и завершенные уроки",
      }}
      hideProfileCard
      logoutHref="/api/auth/logout"
      roleLabel="Кабинет учителя"
      scheduleEditable
      scheduleTeacherId={teacher.id}
    >
      <Panel title="Уроки">
        {lessons.length ? (
          <>
            <form className="lesson-session-filters">
              <label>
                <span>Ученик</span>
                <select defaultValue={selectedStudentId} name="studentId">
                  <option value="all">Все ученики</option>
                  {studentOptions.map((student) => (
                    <option key={student.id} value={student.id}>
                      {student.fullName}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span>Статус сессии</span>
                <select defaultValue={selectedSessionStatus} name="sessionStatus">
                  <option value="all">Все сессии</option>
                  <option value="next">Ближайшая</option>
                  <option value="planned">Запланирована</option>
                  <option value="completed">Завершена</option>
                </select>
              </label>
              <label>
                <span>Статус ДЗ</span>
                <select defaultValue={selectedHomeworkStatus} name="homeworkStatus">
                  <option value="all">Любой статус ДЗ</option>
                  <option value="missing">ДЗ не прикреплено</option>
                  <option value="attached">ДЗ прикреплено</option>
                  <option value="submitted">ДЗ выполнено учеником</option>
                </select>
              </label>
              <label>
                <span>Дата</span>
                <select defaultValue={selectedSort} name="sort">
                  <option value="desc">Сначала новые</option>
                  <option value="asc">Сначала старые</option>
                </select>
              </label>
              <div className="lesson-session-filter-actions">
                <button className="button primary" type="submit">
                  Применить
                </button>
                <Link className="button" href={`/teacher/${teacher.id}/lesson`}>
                  Сбросить
                </Link>
              </div>
            </form>

            {filteredLessons.length ? (
              <div className="lesson-session-list">
                {filteredLessons.map((lesson) => {
              const homework = lesson.homework[0];
              const isNext = lesson.id === nextLessonId;
              const isCompleted = lesson.status === "COMPLETED" || Boolean(lesson.actualEndedAt) || lesson.endsAt < now;
              const statusClass = isCompleted ? "done" : isNext ? "next" : "planned";
              const statusIcon = isCompleted ? <CircleCheck size={16} /> : isNext ? <Clock3 size={16} /> : <CalendarCheck2 size={16} />;
              const statusText = isCompleted
                ? "Сессия завершена"
                : isNext
                  ? `Сессия через ${getTimeUntil(lesson.startsAt, now)}`
                  : "Сессия запланирована";

              return (
                <article className={`lesson-session-row ${isNext ? "is-next" : ""}`} key={lesson.id}>
                  <div className="lesson-session-main">
                    <div className="lesson-session-title">
                      <strong>{lesson.student.fullName}</strong>
                      <span>{lesson.studentId}</span>
                    </div>
                    <div className="lesson-session-meta">
                      <span>ID сессии {lesson.id}</span>
                      <span>{formatDate(lesson.startsAt)}</span>
                      <span>{getSessionMetaStatus(lesson.status, lesson.endsAt, now)}</span>
                      <span className={`lesson-homework-badge ${getHomeworkStatusClass(homework)}`}>
                        {getHomeworkStatusIcon(homework)}
                        {getHomeworkStatus(homework)}
                      </span>
                    </div>
                  </div>

                  <div className="lesson-session-side">
                    <div className={`lesson-session-status ${statusClass}`}>
                      {statusIcon}
                      <span>{statusText}</span>
                    </div>
                    <div className="lesson-session-actions">
                      <Link className="button" href={`/teacher/${teacher.id}/homework/${lesson.id}`}>
                        Домашнее задание
                      </Link>
                      {isNext ? (
                        <Link className="button primary" href={`/teacher/${teacher.id}/lesson/${lesson.id}`}>
                          Открыть урок
                        </Link>
                      ) : null}
                    </div>
                  </div>
                </article>
              );
            })}
              </div>
            ) : (
              <div className="empty-state compact">По выбранным фильтрам сессий нет.</div>
            )}
          </>
        ) : (
          <div className="empty-state">Уроков пока нет.</div>
        )}
      </Panel>
    </DashboardShell>
  );
}
