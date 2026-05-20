import { DashboardShell, Panel } from "@/components/DashboardShell";
import { LessonSummaryCard } from "@/components/LessonFocusCard";
import { TeacherBalanceHeader, UpcomingLessons } from "@/components/ScheduleCalendar";

const teacherId = "T00001";
const teacherScheduleIds = [teacherId];

const nav = [
  { href: "#schedule-modal", label: "Расписание", description: "открыть календарь" },
  { href: "/teacher/lesson", label: "Урок", description: "открыть страницу урока" },
  { href: "#Материалы", label: "Материалы", description: "библиотека и выдача" },
  { href: "#Ученики", label: "Ученики", description: "карточки учеников" },
];

export default function TeacherDashboardPage() {
  return (
    <DashboardShell
      coverSlot={<TeacherBalanceHeader />}
      nav={nav}
      profile={{
        id: teacherId,
        initials: "АБ",
        name: "Анна Белова",
        status: "Преподаватель · онлайн",
        meta: "English B1/B2 · 12 учеников · Europe/Budapest",
      }}
      roleLabel="Кабинет учителя"
      scheduleEditable
    >
      <div className="social-content-grid lesson-page-grid">
        <main className="social-wall">
          <Panel title="Ближайший урок">
            <LessonSummaryCard
              counterpart={{
                id: "S00001",
                initials: "МВ",
                meta: "English B1 · 6 уроков в пакете · Europe/Budapest",
                name: "Марк Волков",
              }}
              lessonHref="/teacher/lesson"
              studentIds={["S00001"]}
              teacherIds={teacherScheduleIds}
            />
          </Panel>
          <Panel title="Материалы">
            <div className="list">
              <div className="list-item">
                <strong>Lesson plan B1.pdf</strong>
                <span>Библиотека учителя</span>
              </div>
              <div className="list-item">
                <strong>Speaking cards.png</strong>
                <span>Выдано Марку</span>
              </div>
            </div>
          </Panel>
          <Panel title="Ближайшие занятия">
            <UpcomingLessons teacherIds={teacherScheduleIds} />
          </Panel>
          <Panel title="Ученики">
            <div className="list">
              <div className="list-item">
                <strong>Марк Волков · S00001</strong>
                <span>B1 · 6 уроков · домашка 70%</span>
              </div>
              <div className="list-item">
                <strong>Ирина Коваль · S00002</strong>
                <span>A2 · 3 урока · домашка 95%</span>
              </div>
            </div>
          </Panel>
        </main>
      </div>
    </DashboardShell>
  );
}
