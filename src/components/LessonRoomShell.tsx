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
  messageId: string;
  name: string;
};

type EditorText = {
  color: string;
  fontSize: number;
  id: string;
  text: string;
  x: number;
  y: number;
};

type EditorSnapshot = {
  drawingData: string;
  texts: EditorText[];
};

function ImageEditorModal({
  image,
  onClose,
  onSave,
}: {
  image: ImageEditorState;
  onClose: () => void;
  onSave: (updatedImage: { data: string; mime: string; name: string; size: number }, messageId: string) => Promise<void>;
}) {
  const baseCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawingCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const historyRef = useRef<EditorSnapshot[]>([]);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);
  const panRef = useRef<{ left: number; top: number; x: number; y: number } | null>(null);
  const [mode, setMode] = useState<"pan" | "draw" | "erase" | "text">("pan");
  const [text, setText] = useState("Текст");
  const [color, setColor] = useState("#ef4444");
  const [brushSize, setBrushSize] = useState(8);
  const [textSize, setTextSize] = useState(32);
  const [zoom, setZoom] = useState(1);
  const [texts, setTexts] = useState<EditorText[]>([]);
  const [selectedTextId, setSelectedTextId] = useState<string | null>(null);
  const [saveError, setSaveError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [dragText, setDragText] = useState<{ id: string; offsetX: number; offsetY: number } | null>(null);
  const [canvasSize, setCanvasSize] = useState({ displayHeight: 1, displayWidth: 1, height: 1, width: 1 });
  const baseViewScale = canvasSize.displayWidth / canvasSize.width;
  const viewScale = baseViewScale * zoom;
  const textSizeSliderValue = textSize <= 14 ? ((textSize - 7) / 7) * 50 : 50 + ((textSize - 14) / 106) * 50;

  useEffect(() => {
    const baseCanvas = baseCanvasRef.current;
    const drawingCanvas = drawingCanvasRef.current;
    const baseContext = baseCanvas?.getContext("2d");
    const drawingContext = drawingCanvas?.getContext("2d");
    if (!baseCanvas || !drawingCanvas || !baseContext || !drawingContext) return;

    const source = new Image();
    source.onload = () => {
      const maxWidth = 1100;
      const maxHeight = 720;
      const displayScale = Math.min(maxWidth / source.width, maxHeight / source.height, 1);
      const width = Math.max(1, source.width);
      const height = Math.max(1, source.height);
      const displayWidth = Math.max(1, Math.round(source.width * displayScale));
      const displayHeight = Math.max(1, Math.round(source.height * displayScale));
      baseCanvas.width = width;
      baseCanvas.height = height;
      drawingCanvas.width = width;
      drawingCanvas.height = height;
      setCanvasSize({ displayHeight, displayWidth, height, width });
      baseContext.imageSmoothingEnabled = true;
      baseContext.imageSmoothingQuality = "high";
      baseContext.clearRect(0, 0, width, height);
      drawingContext.clearRect(0, 0, width, height);
      baseContext.drawImage(source, 0, 0, width, height);
      setTexts([]);
      setSelectedTextId(null);
      historyRef.current = [];
    };
    source.src = image.data;
  }, [image.data]);

  function pushHistory() {
    const canvas = drawingCanvasRef.current;
    if (!canvas) return;

    historyRef.current = [
      ...historyRef.current,
      {
        drawingData: canvas.toDataURL("image/png"),
        texts,
      },
    ].slice(-30);
  }

  function restoreDrawing(dataUrl: string) {
    const canvas = drawingCanvasRef.current;
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
    setSelectedTextId(null);
    restoreDrawing(last.drawingData);
  }

  function getCanvasPoint(event: PointerEvent<HTMLElement>) {
    const canvas = drawingCanvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * canvas.width,
      y: ((event.clientY - rect.top) / rect.height) * canvas.height,
    };
  }

  function start(event: PointerEvent<HTMLCanvasElement>) {
    const canvas = drawingCanvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;

    if (mode === "pan") {
      startPan(event);
      return;
    }

    const point = getCanvasPoint(event);
    if (mode === "text") {
      pushHistory();
      const id = crypto.randomUUID();
      setTexts((current) => [
        ...current,
        {
          color,
          fontSize: textSize / baseViewScale,
          id,
          text: text || "Текст",
          x: point.x,
          y: point.y,
        },
      ]);
      setSelectedTextId(id);
      return;
    }

    pushHistory();
    canvas.setPointerCapture(event.pointerId);
    const rect = canvas.getBoundingClientRect();
    const pixelScale = canvas.width / rect.width;
    context.globalCompositeOperation = mode === "erase" ? "destination-out" : "source-over";
    context.strokeStyle = color;
    context.lineWidth = (mode === "erase" ? brushSize * 3 : brushSize) * pixelScale;
    context.lineCap = "round";
    context.lineJoin = "round";
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = "high";
    context.fillStyle = color;
    context.beginPath();
    context.arc(point.x, point.y, context.lineWidth / 2, 0, Math.PI * 2);
    context.fill();
    context.beginPath();
    context.moveTo(point.x, point.y);
    lastPointRef.current = point;
    setIsDrawing(true);
  }

  function move(event: PointerEvent<HTMLCanvasElement>) {
    if (mode === "pan" && panRef.current) {
      movePan(event);
      return;
    }
    if (!isDrawing || (mode !== "draw" && mode !== "erase")) return;
    const context = drawingCanvasRef.current?.getContext("2d");
    if (!context) return;

    const point = getCanvasPoint(event);
    const previous = lastPointRef.current ?? point;
    const middle = { x: (previous.x + point.x) / 2, y: (previous.y + point.y) / 2 };
    context.quadraticCurveTo(previous.x, previous.y, middle.x, middle.y);
    context.stroke();
    lastPointRef.current = point;
  }

  function stop() {
    const context = drawingCanvasRef.current?.getContext("2d");
    if (context) context.globalCompositeOperation = "source-over";
    lastPointRef.current = null;
    panRef.current = null;
    setIsDrawing(false);
  }

  function startPan(event: PointerEvent<HTMLElement>) {
    const scroller = scrollRef.current;
    if (!scroller) return;

    event.currentTarget.setPointerCapture(event.pointerId);
    panRef.current = {
      left: scroller.scrollLeft,
      top: scroller.scrollTop,
      x: event.clientX,
      y: event.clientY,
    };
  }

  function movePan(event: PointerEvent<HTMLElement>) {
    const scroller = scrollRef.current;
    const startPoint = panRef.current;
    if (!scroller || !startPoint) return;

    scroller.scrollLeft = startPoint.left - (event.clientX - startPoint.x);
    scroller.scrollTop = startPoint.top - (event.clientY - startPoint.y);
  }

  function startTextDrag(event: PointerEvent<HTMLDivElement>, item: EditorText) {
    event.stopPropagation();
    pushHistory();
    const point = getCanvasPoint(event);
    setSelectedTextId(item.id);
    setTextSize(Math.round(item.fontSize * baseViewScale));
    setDragText({ id: item.id, offsetX: point.x - item.x, offsetY: point.y - item.y });
  }

  function editTextItem(item: EditorText) {
    setSelectedTextId(item.id);
    setText(item.text);
    setTextSize(Math.round(item.fontSize * baseViewScale));
    setMode("text");
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

  function changeSelectedTextSize(nextSize: number) {
    setTextSize(nextSize);
    if (!selectedTextId) return;
    setTexts((current) => current.map((item) => (item.id === selectedTextId ? { ...item, fontSize: nextSize / baseViewScale } : item)));
  }

  function changeTextSizeFromSlider(sliderValue: number) {
    const nextSize = sliderValue <= 50 ? 7 + (sliderValue / 50) * 7 : 14 + ((sliderValue - 50) / 50) * 106;
    changeSelectedTextSize(Math.round(nextSize));
  }

  function applySelectedTextValue(nextText: string) {
    setText(nextText);
    if (!selectedTextId || mode !== "text") return;
    setTexts((current) => current.map((item) => (item.id === selectedTextId ? { ...item, text: nextText || "Текст" } : item)));
  }

  function buildEditedImage() {
    const baseCanvas = baseCanvasRef.current;
    const drawingCanvas = drawingCanvasRef.current;
    if (!baseCanvas || !drawingCanvas) return null;

    const output = document.createElement("canvas");
    output.width = baseCanvas.width;
    output.height = baseCanvas.height;
    const context = output.getContext("2d");
    if (!context) return null;

    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = "high";
    context.drawImage(baseCanvas, 0, 0);
    context.drawImage(drawingCanvas, 0, 0);
    for (const item of texts) {
      context.fillStyle = item.color;
      context.font = `800 ${item.fontSize}px Arial`;
      context.fillText(item.text, item.x, item.y);
    }

    const data = output.toDataURL("image/png");
    const base64 = data.split(",")[1] ?? "";
    return {
      data,
      mime: "image/png",
      name: `edited-${image.name.replace(/\.[^.]+$/, "") || "image"}.png`,
      size: Math.ceil((base64.length * 3) / 4),
    };
  }

  function downloadEdited() {
    const editedImage = buildEditedImage();
    if (!editedImage) return;

    const link = document.createElement("a");
    link.href = editedImage.data;
    link.download = editedImage.name;
    link.click();
  }

  async function saveEdited() {
    const editedImage = buildEditedImage();
    if (!editedImage) return;

    setIsSaving(true);
    setSaveError("");
    try {
      await onSave(editedImage, image.messageId);
      onClose();
    } catch {
      setSaveError("Не удалось сохранить изображение.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="image-editor-backdrop" role="dialog" aria-modal="true" aria-label="Редактор изображения">
      <div className="image-editor-panel">
        <div className="image-editor-toolbar">
          <strong>{image.name}</strong>
          <div>
            <button className={mode === "pan" ? "active" : ""} onClick={() => setMode("pan")} type="button">Переместить</button>
            <button className={mode === "draw" ? "active" : ""} onClick={() => setMode("draw")} type="button">Рисовать</button>
            <button className={mode === "erase" ? "active" : ""} onClick={() => setMode("erase")} type="button">Ластик</button>
            <button className={mode === "text" ? "active" : ""} onClick={() => setMode("text")} type="button">Текст</button>
            <input aria-label="Цвет" type="color" value={color} onChange={(event) => setColor(event.target.value)} />
            <input aria-label="Текст" value={text} onChange={(event) => applySelectedTextValue(event.target.value)} onClick={(event) => event.currentTarget.select()} onFocus={(event) => event.currentTarget.select()} />
            <label>
              Карандаш
              <input aria-label="Толщина карандаша" max="32" min="3" onChange={(event) => setBrushSize(Number(event.target.value))} type="range" value={brushSize} />
            </label>
            <label>
              Размер текста
              <input aria-label="Размер текста" max="100" min="0" onChange={(event) => changeTextSizeFromSlider(Number(event.target.value))} type="range" value={textSizeSliderValue} />
            </label>
            <button onClick={() => setZoom((value) => Math.max(0.5, Number((value - 0.25).toFixed(2))))} type="button">-</button>
            <span>{Math.round(zoom * 100)}%</span>
            <button onClick={() => setZoom((value) => Math.min(3, Number((value + 0.25).toFixed(2))))} type="button">+</button>
            <button onClick={undo} type="button">Отменить</button>
            <button onClick={downloadEdited} type="button">Скачать</button>
            <button disabled={isSaving} onClick={saveEdited} type="button">{isSaving ? "Сохраняю..." : "Сохранить"}</button>
            <button onClick={onClose} type="button">Закрыть</button>
          </div>
        </div>
        {saveError ? <div className="lesson-room-chat-note">{saveError}</div> : null}
        <div className="image-editor-canvas-scroll" ref={scrollRef}>
          <div
            className={`image-editor-canvas-wrap ${mode === "pan" ? "pan-mode" : ""}`}
            onPointerCancel={() => setDragText(null)}
            onPointerMove={(event) => {
              movePan(event);
              moveText(event);
            }}
            onPointerUp={() => {
              panRef.current = null;
              setDragText(null);
            }}
            style={{ height: canvasSize.displayHeight * zoom, width: canvasSize.displayWidth * zoom }}
          >
            <canvas
              aria-hidden="true"
              className="image-editor-canvas image-editor-base-canvas"
              ref={baseCanvasRef}
              style={{ height: canvasSize.displayHeight * zoom, width: canvasSize.displayWidth * zoom }}
            />
            <canvas
              className="image-editor-canvas image-editor-drawing-canvas"
              onPointerCancel={stop}
              onPointerDown={start}
              onPointerMove={move}
              onPointerUp={stop}
              ref={drawingCanvasRef}
              style={{ height: canvasSize.displayHeight * zoom, width: canvasSize.displayWidth * zoom }}
            />
            {texts.map((item) => (
              <div
                className={`image-editor-text-layer ${item.id === selectedTextId ? "selected" : ""}`}
                key={item.id}
                onDoubleClick={() => editTextItem(item)}
                onPointerDown={(event) => startTextDrag(event, item)}
                style={{
                  color: item.color,
                  fontSize: item.fontSize * viewScale,
                  left: item.x * viewScale,
                  top: item.y * viewScale - item.fontSize * viewScale,
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

  async function saveEditedImage(updatedImage: { data: string; mime: string; name: string; size: number }, messageId: string) {
    if (!lessonId) throw new Error("Missing lesson");

    const response = await fetch(`/api/lessons/${lessonId}/chat`, {
      body: JSON.stringify({
        attachmentData: updatedImage.data,
        attachmentMime: updatedImage.mime,
        attachmentName: updatedImage.name,
        attachmentSize: updatedImage.size,
        messageId,
      }),
      headers: { "Content-Type": "application/json" },
      method: "PATCH",
    });

    if (!response.ok) {
      throw new Error("Image save failed");
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
                          onClick={() => setEditorImage({ data: message.attachmentData ?? "", messageId: message.id, name: message.attachmentName ?? "image" })}
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
      {editorImage ? <ImageEditorModal image={editorImage} onClose={() => setEditorImage(null)} onSave={saveEditedImage} /> : null}
    </main>
  );
}
