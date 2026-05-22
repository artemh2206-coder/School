"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { PlatformParticipantRole } from "@/lib/platform-participants";

export type AdminParticipantView = {
  createdAt: string;
  fullName: string;
  id: string;
  isOnline: boolean;
  lastSeenAt: string | null;
  nextLesson: {
    counterpartId: string;
    counterpartName: string;
    id: string;
    startsAt: string;
    topic: string;
  } | null;
  role: PlatformParticipantRole;
  status: "ACTIVE" | "ARCHIVED" | "INVITED" | "SUSPENDED";
};

const statusLabels = {
  ACTIVE: "Активен",
  ARCHIVED: "В архиве",
  INVITED: "Приглашен",
  SUSPENDED: "Заблокирован",
};

function formatDate(value: string | null) {
  if (!value) return "еще не заходил";

  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));
}

function formatNextLesson(participant: AdminParticipantView) {
  if (!participant.nextLesson) return "не назначен";

  return `${formatDate(participant.nextLesson.startsAt)} · ${participant.nextLesson.counterpartName}`;
}

export function serializeAdminParticipant(participant: {
  createdAt: Date;
  fullName: string;
  id: string;
  isOnline: boolean;
  lastSeenAt: Date | null;
  nextLesson: {
    counterpartId: string;
    counterpartName: string;
    id: string;
    startsAt: Date;
    topic: string;
  } | null;
  role: PlatformParticipantRole;
  status: AdminParticipantView["status"];
}): AdminParticipantView {
  return {
    ...participant,
    createdAt: participant.createdAt.toISOString(),
    lastSeenAt: participant.lastSeenAt?.toISOString() ?? null,
    nextLesson: participant.nextLesson
      ? {
          ...participant.nextLesson,
          startsAt: participant.nextLesson.startsAt.toISOString(),
        }
      : null,
  };
}

export function AdminParticipantsList({
  participants: initialParticipants,
  role,
}: {
  participants: AdminParticipantView[];
  role: PlatformParticipantRole;
}) {
  const [participants, setParticipants] = useState(initialParticipants);
  const baseHref = role === "TEACHER" ? "/admin/teachers" : "/admin/students";

  useEffect(() => {
    let active = true;

    async function sync() {
      try {
        const response = await fetch(`/api/admin/participants?role=${role}`, { cache: "no-store" });
        if (!response.ok) return;
        const data = (await response.json()) as { participants: AdminParticipantView[] };
        if (active) setParticipants(data.participants);
      } catch {
        if (active) setParticipants((current) => current);
      }
    }

    sync();
    const timer = window.setInterval(sync, 1500);

    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [role]);

  if (!participants.length) {
    return <div className="empty-state">Пока нет зарегистрированных профилей.</div>;
  }

  return (
    <div className="admin-participants-list">
      {participants.map((participant) => (
        <Link className="admin-participant-row" href={`${baseHref}/${participant.id}`} key={participant.id}>
          <div>
            <strong>{participant.fullName}</strong>
            <span>{participant.id}</span>
          </div>
          <div>
            <span>Статус профиля</span>
            <strong>{statusLabels[participant.status]}</strong>
          </div>
          <div>
            <span>Онлайн</span>
            <strong className={participant.isOnline ? "online-text" : undefined}>
              {participant.isOnline ? "онлайн" : "не онлайн"}
            </strong>
          </div>
          <div>
            <span>Последний вход</span>
            <strong>{formatDate(participant.lastSeenAt)}</strong>
          </div>
          <div>
            <span>Ближайший урок</span>
            <strong>{formatNextLesson(participant)}</strong>
          </div>
        </Link>
      ))}
    </div>
  );
}

export function AdminParticipantProfile({ participant }: { participant: AdminParticipantView }) {
  return (
    <div className="admin-profile-details">
      <div>
        <span>ID</span>
        <strong>{participant.id}</strong>
      </div>
      <div>
        <span>Статус профиля</span>
        <strong>{statusLabels[participant.status]}</strong>
      </div>
      <div>
        <span>Онлайн</span>
        <strong className={participant.isOnline ? "online-text" : undefined}>
          {participant.isOnline ? "онлайн" : "не онлайн"}
        </strong>
      </div>
      <div>
        <span>Последний вход</span>
        <strong>{formatDate(participant.lastSeenAt)}</strong>
      </div>
      <div>
        <span>Дата регистрации</span>
        <strong>{formatDate(participant.createdAt)}</strong>
      </div>
      <div>
        <span>Ближайший урок</span>
        <strong>{formatNextLesson(participant)}</strong>
      </div>
    </div>
  );
}
