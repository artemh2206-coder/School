import type { LessonStatus } from "@prisma/client";
import { db } from "@/server/db";

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

type DbLesson = {
  id: string;
  teacherId: string;
  studentId: string;
  startsAt: Date;
  endsAt: Date;
  topic: string;
  status: LessonStatus;
  student: {
    fullName: string;
  };
};

function createLessonId() {
  let id = "U";

  for (let index = 0; index < 10; index += 1) {
    id += Math.floor(Math.random() * 10);
  }

  return id;
}

async function createUniqueLessonId() {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const id = createLessonId();
    const existing = await db.lesson.findUnique({
      select: {
        id: true,
      },
      where: {
        id,
      },
    });

    if (!existing) return id;
  }

  throw new Error("Could not allocate lesson id");
}

export function getLessonStartDate(lesson: Pick<Lesson, "day" | "month" | "start" | "week">) {
  const firstDayOfMonth = new Date(Date.UTC(2026, lesson.month, 1));
  const mondayOffset = (firstDayOfMonth.getUTCDay() + 6) % 7;
  const date = 1 - mondayOffset + lesson.week * 7 + lesson.day;

  return new Date(Date.UTC(2026, lesson.month, date, lesson.start, 0, 0, 0));
}

function getScheduleParts(startsAt: Date) {
  const month = startsAt.getUTCMonth();
  const firstDayOfMonth = new Date(Date.UTC(startsAt.getUTCFullYear(), month, 1));
  const mondayOffset = (firstDayOfMonth.getUTCDay() + 6) % 7;
  const realStart = 1 - mondayOffset;
  const dayIndex = (startsAt.getUTCDay() + 6) % 7;
  const week = Math.floor((startsAt.getUTCDate() - realStart) / 7);

  return {
    day: dayIndex,
    month,
    start: startsAt.getUTCHours(),
    week,
  };
}

function toScheduleLesson(lesson: DbLesson, now = new Date()): LessonWithTiming {
  const parts = getScheduleParts(lesson.startsAt);

  return {
    ...parts,
    end: lesson.endsAt.getUTCHours(),
    id: lesson.id,
    isFuture: lesson.startsAt >= now,
    isPast: lesson.startsAt < now,
    startsAtIso: lesson.startsAt.toISOString(),
    student: lesson.student.fullName,
    studentId: lesson.studentId,
    teacherId: lesson.teacherId,
    topic: lesson.topic,
  };
}

export async function getLessonsWithTiming(now = new Date()) {
  const lessons = await db.lesson.findMany({
    include: {
      student: {
        select: {
          fullName: true,
        },
      },
    },
    orderBy: {
      startsAt: "asc",
    },
    where: {
      status: {
        not: "CANCELLED",
      },
    },
  });

  return lessons.map((lesson) => toScheduleLesson(lesson, now));
}

export async function addLesson(input: Omit<Lesson, "id" | "end" | "student">) {
  const startsAt = getLessonStartDate(input);
  const endsAt = new Date(startsAt);
  endsAt.setUTCHours(startsAt.getUTCHours() + 1);

  const existing = await db.lesson.findFirst({
    where: {
      startsAt,
      status: {
        not: "CANCELLED",
      },
      teacherId: input.teacherId,
    },
  });

  if (existing) {
    await db.lesson.update({
      data: {
        studentId: input.studentId,
        topic: input.topic ?? existing.topic,
      },
      where: {
        id: existing.id,
      },
    });

    return existing;
  }

  return db.lesson.create({
    data: {
      endsAt,
      id: await createUniqueLessonId(),
      startsAt,
      studentId: input.studentId,
      teacherId: input.teacherId,
      topic: input.topic ?? "Travel speaking + modal verbs",
    },
  });
}

export async function deleteLesson(id: string) {
  await db.lesson.update({
    data: {
      status: "CANCELLED",
    },
    where: {
      id,
    },
  });
}

export async function updateLessonTopic(id: string, topic: string) {
  await db.lesson.update({
    data: {
      topic,
    },
    where: {
      id,
    },
  });
}
