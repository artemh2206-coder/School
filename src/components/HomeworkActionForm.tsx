"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function TeacherHomeworkControl({
  isAttached,
  isSubmitted,
  lessonId,
  teacherId,
}: {
  isAttached: boolean;
  isSubmitted: boolean;
  lessonId: string;
  teacherId: string;
}) {
  const router = useRouter();
  const [error, setError] = useState("");

  async function attach() {
    setError("");
    const response = await fetch(`/api/lessons/${lessonId}/homework`, {
      body: JSON.stringify({ teacherId }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });
    if (!response.ok) {
      setError("Не удалось сменить статус ДЗ.");
      return;
    }
    router.refresh();
  }

  return (
    <div className="homework-toolbar">
      <label>
        <input checked={isAttached} onChange={attach} type="checkbox" />
        ДЗ прикреплено
      </label>
      <span>{isSubmitted ? "Ученик отметил ДЗ выполненным" : "ДЗ еще не выполнено учеником"}</span>
      {error ? <strong>{error}</strong> : null}
    </div>
  );
}

export function StudentHomeworkControl({
  isAttached,
  isSubmitted,
  lessonId,
  studentId,
}: {
  isAttached: boolean;
  isSubmitted: boolean;
  lessonId: string;
  studentId: string;
}) {
  const router = useRouter();
  const [error, setError] = useState("");

  async function submit() {
    setError("");
    const response = await fetch(`/api/lessons/${lessonId}/homework`, {
      body: JSON.stringify({ studentId }),
      headers: { "Content-Type": "application/json" },
      method: "PATCH",
    });
    if (!response.ok) {
      setError("Не удалось отметить ДЗ выполненным.");
      return;
    }
    router.refresh();
  }

  return (
    <div className="homework-toolbar">
      <span>{isAttached ? "ДЗ прикреплено" : "ДЗ ожидает прикрепления учителем"}</span>
      {isAttached ? (
        <button className="button primary" disabled={isSubmitted} onClick={submit} type="button">
          {isSubmitted ? "Выполнено" : "Отметить выполнено"}
        </button>
      ) : null}
      {error ? <strong>{error}</strong> : null}
    </div>
  );
}
