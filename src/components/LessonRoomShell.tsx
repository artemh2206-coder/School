"use client";

import Link from "next/link";
import { Maximize2, Minimize2 } from "lucide-react";
import { useEffect, useState } from "react";

type LessonRoomShellProps = {
  backHref: string;
};

export function LessonRoomShell({ backHref }: LessonRoomShellProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);

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

  return (
    <main className="lesson-room-shell">
      <div className="lesson-room-toolbar">
        <Link href={backHref}>В кабинет</Link>
        <button onClick={toggleFullscreen} type="button">
          {isFullscreen ? <Minimize2 aria-hidden="true" size={18} /> : <Maximize2 aria-hidden="true" size={18} />}
          <span>{isFullscreen ? "Свернуть" : "На весь экран"}</span>
        </button>
      </div>
      <section className="lesson-room-empty" aria-label="Рабочая область урока" />
    </main>
  );
}
