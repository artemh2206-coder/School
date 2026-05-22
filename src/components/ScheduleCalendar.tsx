"use client";

import { useEffect, useMemo, useState } from "react";
import { defaultTeacherId } from "@/lib/school-ids";
import type { LessonWithTiming } from "@/lib/schedule-store";

const weekLabels = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
const dayHours = Array.from({ length: 19 }, (_, index) => index + 5);
const nightHours = Array.from({ length: 5 }, (_, index) => index);
const hours = dayHours;
const monthNames = [
  "Январь",
  "Февраль",
  "Март",
  "Апрель",
  "Май",
  "Июнь",
  "Июль",
  "Август",
  "Сентябрь",
  "Октябрь",
  "Ноябрь",
  "Декабрь",
];

function formatHour(hour: number) {
  return `${String(hour % 24).padStart(2, "0")}:00`;
}

function formatLessonTime(start: number, end: number) {
  return `${formatHour(start)}-${formatHour(end)}`;
}

type WeekInfo = {
  end: number;
  label: string;
  start: number;
  week: number;
};

function getWeeksInMonth(month: number): WeekInfo[] {
  const first = new Date(2026, month, 1);
  const daysInMonth = new Date(2026, month + 1, 0).getDate();
  const mondayOffset = (first.getDay() + 6) % 7;
  const weeks: WeekInfo[] = [];
  let start = 1 - mondayOffset;

  while (start <= daysInMonth) {
    const visibleStart = Math.max(start, 1);
    const visibleEnd = Math.min(start + 6, daysInMonth);

    weeks.push({
      end: visibleEnd,
      label: `${visibleStart}-${visibleEnd}`,
      start: visibleStart,
      week: weeks.length,
    });

    start += 7;
  }

  return weeks;
}

function getWeekDays(month: number, week: number) {
  const weeks = getWeeksInMonth(month);
  const selected = weeks[week] ?? weeks[0];
  const first = new Date(2026, month, 1);
  const mondayOffset = (first.getDay() + 6) % 7;
  const realStart = 1 - mondayOffset + selected.week * 7;
  const daysInMonth = new Date(2026, month + 1, 0).getDate();

  return Array.from({ length: 7 }, (_, index) => {
    const date = realStart + index;
    return {
      date,
      inMonth: date >= 1 && date <= daysInMonth,
      index,
      label: weekLabels[index],
    };
  });
}

async function fetchLessons() {
  const response = await fetch("/api/schedule", { cache: "no-store" });
  const data = (await response.json()) as { lessons: LessonWithTiming[] };
  return data.lessons;
}

async function fetchStudents() {
  const response = await fetch("/api/students", { cache: "no-store" });
  const data = (await response.json()) as { students: { fullName: string; id: string }[] };
  return data.students;
}

