import { NextResponse } from "next/server";
import { z } from "zod";
import { addLesson, deleteLesson, getLessonsWithTiming, updateLessonTopic } from "@/lib/schedule-store";

const createLessonSchema = z.object({
  day: z.number().int().min(0).max(6),
  month: z.number().int().min(0).max(11),
  start: z.number().int().min(0).max(23),
  studentId: z.string().regex(/^S\d{5}$/),
  teacherId: z.string().regex(/^T\d{5}$/),
  week: z.number().int().min(0).max(5),
});

const updateLessonSchema = z.object({
  id: z.string().min(1),
  topic: z.string().trim().min(1).max(120),
});

export async function GET() {
  const now = new Date();
  return NextResponse.json({ currentDate: now.toISOString(), lessons: await getLessonsWithTiming(now) });
}

export async function POST(request: Request) {
  const now = new Date();
  const payload = createLessonSchema.parse(await request.json());
  const lesson = addLesson(payload);
  return NextResponse.json({ currentDate: now.toISOString(), lesson: await lesson, lessons: await getLessonsWithTiming(now) });
}

export async function DELETE(request: Request) {
  const now = new Date();
  const { id } = z.object({ id: z.string().min(1) }).parse(await request.json());
  await deleteLesson(id);
  return NextResponse.json({ currentDate: now.toISOString(), lessons: await getLessonsWithTiming(now) });
}

export async function PATCH(request: Request) {
  const now = new Date();
  const { id, topic } = updateLessonSchema.parse(await request.json());
  await updateLessonTopic(id, topic);
  return NextResponse.json({ currentDate: now.toISOString(), lessons: await getLessonsWithTiming(now) });
}
