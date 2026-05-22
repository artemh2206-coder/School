import { AdminSessionsPanel } from "@/components/AdminSessionsPanel";
import { DashboardShell, Panel } from "@/components/DashboardShell";

export const dynamic = "force-dynamic";

const nav = [
  { href: "/admin", label: "Платформа", description: "главный экран" },
  { href: "/admin/sessions", label: "Сессии", description: "уроки и наблюдение", newTab: true },
  { href: "/admin/teachers", label: "Учителя", description: "список профилей" },
  { href: "/admin/students", label: "Ученики", description: "список профилей" },
  { href: "/admin/finance", label: "Финансы", description: "платежи и выводы" },
];

export default function AdminSessionsPage() {
  return (
    <DashboardShell
      compactHeader
      hideProfileCard
      nav={nav}
      profile={{
        initials: "AD",
        name: "Администратор",
        status: "Супер админ · полный доступ",
        meta: "Наблюдение за уроками и история сессий",
      }}
      roleLabel="Админ"
    >
      <Panel title="Сессии">
        <AdminSessionsPanel />
      </Panel>
    </DashboardShell>
  );
}
