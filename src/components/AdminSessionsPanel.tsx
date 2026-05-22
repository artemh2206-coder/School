"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type AdminSession = {
  actualEndedAt: string | null;
  actualStartedAt: string | null;
  createdAt: string;
  id: string;
  isLive: boolean;
  startsAt: string;
  status: string;
  transcriptPurgedAt: string | null;
  transcriptRetainUntil: string | null;
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

function formatRetainTimer(session: AdminSession) {
  if (session.transcriptPurgedAt) return `чат очищен ${formatDateTime(session.transcriptPurgedAt)}`;
  if (!session.transcriptRetainUntil) return "таймер очистки появится после завершения";

  const ms = new Date(session.transcriptRetainUntil).getTime() - Date.now();
  if (ms <= 0) return "чат ожидает очистки";

  const totalHours = Math.ceil(ms / 3_600_000);
  const days = Math.floor(totalHours / 24);
  const hours = totalHours % 24;

  return days > 0 ? `чат очистится через ${days} д ${hours} ч` : `чат очистится через ${hours} ч`;
}

function getSessionKind(session: AdminSession) {
  if (session.actualEndedAt || session.status === "COMPLETED") return "completed";
  if (session.status === "CANCELLED") return "cancelled";
  return "planned";
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

function uniqueById(items: { fullName: string; id: string }[]) {
  return Array.from(new Map(items.map((item) => [item.id, item])).values()).sort((a, b) => a.id.localeCompare(b.id));
}

export function AdminSessionsPanel() {
  const [sessions, setSessions] = useState<AdminSession[]>([]);
  const [teacherId, setTeacherId] = useState("ALL");
  const [studentId, setStudentId] = useState("ALL");
  const [kind, setKind] = useState("ALL");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

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

  const teachers = useMemo(() => uniqueById(sessions.map((session) => session.teacher)), [sessions]);
  const students = useMemo(() => uniqueById(sessions.map((session) => session.student)), [sessions]);
  const visibleSessions = useMemo(
    () =>
      [...sessions]
        .filter((session) => teacherId === "ALL" || session.teacher.id === teacherId)
        .filter((session) => studentId === "ALL" || session.student.id === studentId)
        .filter((session) => kind === "ALL" || getSessionKind(session) === kind)
        .sort((a, b) => {
          const left = new Date(a.startsAt).getTime();
          const right = new Date(b.startsAt).getTime();
          return sortDirection === "asc" ? left - right : right - left;
        }),
    [kind, sessions, sortDirection, studentId, teacherId],
  );

  if (!sessions.length) {
    return <div className="empty-state">Сессий пока нет. Они появятся после создания уроков в расписании.</div>;
  }

  return (
    <div className="admin-sessions-section">
      <div className="admin-session-filters">
        <label>
          Учитель
          <select value={teacherId} onChange={(event) => setTeacherId(event.target.value)}>
            <option value="ALL">Все учителя</option>
            {teachers.map((teacher) => (
              <option key={teacher.id} value={teacher.id}>{teacher.id} · {teacher.fullName}</option>
            ))}
          </select>
        </label>
        <label>
          Ученик
          <select value={studentId} onChange={(event) => setStudentId(event.target.value)}>
            <option value="ALL">Все ученики</option>
            {students.map((student) => (
              <option key={student.id} value={student.id}>{student.id} · {student.fullName}</option>
            ))}
          </select>
        </label>
        <label>
          Статус
          <select value={kind} onChange={(event) => setKind(event.target.value)}>
            <option value="ALL">Все сессии</option>
            <option value="planned">Запланированные</option>
            <option value="completed">Завершенные</option>
            <option value="cancelled">Отмененные</option>
          </select>
        </label>
        <label>
          Плановое время
          <select value={sortDirection} onChange={(event) => setSortDirection(event.target.value as "asc" | "desc")}>
            <option value="desc">По убыванию</option>
            <option value="asc">По возрастанию</option>
          </select>
        </label>
      </div>

      {!visibleSessions.length ? (
        <div className="empty-state">По выбранным фильтрам сессий нет.</div>
      ) : (
        <div className="admin-sessions-list">
          {visibleSessions.map((session) => {
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
                  <small>план: {formatDateTime(session.startsAt)}</small>
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
                  <small>{formatRetainTimer(session)}</small>
                </div>
                <div className={`admin-session-status ${status.className}`}>{status.label}</div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
