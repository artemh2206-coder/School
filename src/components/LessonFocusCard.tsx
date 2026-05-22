"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useLessons } from "@/components/ScheduleCalendar";
import type { LessonWithTiming } from "@/lib/schedule-store";

type Counterpart = {
  id: string;
  initials: string;
  meta: string;
  name: string;
};

type LessonFocusCardProps = {
  counterpart: Counterpart;
  editableTopic?: boolean;
  editableZoom?: boolean;
  language: string;
  studentIds?: string[];
  teacherIds?: string[];
  theme: string;
  title: string;
};

type LessonSummaryCardProps = {
  counterpart: Counterpart;
  lessonHref: string;
  studentIds?: string[];
  teacherIds?: string[];
};

const monthNames = [
  "января",
  "февраля",
  "марта",
  "апреля",
  "мая",
  "июня",
  "июля",
  "августа",
  "сентября",
  "октября",
  "ноября",
  "декабря",
];

const weekLabels = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

function formatHour(hour: number) {
  return `${String(hour % 24).padStart(2, "0")}:00`;
}

function getZoomStorageKey(lessonId: string) {
  return `school-os-zoom-link:${lessonId}`;
}

function getTimeLeft(startsAtIso: string, now: number) {
  const diff = new Date(startsAtIso).getTime() - now;

  if (diff <= 0) {
    return { label: "Урок уже начался", hours: "00", minutes: "00" };
  }

  const totalMinutes = Math.floor(diff / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  return {
    hours: String(hours).padStart(2, "0"),
    label: `${hours} ч ${minutes} мин`,
    minutes: String(minutes).padStart(2, "0"),
  };
}

export function LessonSummaryCard({
  counterpart,
  lessonHref,
  studentIds,
  teacherIds,
}: LessonSummaryCardProps) {
  const { lessons } = useLessons();
  const [now, setNow] = useState(() => Date.now());

  const nextLesson = [...lessons]
    .filter((lesson) => lesson.isFuture)
    .filter((lesson) => !teacherIds?.length || teacherIds.includes(lesson.teacherId))
    .filter((lesson) => !studentIds?.length || studentIds.includes(lesson.studentId))
    .sort((a, b) => new Date(a.startsAtIso).getTime() - new Date(b.startsAtIso).getTime())[0];

  const lessonDate = nextLesson ? new Date(nextLesson.startsAtIso) : null;
  const timeLeft = nextLesson ? getTimeLeft(nextLesson.startsAtIso, now) : null;
  const lessonUrl = nextLesson ? `${lessonHref}?lessonId=${encodeURIComponent(nextLesson.id)}` : lessonHref;

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className="lesson-summary-card">
      <div className="lesson-summary-person">
        <div className="lesson-summary-avatar">{counterpart.initials}</div>
        <div>
          <span>Мини-профиль</span>
          <strong>{counterpart.name}</strong>
          <p>{counterpart.id} · {counterpart.meta}</p>
        </div>
      </div>

      <div className="lesson-summary-grid">
        <div>
          <span>Дата и время</span>
          <strong>
            {nextLesson && lessonDate
              ? `${weekLabels[nextLesson.day]}, ${lessonDate.getDate()} ${monthNames[nextLesson.month]}`
              : "Урок не назначен"}
          </strong>
          <p>{nextLesson ? `${formatHour(nextLesson.start)}-${formatHour(nextLesson.end)}` : "Появится после записи в расписании."}</p>
        </div>

        <div className="lesson-summary-timer">
          <span>До начала</span>
          <strong>
            {timeLeft ? `${timeLeft.hours}:${timeLeft.minutes}` : "--:--"}
          </strong>
          <p>{timeLeft?.label ?? "Таймер появится после назначения урока"}</p>
        </div>
      </div>

      <Link className={`lesson-summary-action ${nextLesson ? "" : "disabled"}`} href={lessonUrl} target="_blank">
        Подключиться к уроку
      </Link>
    </div>
  );
}

