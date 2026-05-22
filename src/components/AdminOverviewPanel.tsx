"use client";

import { useEffect, useState } from "react";
import { Metric } from "@/components/DashboardShell";

type Overview = {
  scheduledLessons: number;
  students: number;
  teachers: number;
};

export function AdminOverviewPanel({ initial }: { initial: Overview }) {
  const [overview, setOverview] = useState(initial);

  useEffect(() => {
    let active = true;

    async function sync() {
      try {
        const response = await fetch("/api/admin/overview", { cache: "no-store" });
        if (!response.ok) return;
        const next = (await response.json()) as Overview;
        if (active) setOverview(next);
      } catch {
        if (active) setOverview((current) => current);
      }
    }

    sync();
    const timer = window.setInterval(sync, 1500);

    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, []);

  return (
    <div className="metric-grid">
      <Metric label="Ученики" value={String(overview.students)} />
      <Metric label="Учителя" value={String(overview.teachers)} />
      <Metric label="Уроки в расписании" value={String(overview.scheduledLessons)} />
    </div>
  );
}
