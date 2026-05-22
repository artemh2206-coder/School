"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type Option = {
  fullName: string;
  id: string;
};

export type AdminSessionDetail = {
  actualEndedAt: string | null;
  actualStartedAt: string | null;
  createdAt: string;
  endsAt: string;
  id: string;
  messages: {
    body: string;
    createdAt: string;
    id: string;
    senderId: string;
    senderName: string | null;
    senderRole: string | null;
  }[];
  presences: {
    connectedAt: string;
    disconnectedAt: string | null;
    id: string;
    lastSeenAt: string;
    participantId: string;
    role: string;
  }[];
  startsAt: string;
  status: "SCHEDULED" | "COMPLETED" | "CANCELLED" | "NO_SHOW";
  student: Option;
  teacher: Option;
  topic: string;
  transcriptPurgedAt: string | null;
  transcriptRetainUntil: string | null;
  updatedAt: string;
  zoomUrl: string | null;
};

function formatDate(value: string | null) {
  if (!value) return "не задано";

  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));
}

function toDatetimeLocal(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  const offsetMs = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
}

function fromDatetimeLocal(value: string) {
  return value ? new Date(value).toISOString() : null;
}

function durationMinutes(start: string | null, end: string | null) {
  if (!start || !end) return "";
  return String(Math.max(0, Math.floor((new Date(end).getTime() - new Date(start).getTime()) / 60_000)));
}

