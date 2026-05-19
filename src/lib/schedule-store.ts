import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { defaultTeacherId, studentRoster } from "@/lib/school-ids";

export type Lesson = {
  id: string;
  teacherId: string;
  studentId: string;
  month: number;
  week: number;
  day: number;
  start: number;
  end: number;
  student: string;
  topic?: string;
};

export type LessonWithTiming = Lesson & {
  isFuture: boolean;
  isPast: boolean;
  startsAtIso: string;
};

const defaultLessons: Lesson[] = [
  { id: "lesson-1", teacherId: defaultTeacherId, studentId: "S00001", month: 4, week: 0, day: 0, start: 18, end: 19, student: studentRoster[0].name, topic: "Travel speaking + modal verbs" },
  { id: "lesson-2", teacherId: defaultTeacherId, studentId: "S00002", month: 4, week: 0, day: 2, start: 17, end: 18, student: studentRoster[1].name, topic: "Listening practice + daily routines" },
  { id: "lesson-3", teacherId: defaultTeacherId, studentId: "S00003", month: 4, week: 1, day: 4, start: 16, end: 17, student: studentRoster[2].name, topic: "Grammar review + speaking" },
  { id: "lesson-4", teacherId: defaultTeacherId, studentId: "S00004", month: 4, week: 2, day: 5, start: 11, end: 12, student: studentRoster[3].name, topic: "Vocabulary builder" },
  { id: "lesson-5", teacherId: defaultTeacherId, studentId: "S00001", month: 4, week: 3, day: 6, start: 10, end: 11, student: studentRoster[0].name, topic: "Travel speaking + modal verbs" },
];

const globalScheduleStore = globalThis as typeof globalThis & {
  __schoolOsLessons?: Lesson[];
};

const dataDir = path.join(process.cwd(), ".data");
const dataPath = path.join(dataDir, "schedule.json");

export function getLessonStartDate(lesson: Pick<Lesson, "day" | "month" | "start" | "week">) {
  const firstDayOfMonth = new Date(2026, lesson.month, 1);
  const mondayOffset = (firstDayOfMonth.getDay() + 6) % 7;
  const date = 1 - mondayOffset + lesson.week * 7 + lesson.day;

  return new Date(2026, lesson.month, date, lesson.start, 0, 0, 0);
}

export function enrichLessonTiming(lesson: Lesson, now = new Date()): LessonWithTiming {
  const startsAt = getLessonStartDate(lesson);

  return {
    ...lesson,
    isFuture: startsAt >= now,
    isPast: startsAt < now,
    startsAtIso: startsAt.toISOString(),
  };
}

export function getLessonsWithTiming(now = new Date()) {
  return getLessons().map((lesson) => enrichLessonTiming(lesson, now));
}

function getStudentById(studentId: string) {
  return studentRoster.find((student) => student.id === studentId) ?? studentRoster[0];
}

function inferStudentId(studentName: string) {
  const normalized = studentName.toLowerCase();

  if (normalized.includes("ирина") || normalized.includes("коваль") || normalized.includes("†") || normalized.includes("š")) {
    return "S00002";
  }

  if (normalized.includes("давид") || normalized.includes("леви") || normalized.includes("”") || normalized.includes("›")) {
    return "S00003";
  }

  if (normalized.includes("софия") || normalized.includes("грин") || normalized.includes("ˇ")) {
    return "S00004";
  }

  return "S00001";
}

function normalizeLesson(lesson: Partial<Lesson> & Pick<Lesson, "day" | "id" | "month" | "start" | "student" | "week">): Lesson {
  const studentId = lesson.studentId ?? inferStudentId(lesson.student);
  const student = getStudentById(studentId);

  return {
    ...lesson,
    end: lesson.end ?? lesson.start + 1,
    student: student.name,
    studentId,
    teacherId: lesson.teacherId ?? defaultTeacherId,
    topic: lesson.topic ?? "Travel speaking + modal verbs",
  };
}

function readPersistedLessons() {
  if (!existsSync(dataPath)) {
    return [...defaultLessons];
  }

  try {
    return (JSON.parse(readFileSync(dataPath, "utf8")) as Lesson[]).map(normalizeLesson);
  } catch {
    return [...defaultLessons];
  }
}

function persistLessons(lessons: Lesson[]) {
  if (!existsSync(dataDir)) {
    mkdirSync(dataDir, { recursive: true });
  }

  writeFileSync(dataPath, JSON.stringify(lessons, null, 2));
}

export function getLessons() {
  globalScheduleStore.__schoolOsLessons ??= readPersistedLessons();
  return globalScheduleStore.__schoolOsLessons;
}

export function addLesson(input: Omit<Lesson, "id" | "end" | "student">) {
  const lessons = getLessons();
  const student = getStudentById(input.studentId);
  const lesson: Lesson = {
    ...input,
    id: `${Date.now()}-${input.month}-${input.week}-${input.day}-${input.start}`,
    end: input.start + 1,
    student: student.name,
  };

  globalScheduleStore.__schoolOsLessons = [
    ...lessons.filter(
      (item) =>
        !(
          item.teacherId === lesson.teacherId &&
          item.month === lesson.month &&
          item.week === lesson.week &&
          item.day === lesson.day &&
          item.start === lesson.start
        ),
    ),
    lesson,
  ];
  persistLessons(globalScheduleStore.__schoolOsLessons);

  return lesson;
}

export function deleteLesson(id: string) {
  globalScheduleStore.__schoolOsLessons = getLessons().filter((lesson) => lesson.id !== id);
  persistLessons(globalScheduleStore.__schoolOsLessons);
}

export function updateLessonTopic(id: string, topic: string) {
  globalScheduleStore.__schoolOsLessons = getLessons().map((lesson) =>
    lesson.id === id ? { ...lesson, topic } : lesson,
  );
  persistLessons(globalScheduleStore.__schoolOsLessons);
}
