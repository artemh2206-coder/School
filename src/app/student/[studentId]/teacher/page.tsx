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

export default async function StudentTeacherPage({
  params,
}: {
  params: Promise<{ studentId: string }>;
}) {
  const { studentId } = await params;
  const student = await db.studentProfile.findUnique({
    include: {
      preferredTeacher: true,
    },
    where: { id: studentId },
  });
  if (!student) notFound();

  const nextLesson = student.preferredTeacherId
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
      teacherId: student.preferredTeacherId,
    },
  })
    : null;
  const latestLesson = student.preferredTeacherId
    ? (
    nextLesson ??
    (await db.lesson.findFirst({
      include: {
        teacher: true,
      },
      orderBy: {
        startsAt: "desc",
      },
      where: {
        status: {
          not: "CANCELLED",
        },
        studentId: student.id,
        teacherId: student.preferredTeacherId,
      },
    }))
  )
    : null;
  const teacher = student.preferredTeacher ?? latestLesson?.teacher ?? null;

  return (
    <DashboardShell
      nav={[
        { href: `/student/${student.id}/dashboard`, label: "Кабинет", description: "главная" },
        { href: `/student/${student.id}/lesson`, label: "Уроки", description: "список уроков" },
        { href: `/student/${student.id}/teachers`, label: "Сменить учителя", description: "каталог учителей" },
        { href: "#schedule-modal", label: "Расписание", description: "календарь" },
      ]}
      profile={{
        id: student.id,
        initials: getInitials(student.fullName),
        name: student.fullName,
        status: "Ученик · профиль учителя",
        meta: "Основной преподаватель по расписанию",
      }}
      hideProfileCard
      logoutHref="/api/auth/logout"
      roleLabel="Кабинет ученика"
    >
      <Panel title="Мой учитель">
        {teacher ? (
          <div className="teacher-public-profile">
            <div className="teacher-public-hero">
              <div className="teacher-public-photo">
                {teacher.profilePhotoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    alt={teacher.fullName}
                    src={teacher.profilePhotoUrl}
                    style={{ objectPosition: `${teacher.profilePhotoPositionX}% ${teacher.profilePhotoPositionY}%` }}
                  />
                ) : (
                  <span>{getInitials(teacher.fullName)}</span>
                )}
              </div>
              <div>
                <span className="teacher-market-rating">★ {teacher.ratingAverage.toFixed(1)} · {teacher.ratingCount || "новый"} отзывов</span>
                <h3>{teacher.fullName}</h3>
                <p>{teacher.headline ?? "Преподаватель NeoSchool"}</p>
                <strong>{teacher.lessonPriceUah} грн / урок</strong>
              </div>
            </div>
            {teacher.introVideoUrl ? (
              <a className="teacher-video-link" href={teacher.introVideoUrl} rel="noreferrer" target="_blank">
                Смотреть видео-презентацию
              </a>
            ) : null}
            <p>{teacher.bio ?? "Учитель пока заполняет подробное описание профиля."}</p>
            <div className="teacher-market-tags">
              {[...teacher.teachingLanguages, ...teacher.specialties, ...teacher.teachingStyle].slice(0, 10).map((item) => (
                <span key={item}>{item}</span>
              ))}
            </div>
            <div className="teacher-profile-actions">
              {latestLesson ? (
                <Link className="button" href={`/student/${student.id}/lesson/${latestLesson.id}`}>
                  {nextLesson ? `Ближайший урок: ${formatDate(latestLesson.startsAt)}` : "Последний урок"}
                </Link>
              ) : null}
              <Link className="button primary" href={`/student/${student.id}/teachers`}>
                Запросить смену учителя
              </Link>
            </div>
          </div>
        ) : (
          <div className="empty-state teacher-empty-choice">
            <strong>Учитель пока не выбран.</strong>
            <span>Откройте каталог и выберите преподавателя под ваш язык, уровень и цель.</span>
            <Link className="button primary" href={`/student/${student.id}/teachers`}>
              Выбрать учителя
            </Link>
          </div>
        )}
      </Panel>
    </DashboardShell>
  );
}