export function LessonFocusCard({
  counterpart,
  editableTopic = false,
  editableZoom = false,
  language,
  studentIds,
  teacherIds,
  theme,
  title,
}: LessonFocusCardProps) {
  const { lessons, setLessons } = useLessons();
  const [now, setNow] = useState(() => Date.now());
  const [zoomLink, setZoomLink] = useState("");

  const nextLesson = [...lessons]
    .filter((lesson) => lesson.isFuture)
    .filter((lesson) => !teacherIds?.length || teacherIds.includes(lesson.teacherId))
    .filter((lesson) => !studentIds?.length || studentIds.includes(lesson.studentId))
    .sort((a, b) => new Date(a.startsAtIso).getTime() - new Date(b.startsAtIso).getTime())[0];

  const activeZoomLink = nextLesson ? zoomLink : "";
  const activeTopic = nextLesson?.topic ?? theme;
  const timeLeft = nextLesson ? getTimeLeft(nextLesson.startsAtIso, now) : null;
  const lessonDate = nextLesson ? new Date(nextLesson.startsAtIso) : null;

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!nextLesson) return;

    const sync = () => {
      setZoomLink(window.localStorage.getItem(getZoomStorageKey(nextLesson.id)) ?? "");
    };

    sync();
    window.addEventListener("storage", sync);
    window.addEventListener("school-os-zoom-link", sync);

    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("school-os-zoom-link", sync);
    };
  }, [nextLesson]);

  function handleAttachZoom() {
    if (!nextLesson) return;

    const current = window.localStorage.getItem(getZoomStorageKey(nextLesson.id)) ?? "";
    const value = window.prompt("Вставьте ссылку Zoom", current);
    if (value === null) return;

    const trimmed = value.trim();
    window.localStorage.setItem(getZoomStorageKey(nextLesson.id), trimmed);
    setZoomLink(trimmed);
    window.dispatchEvent(new Event("school-os-zoom-link"));
  }

  async function handleTopicChange(topic: string) {
    if (!nextLesson) return;

    const trimmed = topic.trim();
    if (!trimmed || trimmed === activeTopic) return;

    const response = await fetch("/api/schedule", {
      body: JSON.stringify({ id: nextLesson.id, topic: trimmed }),
      headers: { "Content-Type": "application/json" },
      method: "PATCH",
    });
    const data = (await response.json()) as { lessons: LessonWithTiming[] };
    setLessons(data.lessons);
  }

  return (
    <div className="lesson-focus-card">
      <header className="lesson-focus-hero">
        <div className="lesson-focus-copy">
          <span className="lesson-focus-kicker">{title}</span>
          <h3>{nextLesson ? "Следующий урок под рукой" : "Следующий урок пока не назначен"}</h3>
          <p>
            {nextLesson
              ? "Все важное собрано в одном месте: кто участвует, когда старт, тема и готовность Zoom."
              : "Как только появится будущий урок, карточка сама покажет время, таймер и ссылку."}
          </p>
        </div>

        <div className="lesson-person-card">
          <div className="lesson-person-avatar">{counterpart.initials}</div>
          <div>
            <span className="lesson-person-label">Мини-профиль</span>
            <strong>{counterpart.name}</strong>
            <p>{counterpart.id} · {counterpart.meta}</p>
          </div>
        </div>
      </header>

      <section className="lesson-focus-runway">
        <div className="lesson-date-block">
          <span>Ближайший урок</span>
          <strong>
            {nextLesson && lessonDate
              ? `${weekLabels[nextLesson.day]}, ${lessonDate.getDate()} ${monthNames[nextLesson.month]}`
              : "Ожидает назначения"}
          </strong>
          <p>{nextLesson ? `${formatHour(nextLesson.start)}-${formatHour(nextLesson.end)}` : "Свободный слот появится в расписании."}</p>
        </div>

        <div className="lesson-countdown" aria-label={timeLeft?.label ?? "Таймер появится после назначения урока"}>
          <span>До начала</span>
          <div>
            <strong>{timeLeft?.hours ?? "--"}</strong>
            <small>ч</small>
            <strong>{timeLeft?.minutes ?? "--"}</strong>
            <small>мин</small>
          </div>
          <p>{timeLeft?.label ?? "Таймер появится позже"}</p>
        </div>
      </section>

      <section className="lesson-focus-details">
        <div>
          <span>Язык</span>
          <strong>{language}</strong>
        </div>
        <div>
          <span>Тема</span>
          {editableTopic ? (
            <input
              aria-label="Тема урока"
              className="lesson-topic-input"
              defaultValue={activeTopic}
              disabled={!nextLesson}
              key={nextLesson?.id ?? "empty-topic"}
              onBlur={(event) => handleTopicChange(event.target.value)}
            />
          ) : (
            <strong>{activeTopic}</strong>
          )}
        </div>
        <div className={activeZoomLink ? "zoom-chip ready" : "zoom-chip pending"}>
          <span>Zoom</span>
          <strong>{activeZoomLink ? "Ссылка прикреплена" : "Ссылка не прикреплена"}</strong>
        </div>
      </section>

      <footer className="lesson-focus-footer">
        <div className={`zoom-status ${activeZoomLink ? "ready" : "pending"}`}>
          <span>Zoom-ссылка</span>
          <strong>{activeZoomLink ? activeZoomLink : "Ожидает прикрепления"}</strong>
        </div>

        {editableZoom ? (
          <button className="zoom-action" onClick={handleAttachZoom} type="button" disabled={!nextLesson}>
            {activeZoomLink ? "Изменить ссылку Zoom" : "Прикрепить ссылку Zoom"}
          </button>
        ) : null}
      </footer>
    </div>
  );
}
