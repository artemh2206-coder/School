"use client";

import { ChevronLeft, ChevronRight, Maximize2, MessageSquare, Minimize2, PhoneOff } from "lucide-react";
import { useSearchParams } from "next/navigation";
import type { FormEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import { useLessons } from "@/components/ScheduleCalendar";

type LessonRoomShellProps = {
  backHref: string;
  isObserver?: boolean;
  participantId: string;
  participantName: string;
  participantRole: "STUDENT" | "TEACHER" | "ADMIN";
  studentIds?: string[];
  teacherIds?: string[];
};

type ChatMessage = {
  body: string;
  createdAt: string;
  id: string;
  senderId: string;
  senderName: string | null;
  senderRole: "STUDENT" | "TEACHER" | "ADMIN" | null;
};

export function LessonRoomShell({
  backHref,
  isObserver = false,
  participantId,
  participantName,
  participantRole,
  studentIds,
  teacherIds,
}: LessonRoomShellProps) {
  const searchParams = useSearchParams();
  const lessonIdFromUrl = searchParams.get("lessonId");
  const { lessons } = useLessons();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(true);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draftMessage, setDraftMessage] = useState("");
  const [chatError, setChatError] = useState("");

  const fallbackLesson = useMemo(
    () =>
      [...lessons]
        .filter((lesson) => lesson.isFuture)
        .filter((lesson) => !teacherIds?.length || teacherIds.includes(lesson.teacherId))
        .filter((lesson) => !studentIds?.length || studentIds.includes(lesson.studentId))
        .sort((a, b) => new Date(a.startsAtIso).getTime() - new Date(b.startsAtIso).getTime())[0],
    [lessons, studentIds, teacherIds],
  );
  const lessonId = lessonIdFromUrl ?? fallbackLesson?.id ?? "";

  useEffect(() => {
    const sync = () => setIsFullscreen(Boolean(document.fullscreenElement));

    sync();
    document.addEventListener("fullscreenchange", sync);
    return () => document.removeEventListener("fullscreenchange", sync);
  }, []);

  async function toggleFullscreen() {
    if (document.fullscreenElement) {
      await document.exitFullscreen();
      return;
    }

    await document.documentElement.requestFullscreen();
  }

  useEffect(() => {
    if (!lessonId || isObserver || participantRole === "ADMIN") return;

    const payload = JSON.stringify({
      participantId,
      role: participantRole,
    });

    const syncPresence = () => {
      fetch(`/api/lessons/${lessonId}/session`, {
        body: payload,
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      }).catch(() => undefined);
    };

    syncPresence();
    const timer = window.setInterval(syncPresence, 5000);

    return () => window.clearInterval(timer);
  }, [isObserver, lessonId, participantId, participantRole]);

  useEffect(() => {
    if (!lessonId) return;

    let active = true;

    async function syncMessages() {
      try {
        const response = await fetch(`/api/lessons/${lessonId}/chat`, { cache: "no-store" });
        if (!response.ok) throw new Error("Chat sync failed");

        const data = (await response.json()) as { messages: ChatMessage[] };
        if (active) {
          setMessages(data.messages);
          setChatError("");
        }
      } catch {
        if (active) setChatError("Чат временно недоступен");
      }
    }

    syncMessages();
    const timer = window.setInterval(syncMessages, 1500);

    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [lessonId]);

  async function finishLesson() {
    if (lessonId && !isObserver && participantRole !== "ADMIN") {
      await fetch(`/api/lessons/${lessonId}/session`, {
        body: JSON.stringify({
          participantId,
          role: participantRole,
        }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "PATCH",
      }).catch(() => undefined);
    }

    window.location.href = backHref;
  }

  async function sendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const body = draftMessage.trim();
    if (!body || !lessonId || isObserver) return;

    setDraftMessage("");
    const response = await fetch(`/api/lessons/${lessonId}/chat`, {
      body: JSON.stringify({
        body,
        senderId: participantId,
        senderName: participantName,
        senderRole: participantRole,
      }),
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
    });

    if (!response.ok) {
      setDraftMessage(body);
      setChatError("Не удалось отправить сообщение");
      return;
    }

    const data = (await response.json()) as { messages: ChatMessage[] };
    setMessages(data.messages);
    setChatError("");
  }

  return (
    <main className={`lesson-room-shell ${isChatOpen ? "chat-open" : "chat-closed"}`}>
      <div className="lesson-room-toolbar">
        <button onClick={toggleFullscreen} type="button">
          {isFullscreen ? <Minimize2 aria-hidden="true" size={18} /> : <Maximize2 aria-hidden="true" size={18} />}
          <span>{isFullscreen ? "Свернуть" : "На весь экран"}</span>
        </button>
        <button className="lesson-room-danger" onClick={finishLesson} type="button">
          <PhoneOff aria-hidden="true" size={18} />
          <span>{isObserver ? "Выйти из наблюдения" : "Закончить урок"}</span>
        </button>
      </div>

      <button
        className="lesson-room-chat-toggle"
        onClick={() => setIsChatOpen((value) => !value)}
        type="button"
        aria-label={isChatOpen ? "Свернуть чат" : "Развернуть чат"}
      >
        {isChatOpen ? <ChevronRight aria-hidden="true" size={18} /> : <ChevronLeft aria-hidden="true" size={18} />}
        <MessageSquare aria-hidden="true" size={18} />
        <span>{isChatOpen ? "Свернуть чат" : "Развернуть чат"}</span>
      </button>

      <section className="lesson-room-stage" aria-label="Рабочая область урока">
        <div className="lesson-room-video">
          <div className="lesson-room-video-placeholder">
            <span>Zoom трансляция</span>
          </div>
        </div>

        <aside className="lesson-room-chat" aria-label="Чат урока">
          <div className="lesson-room-chat-panel">
            <header>
              <span>Чат урока</span>
              <strong>Сообщения</strong>
            </header>
            <div className="lesson-room-chat-feed">
              {!lessonId ? (
                <div className="lesson-room-chat-note">Ближайший урок пока не найден.</div>
              ) : null}
              {messages.map((message) => (
                <div
                  className={`lesson-room-message ${message.senderId === participantId ? "own" : ""} ${message.senderId === "SYSTEM" ? "system" : ""}`}
                  key={message.id}
                >
                  <span>{message.senderName ?? message.senderId}</span>
                  <p>{message.body}</p>
                </div>
              ))}
              {chatError ? <div className="lesson-room-chat-note">{chatError}</div> : null}
            </div>
            <form className="lesson-room-chat-form" onSubmit={sendMessage}>
              <input
                aria-label="Сообщение в чат"
                disabled={!lessonId || isObserver}
                onChange={(event) => setDraftMessage(event.target.value)}
                placeholder={isObserver ? "Наблюдатель не пишет в чат" : lessonId ? "Написать сообщение..." : "Нет активного урока"}
                value={draftMessage}
              />
              <button disabled={!lessonId || isObserver || !draftMessage.trim()} type="submit">Отправить</button>
            </form>
          </div>
        </aside>
      </section>
    </main>
  );
}
