import { DashboardShell, Metric, Panel } from "@/components/DashboardShell";

export const dynamic = "force-dynamic";

const nav = [
  { href: "/admin", label: "Платформа", description: "главный экран" },
  { href: "/admin/sessions", label: "Сессии", description: "уроки и наблюдение" },
  { href: "/admin/teachers", label: "Учителя", description: "список профилей" },
  { href: "/admin/students", label: "Ученики", description: "список профилей" },
  { href: "/admin/finance", label: "Финансы", description: "платежи и выводы" },
];

export default function AdminFinancePage() {
  return (
    <DashboardShell
      compactHeader
      hideProfileCard
      logoutHref="/api/auth/logout"
      nav={nav}
      profile={{
        initials: "AD",
        name: "Администратор",
        status: "Супер админ · полный доступ",
        meta: "Финансовый раздел платформы",
      }}
      roleLabel="Админ"
    >
      <Panel title="Финансы">
        <div className="metric-grid">
          <Metric label="GMV" value="0 EUR" />
          <Metric label="Выводы" value="0" />
          <Metric label="Платежи" value="0" />
        </div>
      </Panel>
    </DashboardShell>
  );
}
