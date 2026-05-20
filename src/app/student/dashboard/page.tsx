import { DashboardShell, Panel } from "@/components/DashboardShell";
import { LessonSummaryCard } from "@/components/LessonFocusCard";
import { UpcomingLessons } from "@/components/ScheduleCalendar";

const studentName = "Марк Волков";
const studentId = "S00001";
const studentScheduleIds = [studentId];

const nav = [
  { href: "/student/lesson", label: "Урок", description: "открыть страницу урока" },
  { href: "#schedule-modal", label: "Расписание", description: "открыть календарь" },
  { href: "#Домашнее задание", label: "Домашка", description: "задания и проверка" },
];

export default function StudentDashboardPage() {
  return (
    <DashboardShell
      nav={nav}
      profile={{
        id: studentId,
        initials: "МВ",
        name: studentName,
        status: "Ученик · активный пакет",
        meta: "English B1 · 6 уроков на балансе · Europe/Budapest",
      }}
      roleLabel="Кабинет ученика"
    >
      <div className="social-content-grid lesson-page-grid">
        <main className="social-wall">
          <Panel title="Ближайший урок">
            <LessonSummaryCard
              counterpart={{
                id: "T00001",
                initials: "АБ",
                meta: "English B1/B2 · быстрый ответ · Europe/Budapest",
                name: "Анна Белова",
              }}
              lessonHref="/student/lesson"
              studentIds={studentScheduleIds}
              teacherIds={["T00001"]}
            />
          </Panel>
          <Panel title="Ближайшие занятия">
            <UpcomingLessons studentIds={studentScheduleIds} />
          </Panel>
          <Panel title="Домашнее задание">
            <div className="list">
              <div className="list-item">
                <strong>Speaking cards + grammar drill</strong>
                <span>Дедлайн: пятница, 20:00 · статус: назначено</span>
              </div>
            </div>
          </Panel>
        </main>
      </div>
    </DashboardShell>
  );
}
