import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/server/db";

type RouteContext = {
  params: Promise<{
    lessonId: string;
  }>;
};

const attachSchema = z.object({
  teacherId: z.string().regex(/^T\d{5}$/),
});

const submitSchema = z.object({
  studentId: z.string().regex(/^S\d{5}$/),
});

export async function POST(request: Request, context: RouteContext) {
  const { lessonId } = await context.params;
  const payload = attachSchema.parse(await request.json());
  const lesson = await db.lesson.findFirst({
    select: {
      id: true,
      studentId: true,
      teacherId: true,
      topic: true,
    },
    where: {
      id: lessonId,
      teacherId: payload.teacherId,
    },
  });

  if (!lesson) {
    return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
  }

  const existing = await db.homework.findFirst({
    where: {
      lessonId: lesson.id,
    },
  });
  const homework = existing
    ? await db.homework.update({
        data: {
          description: "Здесь будет прикрепляться ДЗ.",
          status: "ASSIGNED",
          title: `Домашнее задание: ${lesson.topic}`,
        },
        where: {
          id: existing.id,
        },
      })
    : await db.homework.create({
        data: {
          description: "Здесь будет прикрепляться ДЗ.",
          lessonId: lesson.id,
          studentId: lesson.studentId,
          title: `Домашнее задание: ${lesson.topic}`,
        },
      });

  return NextResponse.json({ homework });
}

export async function PATCH(request: Request, context: RouteContext) {
  const { lessonId } = await context.params;
  const payload = submitSchema.parse(await request.json());
  const homework = await db.homework.findFirst({
    select: {
      id: true,
    },
    where: {
      lessonId,
      studentId: payload.studentId,
    },
  });

  if (!homework) {
    return NextResponse.json({ error: "Homework not found" }, { status: 404 });
  }

  const updated = await db.homework.update({
    data: {
      status: "SUBMITTED",
      submissionUrl: "student-confirmed",
    },
    where: {
      id: homework.id,
    },
  });

  return NextResponse.json({ homework: updated });
}