export function useLessons() {
  const [lessons, setLessons] = useState<LessonWithTiming[]>([]);

  useEffect(() => {
    let active = true;

    async function sync() {
      try {
        const next = await fetchLessons();
        if (active) setLessons(next);
      } catch {
        if (active) setLessons((current) => current);
      }
    }

    sync();
    const timer = window.setInterval(sync, 1500);

    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, []);

  return { lessons, setLessons };
}

export function UpcomingLessons({ studentIds, teacherIds }: { studentIds?: string[]; teacherIds?: string[] }) {
  const { lessons } = useLessons();
  const upcoming = useMemo(
    () =>
      [...lessons]
        .filter((lesson) => lesson.isFuture)
        .filter((lesson) => !teacherIds?.length || teacherIds.includes(lesson.teacherId))
        .filter((lesson) => !studentIds?.length || studentIds.includes(lesson.studentId))
        .sort((a, b) => new Date(a.startsAtIso).getTime() - new Date(b.startsAtIso).getTime())
        .slice(0, 5),
    [lessons, studentIds, teacherIds],
  );

  return (
    <div className="list">
      {upcoming.map((lesson) => (
        <div className="list-item lesson-card" key={lesson.id}>
          <strong>{lesson.student} · {lesson.studentId}</strong>
          <span>
            {monthNames[lesson.month]} · неделя {lesson.week + 1} · {weekLabels[lesson.day]} ·{" "}
            {lesson.start}:00-{lesson.end}:00
          </span>
        </div>
      ))}
    </div>
  );
}

export function ScheduleCalendar({ editable = false, teacherId = defaultTeacherId }: { editable?: boolean; teacherId?: string }) {
  const { lessons, setLessons } = useLessons();
  const [students, setStudents] = useState<{ fullName: string; id: string }[]>([]);
  const [isMonth, setIsMonth] = useState(false);
  const [isNightOpen, setIsNightOpen] = useState(false);
  const [month, setMonth] = useState(4);
  const [week, setWeek] = useState(0);
  const [draft, setDraft] = useState<{ day: number; start: number } | null>(null);
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const weeks = getWeeksInMonth(month);
  const weekDays = getWeekDays(month, week);
  const calendarLessons = useMemo(
    () => lessons.filter((lesson) => lesson.teacherId === teacherId),
    [lessons, teacherId],
  );

  useEffect(() => {
    let active = true;

    async function syncStudents() {
      try {
        const next = await fetchStudents();
        if (!active) return;
        setStudents(next);
        setSelectedStudentId((current) => current || next[0]?.id || "");
      } catch {
        if (active) setStudents((current) => current);
      }
    }

    syncStudents();

    return () => {
      active = false;
    };
  }, []);

  async function add() {
    if (!draft || !selectedStudentId) return;

    const response = await fetch("/api/schedule", {
      body: JSON.stringify({
        day: draft.day,
        month,
        start: draft.start,
        studentId: selectedStudentId,
        teacherId,
        week,
      }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });
    const data = (await response.json()) as { lessons: LessonWithTiming[] };
    setLessons(data.lessons);
    setDraft(null);
  }

  async function remove(id: string) {
    const response = await fetch("/api/schedule", {
      body: JSON.stringify({ id }),
      headers: { "Content-Type": "application/json" },
      method: "DELETE",
    });
    const data = (await response.json()) as { lessons: LessonWithTiming[] };
    setLessons(data.lessons);
  }

  function renderHourRows(items: number[]) {
    return items.map((hour) => (
      <div className="calendar-row" key={hour}>
        <div className="calendar-hour">{formatHour(hour)}</div>
        {weekDays.map((day) => {
          const lesson = calendarLessons.find(
            (item) =>
              item.month === month &&
              item.week === week &&
              item.day === day.index &&
              item.start === hour,
          );

          return (
            <div
              className={`calendar-cell ${lesson ? "busy" : ""} ${day.inMonth ? "" : "muted-cell"}`}
              key={`${day.index}-${hour}`}
            >
              {lesson ? (
                <div className={`calendar-lesson ${lesson.isPast ? "past" : ""}`}>
                  <strong>{lesson.student} · {lesson.studentId}</strong>
                  <span>{formatLessonTime(lesson.start, lesson.end)}</span>
                  {editable ? (
                    <button aria-label="Отменить занятие" onClick={() => remove(lesson.id)} type="button">
                      -
                    </button>
                  ) : null}
                </div>
              ) : editable && day.inMonth ? (
                <button className="add-lesson" onClick={() => setDraft({ day: day.index, start: hour })} type="button">
                  +
                </button>
              ) : null}
            </div>
          );
        })}
      </div>
    ));
  }

  if (isMonth) {
    return (
      <div className="calendar-shell">
        <div className="calendar-toolbar">
          <strong>2026 год</strong>
          <button onClick={() => setIsMonth(false)} type="button">Вернуться к неделе</button>
        </div>
        <div className="year-months">
          {monthNames.map((name, index) => (
            <button
              className={`year-month ${index === month ? "active" : ""}`}
              key={name}
              onClick={() => {
                setMonth(index);
                setWeek(0);
              }}
              type="button"
            >
              {name}
            </button>
          ))}
        </div>
        <div className="month-grid">
          {weeks.map((item) => (
            <button
              className={`month-week ${item.week === week ? "active" : ""}`}
              key={item.week}
              onClick={() => {
                setWeek(item.week);
                setIsMonth(false);
              }}
              type="button"
            >
              <strong>{item.label} {monthNames[month].toLowerCase()}</strong>
              <span>
                {
                  calendarLessons.filter((lesson) => lesson.month === month && lesson.week === item.week)
                    .length
                } занятий
              </span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="calendar-shell">
      <div className="calendar-toolbar">
        <strong>
          {weeks[week]?.label} {monthNames[month].toLowerCase()} 2026
        </strong>
        <button onClick={() => setIsMonth(true)} type="button">Свернуть неделю</button>
      </div>
      <div className="night-hours-panel">
        <button onClick={() => setIsNightOpen((value) => !value)} type="button">
          {isNightOpen ? "Свернуть 00:00-05:00" : "Развернуть 00:00-05:00"}
        </button>
        <span>Ночные слоты скрыты, чтобы основное расписание было компактным.</span>
      </div>
      {isNightOpen ? (
        <div className="week-calendar night-calendar">
          <div className="calendar-corner" />
          {weekDays.map((day) => (
            <div className={`calendar-day ${day.inMonth ? "" : "muted-day"}`} key={day.index}>
              <strong>{day.label}</strong>
              <span>{day.inMonth ? `${day.date} ${monthNames[month].toLowerCase()}` : ""}</span>
            </div>
          ))}
          {renderHourRows(nightHours)}
        </div>
      ) : null}
      <div className="week-calendar">
        <div className="calendar-corner" />
        {weekDays.map((day) => (
          <div className={`calendar-day ${day.inMonth ? "" : "muted-day"}`} key={day.index}>
            <strong>{day.label}</strong>
            <span>{day.inMonth ? `${day.date} ${monthNames[month].toLowerCase()}` : ""}</span>
          </div>
        ))}
        {hours.map((hour) => (
          <div className="calendar-row" key={hour}>
            <div className="calendar-hour">{formatHour(hour)}</div>
            {weekDays.map((day) => {
              const lesson = calendarLessons.find(
                (item) =>
                  item.month === month &&
                  item.week === week &&
                  item.day === day.index &&
                  item.start === hour,
              );

              return (
                <div
                  className={`calendar-cell ${lesson ? "busy" : ""} ${day.inMonth ? "" : "muted-cell"}`}
                  key={`${day.index}-${hour}`}
                >
                  {lesson ? (
                    <div className={`calendar-lesson ${lesson.isPast ? "past" : ""}`}>
                      <strong>{lesson.student} · {lesson.studentId}</strong>
                      <span>{formatLessonTime(lesson.start, lesson.end)}</span>
                      {editable ? (
                        <button aria-label="Отменить занятие" onClick={() => remove(lesson.id)} type="button">
                          -
                        </button>
                      ) : null}
                    </div>
                  ) : editable && day.inMonth ? (
                    <button className="add-lesson" onClick={() => setDraft({ day: day.index, start: hour })} type="button">
                      +
                    </button>
                  ) : null}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {draft ? (
        <div className="lesson-popover">
          <strong>
            Добавить урок: {weekLabels[draft.day]} {formatLessonTime(draft.start, draft.start + 1)}
          </strong>
          {students.length ? (
            <select onChange={(event) => setSelectedStudentId(event.target.value)} value={selectedStudentId}>
              {students.map((student) => (
                <option key={student.id} value={student.id}>{student.id} · {student.fullName}</option>
              ))}
            </select>
          ) : (
            <span>Сначала зарегистрируйте ученика.</span>
          )}
          <div>
            <button disabled={!selectedStudentId} onClick={add} type="button">Добавить</button>
            <button onClick={() => setDraft(null)} type="button">Отмена</button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function TeacherBalanceHeader() {
  const [commission, setCommission] = useState(25);
  const gross = 986;
  const net = Math.round(gross * (1 - commission / 100));

  useEffect(() => {
    const sync = async () => {
      const raw = window.localStorage.getItem("school-os-commission");
      setCommission(raw ? Number(raw) : 25);
    };
    sync();
    window.addEventListener("storage", sync);
    window.addEventListener("school-os-commission", sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("school-os-commission", sync);
    };
  }, []);

  return (
    <div className="teacher-cover-balance">
      <span>Баланс к выводу</span>
      <strong>{net} USD</strong>
    </div>
  );
}

export function CommissionSettings() {
  const [commission, setCommission] = useState(() => {
    if (typeof window === "undefined") return 25;
    const raw = window.localStorage.getItem("school-os-commission");
    return raw ? Number(raw) : 25;
  });

  function update(value: number) {
    setCommission(value);
    window.localStorage.setItem("school-os-commission", String(value));
    window.dispatchEvent(new Event("school-os-commission"));
  }

  return (
    <div className="commission-settings">
      <label>
        Комиссия платформы, %
        <input
          max={60}
          min={0}
          onChange={(event) => update(Number(event.target.value))}
          type="number"
          value={commission}
        />
      </label>
      <span>Используется при расчете суммы вывода учителя.</span>
    </div>
  );
}
