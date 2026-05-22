"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type AdminSession = {
  actualEndedAt: string | null;
  actualStartedAt: string | null;
  createdAt: string;
  id: string;
  isLive: boolean;
  startsAt: string;
  status: string;
  student: {
    fullName: string;
    id: string;
  };
  teacher: {
    fullName: string;
    id: string;
  };
};

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));
}

function formatDuration(startedAt: string | null, endedAt: string | null) {
  if (!startedAt) return "не началась";

  const start = new Date(startedAt);
  const end = endedAt ? new Date(endedAt) : new Date();
  const totalMinutes = Math.max(0, Math.floor((end.getTime() - start.getTime()) / 60000));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  return hours > 0 ? `${hours} ч ${minutes} мин` : `${minutes} мин`;
}

function getSessionStatus(session: AdminSession) {
  if (session.status === "CANCELLED") return { className: "cancelled", label: "отменена" };
  if (session.actualEndedAt) return { className: "done", label: `завершена ${formatDateTime(session.actualEndedAt)}` };
  if (session.isLive && session.actualStartedAt) {
    return { className: "active", label: `активна · ${formatDuration(session.actualStartedAt, null)}` };
  }
  if (session.actualStartedAt) return { className: "paused", label: "ожидает подключения" };

  return { className: "planned", label: `запланирована на ${formatDateTime(session.startsAt)}` };
}

export function AdminSessionsPanel() {
  const [sessions, setSessions] = useState<AdminSession[]>([]);

  useEffect(() => {
    let active = true;

    async function sync() {
      try {
        const response = await fetch("/api/admin/sessions", { cache: "no-store" });
        if (!response.ok) return;
        const data = (await response.json()) as { sessions: AdminSession[] };
        if (active) setSessions(data.sessions);
      } catch {
        if (active) setSessions((current) => current);
      }
    }

    sync();
    const timer = window.setInterval(sync, 1500);

    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, []);

  if (!sessions.length) {
    return <div className="empty-state">Сессий пока нет. Они появятся после создания уроков в расписании.</div>;
  }

  return (
    <div className="admin-sessions-list">
      {sessions.map((session) => {
        const status = getSessionStatus(session);

        return (
          <Link
            className="admin-session-row"
            href={`/admin/session?lessonId=${encodeURIComponent(session.id)}`}
            key={session.id}
          >
            <div>
              <strong>{session.id}</strong>
              <span>создана {formatDateTime(session.createdAt)}</span>
            </div>
            <div>
              <span>Учитель</span>
              <strong>{session.teacher.id}</strong>
              <small>{session.teacher.fullName}</small>
            </div>
            <div>
              <span>Ученик</span>
              <strong>{session.student.id}</strong>
              <small>{session.student.fullName}</small>
            </div>
            <div>
              <span>Длительность</span>
              <strong>{formatDuration(session.actualStartedAt, session.actualEndedAt)}</strong>
              <small>{session.actualStartedAt ? `старт ${formatDateTime(session.actualStartedAt)}` : "ожидает старта"}</small>
            </div>
            <div className={`admin-session-status ${status.className}`}>{status.label}</div>
          </Link>
        );
      })}
    </div>
  );
}
