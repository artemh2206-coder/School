import { DashboardShell, Metric, Panel } from "@/components/DashboardShell";
import { CommissionSettings } from "@/components/ScheduleCalendar";

const nav = [
  { href: "#Платформа", label: "Платформа", description: "здоровье системы" },
  { href: "#Пользователи", label: "Пользователи", description: "ученики и учителя" },
  { href: "#Заявки", label: "Заявки", description: "CV и регистрации" },
  { href: "#Финансы", label: "Финансы", description: "платежи и выводы" },
  { href: "#Настройки", label: "Настройки", description: "комиссия и правила" },
];

export default function AdminPage() {
  return (
    <DashboardShell
      nav={nav}
      profile={{
        initials: "AD",
        name: "Администратор",
        status: "Супер админ · полный доступ",
        meta: "Операционный центр школы · финансы · пользователи · логи",
      }}
      roleLabel="Админ"
    >
      <div className="social-content-grid">
        <main className="social-wall">
          <Panel title="Платформа">
            <div className="metric-grid">
              <Metric label="Ученики" value="412" />
              <Metric label="Учителя" value="38" />
              <Metric label="Инциденты" value="0" />
            </div>
          </Panel>
          <Panel title="Заявки">
            <div className="list">
              <div className="list-item">
                <strong>CV преподавателя</strong>
                <span>teacher@example.com · новая</span>
              </div>
              <div className="list-item">
                <strong>Регистрация ученика</strong>
                <span>student@example.com · ожидает оплаты</span>
              </div>
            </div>
          </Panel>
          <Panel title="Настройки">
            <CommissionSettings />
          </Panel>
        </main>
        <aside className="social-side">
          <Panel title="Финансы">
            <div className="metric-grid">
              <Metric label="GMV" value="84K EUR" />
              <Metric label="Выводы" value="14" />
              <Metric label="Платежи" value="27" />
            </div>
          </Panel>
          <Panel title="Пользователи">
            <div className="list">
              <div className="list-item">
                <strong>Создание учителя</strong>
                <span>только админ после CV</span>
              </div>
              <div className="list-item">
                <strong>Блокировка</strong>
                <span>ученик / учитель / сессия</span>
              </div>
            </div>
          </Panel>
        </aside>
      </div>
    </DashboardShell>
  );
}
