import Link from "next/link";
import type { ReactNode } from "react";
import { ScheduleCalendar } from "./ScheduleCalendar";

type NavItem = {
  href: string;
  label: string;
  description: string;
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
  nav,
  profile,
  roleLabel,
  scheduleEditable = false,
}: {
  children: ReactNode;
  coverSlot?: ReactNode;
  nav: NavItem[];
  profile: Profile;
  roleLabel: string;
  scheduleEditable?: boolean;
}) {
  const hasSchedule = nav.some((item) => item.href === "#schedule-modal");

  return (
    <main className="social-shell">
      <aside className="social-sidebar">
        <Link className="social-logo" href="/">
          <span>School OS</span>
        </Link>
        <nav className="social-tabs" aria-label={roleLabel}>
          {nav.map((item) => (
            <a href={item.href} key={item.href}>
              <strong>{item.label}</strong>
              <span>{item.description}</span>
            </a>
          ))}
        </nav>
      </aside>

      <section className="social-main">
        <header className="social-cover">
          <div>
            <p>{roleLabel}</p>
            <h1>
              {profile.name} {profile.id ? <span className="profile-id">{profile.id}</span> : null}
            </h1>
          </div>
          {coverSlot ? <div className="cover-slot">{coverSlot}</div> : null}
        </header>

        <section className="profile-layout">
          <aside className="profile-card">
            <div className="profile-photo">{profile.initials}</div>
            <h2>
              {profile.name} {profile.id ? <span className="profile-id">{profile.id}</span> : null}
            </h2>
            <p>{profile.meta}</p>
            <span className="profile-status">{profile.status}</span>
          </aside>

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
            <ScheduleCalendar editable={scheduleEditable} />
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
