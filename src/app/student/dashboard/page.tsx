import { DashboardShell, Panel } from "@/components/DashboardShell";
import { LessonFocusCard } from "@/components/LessonFocusCard";
import { UpcomingLessons } from "@/components/ScheduleCalendar";

const studentName = "Марк Волков";
const studentId = "S00001";
const studentScheduleIds = [studentId];

const nav = [
  { href: "#Урок", label: "Урок", description: "Zoom, тема, преподаватель" },
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
          <Panel title="Урок">
            <LessonFocusCard
              counterpart={{
                id: "T00001",
                initials: "АБ",
                meta: "English B1/B2 · быстрый ответ · Europe/Budapest",
                name: "Анна Белова",
              }}
              language="English B1"
              studentIds={studentScheduleIds}
              teacherIds={["T00001"]}
              theme="Travel speaking + modal verbs"
              title="Урок с преподавателем"
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
