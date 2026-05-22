import Link from "next/link";
import { AdminOverviewPanel } from "@/components/AdminOverviewPanel";
import { DashboardShell, Panel } from "@/components/DashboardShell";
import { CommissionSettings } from "@/components/ScheduleCalendar";
import { db } from "@/server/db";

export const dynamic = "force-dynamic";

const nav = [
  { href: "#Платформа", label: "Платформа", description: "живые счетчики" },
  { href: "/admin/sessions", label: "Сессии", description: "уроки и наблюдение", newTab: true },
  { href: "/admin/teachers", label: "Учителя", description: "список профилей" },
  { href: "/admin/students", label: "Ученики", description: "список профилей" },
  { href: "/admin/finance", label: "Финансы", description: "платежи и выводы" },
  { href: "#Настройки", label: "Настройки", description: "комиссия и правила" },
];

export default async function AdminPage() {
  const [students, teachers, scheduledLessons] = await Promise.all([
    db.studentProfile.count(),
    db.teacherProfile.count(),
    db.lesson.count({
      where: {
        status: "SCHEDULED",
      },
    }),
  ]);

  return (
    <DashboardShell
      compactHeader
      hideProfileCard
      nav={nav}
      profile={{
        initials: "AD",
        name: "Администратор",
        status: "Супер админ · полный доступ",
        meta: "Операционный центр школы · пользователи · расписание · настройки",
      }}
      roleLabel="Админ"
    >
      <div className="social-content-grid">
        <main className="social-wall">
          <Panel title="Платформа">
            <AdminOverviewPanel initial={{ scheduledLessons, students, teachers }} />
          </Panel>
          <Panel title="Участники">
            <div className="list">
              <Link className="list-item" href="/admin/teachers">
                <strong>Учителя</strong>
                <span>Открыть список профилей учителей</span>
              </Link>
              <Link className="list-item" href="/admin/students">
                <strong>Ученики</strong>
                <span>Открыть список профилей учеников</span>
              </Link>
            </div>
          </Panel>
          <Panel title="Настройки">
            <CommissionSettings />
          </Panel>
        </main>
      </div>
    </DashboardShell>
  );
}