export function AdminSessionDetails({
  initialSession,
  students,
  teachers,
}: {
  initialSession: AdminSessionDetail;
  students: Option[];
  teachers: Option[];
}) {
  const router = useRouter();
  const [session, setSession] = useState(initialSession);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    actualEndedAt: toDatetimeLocal(initialSession.actualEndedAt),
    actualStartedAt: toDatetimeLocal(initialSession.actualStartedAt),
    createdAt: toDatetimeLocal(initialSession.createdAt),
    durationMinutes: durationMinutes(initialSession.actualStartedAt, initialSession.actualEndedAt),
    endsAt: toDatetimeLocal(initialSession.endsAt),
    startsAt: toDatetimeLocal(initialSession.startsAt),
    status: initialSession.status,
    studentId: initialSession.student.id,
    teacherId: initialSession.teacher.id,
    topic: initialSession.topic,
    transcriptRetainUntil: toDatetimeLocal(initialSession.transcriptRetainUntil),
  });

  useEffect(() => {
    if (isEditing) return;
    let active = true;

    async function sync() {
      try {
        const response = await fetch(`/api/admin/sessions/${session.id}`, { cache: "no-store" });
        if (!response.ok) return;
        const data = (await response.json()) as { session: AdminSessionDetail };
        if (active) setSession(data.session);
      } catch {
        if (active) setSession((current) => current);
      }
    }

    const timer = window.setInterval(sync, 1500);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [isEditing, session.id]);

  const details = useMemo(
    () => [
      ["ID сессии", session.id],
      ["Статус", session.status],
      ["Создана", formatDate(session.createdAt)],
      ["Плановое начало", formatDate(session.startsAt)],
      ["Плановое завершение", formatDate(session.endsAt)],
      ["Фактический старт", formatDate(session.actualStartedAt)],
      ["Фактическое завершение", formatDate(session.actualEndedAt)],
      ["Длительность", `${durationMinutes(session.actualStartedAt, session.actualEndedAt) || 0} мин`],
      ["Учитель", `${session.teacher.fullName} · ${session.teacher.id}`],
      ["Ученик", `${session.student.fullName} · ${session.student.id}`],
      ["Хранить переписку до", formatDate(session.transcriptRetainUntil)],
    ],
    [session],
  );

  function updateForm(key: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function save() {
    setError("");
    const response = await fetch(`/api/admin/sessions/${session.id}`, {
      body: JSON.stringify({
        actualEndedAt: fromDatetimeLocal(form.actualEndedAt),
        actualStartedAt: fromDatetimeLocal(form.actualStartedAt),
        createdAt: fromDatetimeLocal(form.createdAt),
        durationMinutes: form.durationMinutes ? Number(form.durationMinutes) : null,
        endsAt: fromDatetimeLocal(form.endsAt),
        startsAt: fromDatetimeLocal(form.startsAt),
        status: form.status,
        studentId: form.studentId,
        teacherId: form.teacherId,
        topic: form.topic,
        transcriptRetainUntil: fromDatetimeLocal(form.transcriptRetainUntil),
      }),
      headers: {
        "Content-Type": "application/json",
      },
      method: "PATCH",
    });

    if (!response.ok) {
      setError("Не удалось сохранить изменения.");
      return;
    }

    const data = (await response.json()) as { session: AdminSessionDetail };
    setSession(data.session);
    setIsEditing(false);
  }

  async function deleteSession() {
    if (!window.confirm("Удалить сессию полностью вместе с чатом, presence и всеми связанными данными?")) return;

    const response = await fetch(`/api/admin/sessions/${session.id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      setError("Не удалось удалить сессию.");
      return;
    }

    router.push("/admin/sessions");
  }

  return (
    <div className="admin-session-details">
      <div className="admin-session-actions">
        <Link className="button primary" href={`/admin/session/live?lessonId=${encodeURIComponent(session.id)}`} target="_blank">
          Подключиться к сессии
        </Link>
        <button className="button" onClick={() => setIsEditing((value) => !value)} type="button">
          {isEditing ? "Закрыть редактирование" : "Редактировать сессию"}
        </button>
        <button className="button danger" onClick={deleteSession} type="button">Удалить сессию</button>
      </div>

      {error ? <div className="empty-state">{error}</div> : null}

      <div className="admin-profile-details">
        {details.map(([label, value]) => (
          <div key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
          </div>
        ))}
      </div>

      {isEditing ? (
        <div className="admin-session-edit">
          <label>
            Тема
            <input value={form.topic} onChange={(event) => updateForm("topic", event.target.value)} />
          </label>
          <label>
            Статус
            <select value={form.status} onChange={(event) => updateForm("status", event.target.value)}>
              <option value="SCHEDULED">SCHEDULED</option>
              <option value="COMPLETED">COMPLETED</option>
              <option value="CANCELLED">CANCELLED</option>
              <option value="NO_SHOW">NO_SHOW</option>
            </select>
          </label>
          <label>
            Учитель
            <select value={form.teacherId} onChange={(event) => updateForm("teacherId", event.target.value)}>
              {teachers.map((teacher) => (
                <option key={teacher.id} value={teacher.id}>{teacher.id} · {teacher.fullName}</option>
              ))}
            </select>
          </label>
          <label>
            Ученик
            <select value={form.studentId} onChange={(event) => updateForm("studentId", event.target.value)}>
              {students.map((student) => (
                <option key={student.id} value={student.id}>{student.id} · {student.fullName}</option>
              ))}
            </select>
          </label>
          <label>
            Время создания
            <input type="datetime-local" value={form.createdAt} onChange={(event) => updateForm("createdAt", event.target.value)} />
          </label>
          <label>
            Плановое начало
            <input type="datetime-local" value={form.startsAt} onChange={(event) => updateForm("startsAt", event.target.value)} />
          </label>
          <label>
            Плановое завершение
            <input type="datetime-local" value={form.endsAt} onChange={(event) => updateForm("endsAt", event.target.value)} />
          </label>
          <label>
            Фактический старт
            <input type="datetime-local" value={form.actualStartedAt} onChange={(event) => updateForm("actualStartedAt", event.target.value)} />
          </label>
          <label>
            Фактическое завершение
            <input type="datetime-local" value={form.actualEndedAt} onChange={(event) => updateForm("actualEndedAt", event.target.value)} />
          </label>
          <label>
            Длительность, минут
            <input min="0" type="number" value={form.durationMinutes} onChange={(event) => updateForm("durationMinutes", event.target.value)} />
          </label>
          <label>
            Хранить переписку до
            <input type="datetime-local" value={form.transcriptRetainUntil} onChange={(event) => updateForm("transcriptRetainUntil", event.target.value)} />
          </label>
          <button className="button primary" onClick={save} type="button">Сохранить</button>
        </div>
      ) : null}

      <div className="admin-session-chat-history">
        <h3>История чата</h3>
        {session.messages.length ? (
          session.messages.map((message) => (
            <div className="list-item" key={message.id}>
              <strong>{message.senderName ?? message.senderId} · {formatDate(message.createdAt)}</strong>
              <span>{message.body}</span>
            </div>
          ))
        ) : (
          <div className="empty-state">В этой сессии пока нет сообщений.</div>
        )}
      </div>
    </div>
  );
}
