"use client";

import { ChevronLeft, ChevronRight, Maximize2, MessageSquare, Minimize2, Paperclip, PhoneOff } from "lucide-react";
import { useSearchParams } from "next/navigation";
import type { FormEvent, PointerEvent, ReactNode } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useLessons } from "@/components/ScheduleCalendar";

type LessonRoomShellProps = {
  backHref: string;
  chatOnly?: boolean;
  controlSlot?: ReactNode;
  isObserver?: boolean;
  lessonId?: string;
  participantId: string;
  participantName: string;
  participantRole: "STUDENT" | "TEACHER" | "ADMIN";
  studentIds?: string[];
  teacherIds?: string[];
};

type ChatMessage = {
  attachmentData: string | null;
  attachmentMime: string | null;
  attachmentName: string | null;
  attachmentSize: number | null;
  body: string;
  createdAt: string;
  id: string;
  senderId: string;
  senderName: string | null;
  senderRole: "STUDENT" | "TEACHER" | "ADMIN" | null;
};

type ImageEditorState = {
  data: string;
  name: string;
};

type EditorText = {
  color: string;
  id: string;
  text: string;
  x: number;
  y: number;
};

type EditorSnapshot = {
  imageData: string;
  texts: EditorText[];
};

function ImageEditorModal({ image, onClose }: { image: ImageEditorState; onClose: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const historyRef = useRef<EditorSnapshot[]>([]);
  const [mode, setMode] = useState<"draw" | "erase" | "text">("draw");
  const [text, setText] = useState("Текст");
  const [color, setColor] = useState("#ef4444");
  const [zoom, setZoom] = useState(1);
  const [texts, setTexts] = useState<EditorText[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [dragText, setDragText] = useState<{ id: string; offsetX: number; offsetY: number } | null>(null);
  const [canvasSize, setCanvasSize] = useState({ height: 1, width: 1 });

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;

    const source = new Image();
    source.onload = () => {
      const maxWidth = 1100;
      const maxHeight = 720;
      const scale = Math.min(maxWidth / source.width, maxHeight / source.height, 1);
      canvas.width = Math.max(1, Math.round(source.width * scale));
      canvas.height = Math.max(1, Math.round(source.height * scale));
      setCanvasSize({ height: canvas.height, width: canvas.width });
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.drawImage(source, 0, 0, canvas.width, canvas.height);
      setTexts([]);
      historyRef.current = [];
    };
    source.src = image.data;
  }, [image.data]);

  function pushHistory() {
    const canvas = canvasRef.current;
    if (!canvas) return;

    historyRef.current = [
      ...historyRef.current,
      {
        imageData: canvas.toDataURL("image/png"),
        texts,
      },
    ].slice(-30);
  }

  function restoreCanvas(dataUrl: string) {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;

    const snapshot = new Image();
    snapshot.onload = () => {
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.drawImage(snapshot, 0, 0, canvas.width, canvas.height);
    };
    snapshot.src = dataUrl;
  }

  function undo() {
    const last = historyRef.current.at(-1);
    if (!last) return;

    historyRef.current = historyRef.current.slice(0, -1);
    setTexts(last.texts);
    restoreCanvas(last.imageData);
  }

  function getCanvasPoint(event: PointerEvent<HTMLElement>) {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * canvas.width,
      y: ((event.clientY - rect.top) / rect.height) * canvas.height,
    };
  }

  function start(event: PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;

    const point = getCanvasPoint(event);
    if (mode === "text") {
      pushHistory();
      setTexts((current) => [
        ...current,
        {
          color,
          id: crypto.randomUUID(),
          text: text || "Текст",
          x: point.x,
          y: point.y,
        },
      ]);
      return;
    }

    pushHistory();
    canvas.setPointerCapture(event.pointerId);
    context.globalCompositeOperation = mode === "erase" ? "destination-out" : "source-over";
    context.strokeStyle = mode === "erase" ? "rgba(0,0,0,1)" : color;
    context.lineWidth = mode === "erase" ? 18 : 4;
    context.lineCap = "round";
    context.beginPath();
    context.moveTo(point.x, point.y);
    setIsDrawing(true);
  }

  function move(event: PointerEvent<HTMLCanvasElement>) {
    if (!isDrawing || (mode !== "draw" && mode !== "erase")) return;
    const context = canvasRef.current?.getContext("2d");
    if (!context) return;

    const point = getCanvasPoint(event);
    context.lineTo(point.x, point.y);
    context.stroke();
  }

  function stop() {
    const context = canvasRef.current?.getContext("2d");
    if (context) context.globalCompositeOperation = "source-over";
    setIsDrawing(false);
  }

  function startTextDrag(event: PointerEvent<HTMLDivElement>, item: EditorText) {
    event.stopPropagation();
    pushHistory();
    const point = getCanvasPoint(event);
    setDragText({ id: item.id, offsetX: point.x - item.x, offsetY: point.y - item.y });
  }

  function moveText(event: PointerEvent<HTMLDivElement>) {
    if (!dragText) return;
    const point = getCanvasPoint(event);
    setTexts((current) =>
      current.map((item) =>
        item.id === dragText.id
          ? {
              ...item,
              x: point.x - dragText.offsetX,
              y: point.y - dragText.offsetY,
            }
          : item,
      ),
    );
  }

  function downloadEdited() {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const output = document.createElement("canvas");
    output.width = canvas.width;
    output.height = canvas.height;
    const context = output.getContext("2d");
    if (!context) return;

    context.drawImage(canvas, 0, 0);
    for (const item of texts) {
      context.fillStyle = item.color;
      context.font = "28px Arial";
      context.fillText(item.text, item.x, item.y);
    }

    const link = document.createElement("a");
    link.href = output.toDataURL("image/png");
    link.download = `edited-${image.name.replace(/\.[^.]+$/, "") || "image"}.png`;
    link.click();
  }

  return (
    <div className="image-editor-backdrop" role="dialog" aria-modal="true" aria-label="Редактор изображения">
      <div className="image-editor-panel">
        <div className="image-editor-toolbar">
          <strong>{image.name}</strong>
          <div>
            <button className={mode === "draw" ? "active" : ""} onClick={() => setMode("draw")} type="button">Рисовать</button>
            <button className={mode === "erase" ? "active" : ""} onClick={() => setMode("erase")} type="button">Ластик</button>
            <button className={mode === "text" ? "active" : ""} onClick={() => setMode("text")} type="button">Текст</button>
            <input aria-label="Цвет" type="color" value={color} onChange={(event) => setColor(event.target.value)} />
            <input aria-label="Текст" value={text} onChange={(event) => setText(event.target.value)} />
            <button onClick={() => setZoom((value) => Math.max(0.5, Number((value - 0.25).toFixed(2))))} type="button">-</button>
            <span>{Math.round(zoom * 100)}%</span>
            <button onClick={() => setZoom((value) => Math.min(3, Number((value + 0.25).toFixed(2))))} type="button">+</button>
            <button onClick={undo} type="button">Отменить</button>
            <button onClick={downloadEdited} type="button">Скачать</button>
            <button onClick={onClose} type="button">Закрыть</button>
          </div>
        </div>
        <div className="image-editor-canvas-scroll">
          <div
            className="image-editor-canvas-wrap"
            onPointerCancel={() => setDragText(null)}
            onPointerMove={moveText}
            onPointerUp={() => setDragText(null)}
            style={{ height: canvasSize.height * zoom, width: canvasSize.width * zoom }}
          >
            <canvas
              className="image-editor-canvas"
              onPointerCancel={stop}
              onPointerDown={start}
              onPointerMove={move}
              onPointerUp={stop}
              ref={canvasRef}
              style={{ height: canvasSize.height * zoom, width: canvasSize.width * zoom }}
            />
            {texts.map((item) => (
              <div
                className="image-editor-text-layer"
                key={item.id}
                onPointerDown={(event) => startTextDrag(event, item)}
                style={{
                  color: item.color,
                  fontSize: 28 * zoom,
                  left: item.x * zoom,
                  top: item.y * zoom - 28 * zoom,
                }}
              >
                {item.text}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function LessonRoomShell({
  backHref,
  chatOnly = false,
  controlSlot,
  isObserver = false,
  lessonId: fixedLessonId,
  participantId,
  participantName,
  participantRole,
  studentIds,
  teacherIds,
}: LessonRoomShellProps) {
  const searchParams = useSearchParams();
  const lessonIdFromUrl = searchParams.get("lessonId");
  const { lessons } = useLessons();
  const chatFeedRef = useRef<HTMLDivElement | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(true);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draftMessage, setDraftMessage] = useState("");
  const [chatError, setChatError] = useState("");
  const [attachment, setAttachment] = useState<{ data: string; mime: string; name: string; size: number } | null>(null);
  const [editorImage, setEditorImage] = useState<ImageEditorState | null>(null);

  const fallbackLesson = useMemo(
    () =>
      [...lessons]
        .filter((lesson) => lesson.isFuture)
        .filter((lesson) => !teacherIds?.length || teacherIds.includes(lesson.teacherId))
        .filter((lesson) => !studentIds?.length || studentIds.includes(lesson.studentId))
        .sort((a, b) => new Date(a.startsAtIso).getTime() - new Date(b.startsAtIso).getTime())[0],
    [lessons, studentIds, teacherIds],
  );
  const lessonId = fixedLessonId ?? lessonIdFromUrl ?? fallbackLesson?.id ?? "";

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
    if (!lessonId || isObserver || participantRole === "ADMIN" || chatOnly) return;
    const payload = JSON.stringify({ participantId, role: participantRole });
    const syncPresence = () => {
      fetch(`/api/lessons/${lessonId}/session`, {
        body: payload,
        headers: { "Content-Type": "application/json" },
        method: "POST",
      }).catch(() => undefined);
    };
    syncPresence();
    const timer = window.setInterval(syncPresence, 5000);
    return () => window.clearInterval(timer);
  }, [chatOnly, isObserver, lessonId, participantId, participantRole]);

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

  useEffect(() => {
    const feed = chatFeedRef.current;
    if (!feed || !isChatOpen) return;
    feed.scrollTop = feed.scrollHeight;
  }, [isChatOpen, messages.length]);

  async function finishLesson() {
    if (lessonId && !isObserver && participantRole !== "ADMIN" && !chatOnly) {
      await fetch(`/api/lessons/${lessonId}/session`, {
        body: JSON.stringify({ participantId, role: participantRole }),
        headers: { "Content-Type": "application/json" },
        method: "PATCH",
      }).catch(() => undefined);
    }
    window.location.href = backHref;
  }

  function selectAttachment(file: File | undefined) {
    if (!file) return;
    if (file.size > 2_500_000) {
      setChatError("Файл слишком большой. Сейчас лимит 2.5 MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== "string") return;
      setAttachment({ data: reader.result, mime: file.type || "application/octet-stream", name: file.name, size: file.size });
    };
    reader.readAsDataURL(file);
  }

  async function sendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const body = draftMessage.trim();
    const currentAttachment = attachment;
    if ((!body && !currentAttachment) || !lessonId || isObserver) return;

    setDraftMessage("");
    setAttachment(null);
    const response = await fetch(`/api/lessons/${lessonId}/chat`, {
      body: JSON.stringify({
        attachmentData: currentAttachment?.data,
        attachmentMime: currentAttachment?.mime,
        attachmentName: currentAttachment?.name,
        attachmentSize: currentAttachment?.size,
        body,
        senderId: participantId,
        senderName: participantName,
        senderRole: participantRole,
      }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });

    if (!response.ok) {
      setDraftMessage(body);
      setAttachment(currentAttachment);
      setChatError("Не удалось отправить сообщение");
      return;
    }

    const data = (await response.json()) as { messages: ChatMessage[] };
    setMessages(data.messages);
    setChatError("");
  }

  return (
    <main className={`lesson-room-shell ${isChatOpen ? "chat-open" : "chat-closed"} ${chatOnly ? "chat-only" : ""}`}>
      <div className="lesson-room-toolbar">
        {chatOnly ? null : (
          <button onClick={toggleFullscreen} type="button">
            {isFullscreen ? <Minimize2 aria-hidden="true" size={18} /> : <Maximize2 aria-hidden="true" size={18} />}
            <span>{isFullscreen ? "Свернуть" : "На весь экран"}</span>
          </button>
        )}
        {controlSlot}
        <button className="lesson-room-danger" onClick={finishLesson} type="button">
          <PhoneOff aria-hidden="true" size={18} />
          <span>{chatOnly || isObserver ? "Выйти" : "Закончить урок"}</span>
        </button>
      </div>

      {chatOnly ? null : (
        <button
          aria-label={isChatOpen ? "Свернуть чат" : "Развернуть чат"}
          className="lesson-room-chat-toggle"
          onClick={() => setIsChatOpen((value) => !value)}
          type="button"
        >
          {isChatOpen ? <ChevronRight aria-hidden="true" size={18} /> : <ChevronLeft aria-hidden="true" size={18} />}
          <MessageSquare aria-hidden="true" size={18} />
          <span>{isChatOpen ? "Свернуть чат" : "Развернуть чат"}</span>
        </button>
      )}

      <section className="lesson-room-stage" aria-label="Рабочая область урока">
        {chatOnly ? null : (
          <div className="lesson-room-video">
            <div className="lesson-room-video-placeholder">
              <span>Zoom трансляция</span>
            </div>
          </div>
        )}

        <aside className="lesson-room-chat" aria-label="Чат урока">
          <div className="lesson-room-chat-panel">
            <header>
              <span>{chatOnly ? "Чат и домашнее задание" : "Чат урока"}</span>
              <strong>Сообщения</strong>
            </header>
            <div className="lesson-room-chat-feed" ref={chatFeedRef}>
              {!lessonId ? <div className="lesson-room-chat-note">Урок пока не найден.</div> : null}
              {messages.map((message) => (
                <div className={`lesson-room-message ${message.senderId === participantId ? "own" : ""} ${message.senderId === "SYSTEM" ? "system" : ""}`} key={message.id}>
                  <span>{message.senderName ?? message.senderId}</span>
                  {message.body ? <p>{message.body}</p> : null}
                  {message.attachmentData && message.attachmentName ? (
                    message.attachmentMime?.startsWith("image/") ? (
                      <div className="lesson-room-image-attachment">
                        <button
                          className="lesson-room-attachment image"
                          onClick={() => setEditorImage({ data: message.attachmentData ?? "", name: message.attachmentName ?? "image" })}
                          type="button"
                        >
                          <img alt={message.attachmentName} src={message.attachmentData} />
                          <small>Открыть: {message.attachmentName}</small>
                        </button>
                        <a className="lesson-room-download-link" download={message.attachmentName} href={message.attachmentData}>Скачать</a>
                      </div>
                    ) : (
                      <a className="lesson-room-attachment file" download={message.attachmentName} href={message.attachmentData}>
                        <Paperclip aria-hidden="true" size={16} />
                        <small>{message.attachmentName}</small>
                      </a>
                    )
                  ) : null}
                </div>
              ))}
              {chatError ? <div className="lesson-room-chat-note">{chatError}</div> : null}
            </div>
            <form className="lesson-room-chat-form" onSubmit={sendMessage}>
              {attachment ? (
                <div className="lesson-room-selected-file">
                  <span>{attachment.name}</span>
                  <button onClick={() => setAttachment(null)} type="button">Убрать</button>
                </div>
              ) : null}
              <input
                aria-label="Сообщение в чат"
                disabled={!lessonId || isObserver}
                onChange={(event) => setDraftMessage(event.target.value)}
                placeholder={isObserver ? "Наблюдатель не пишет в чат" : lessonId ? "Написать сообщение..." : "Нет активного урока"}
                value={draftMessage}
              />
              <label className="lesson-room-file-button">
                <Paperclip aria-hidden="true" size={18} />
                <input disabled={!lessonId || isObserver} onChange={(event) => selectAttachment(event.target.files?.[0])} type="file" />
              </label>
              <button disabled={!lessonId || isObserver || (!draftMessage.trim() && !attachment)} type="submit">Отправить</button>
            </form>
          </div>
        </aside>
      </section>
      {editorImage ? <ImageEditorModal image={editorImage} onClose={() => setEditorImage(null)} /> : null}
    </main>
  );
}
