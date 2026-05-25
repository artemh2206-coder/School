import Link from "next/link";
import type { ReactNode } from "react";
import { LanguageSwitcher } from "./LanguageRuntime";
import { ScheduleCalendar } from "./ScheduleCalendar";

type NavItem = {
  description: string;
  href: string;
  label: string;
  newTab?: boolean;
};

type Profile = {
  id?: string;
  initials: string;
  name: string;
  status: string;
  meta: string;
};

export function DashboardShell({
  children,
  coverSlot,
  dashboardHomeLayout = false,
  hideProfileCard = false,
  logoutHref,
  nav,
  profile,
  roleLabel,
  compactHeader = false,
  scheduleEditable = false,
  scheduleTeacherId,
}: {
  children: ReactNode;
  coverSlot?: ReactNode;
  dashboardHomeLayout?: boolean;
  hideProfileCard?: boolean;
  logoutHref?: string;
  nav: NavItem[];
  profile: Profile;
  roleLabel: string;
  compactHeader?: boolean;
  scheduleEditable?: boolean;
  scheduleTeacherId?: string;
}) {
  const hasSchedule = scheduleEditable || nav.some((item) => item.href === "#schedule-modal");

  return (
    <main className="social-shell">
      <aside className="social-sidebar">
        <Link className="social-logo" href="/">
          <span>NeoSchool</span>
        </Link>
        <nav className="social-tabs" aria-label={roleLabel}>
          {nav.map((item) => (
            <a
              href={item.href}
              key={item.href}
              rel={item.newTab || item.href.includes("/lesson") ? "noreferrer" : undefined}
              target={item.newTab || item.href.includes("/lesson") ? "_blank" : undefined}
            >
              <strong>{item.label}</strong>
              <span>{item.description}</span>
            </a>
          ))}
        </nav>
      </aside>

      <section className="social-main">
        <header className={`social-cover ${compactHeader ? "compact" : ""}`}>
          <div>
            <p>{roleLabel}</p>
            <h1>
              {profile.name} {profile.id ? <span className="profile-id">{profile.id}</span> : null}
            </h1>
          </div>
          <div className="dashboard-header-actions">
            {coverSlot ? <div className="cover-slot">{coverSlot}</div> : null}
            <LanguageSwitcher />
            {logoutHref ? (
              <Link className="button header-logout" href={logoutHref}>
                Выйти
              </Link>
            ) : null}
          </div>
        </header>

        <section className={`profile-layout ${hideProfileCard ? "without-profile-card" : ""} ${dashboardHomeLayout ? "dashboard-profile-layout" : ""}`}>
          {hideProfileCard ? null : (
            <aside className="profile-card">
              <div className="profile-photo">{profile.initials}</div>
              <h2>
                {profile.name} {profile.id ? <span className="profile-id">{profile.id}</span> : null}
              </h2>
              <p>{profile.meta}</p>
              <span className="profile-status">{profile.status}</span>
            </aside>
          )}

          <div className="profile-feed">{children}</div>
        </section>
      </section>

      {hasSchedule ? (
        <div className="calendar-modal" id="schedule-modal" role="dialog" aria-modal="true" aria-label="Расписание">
          <div className="calendar-modal-card">
            <div className="calendar-modal-header">
              <div>
                <p>Май 2026</p>
                <h2>Расписание</h2>
              </div>
              <a href="#">
                Закрыть
              </a>
            </div>
            <ScheduleCalendar editable={scheduleEditable} teacherId={scheduleTeacherId} />
          </div>
        </div>
      ) : null}
    </main>
  );
}

export function Panel({
  children,
  title,
}: {
  children: ReactNode;
  title: string;
}) {
  return (
    <section className="social-panel" id={title}>
      <div className="social-panel-title">
        <h2>{title}</h2>
      </div>
      {children}
    </section>
  );
}

export function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="social-metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
