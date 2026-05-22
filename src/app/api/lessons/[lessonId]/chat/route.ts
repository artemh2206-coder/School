import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/server/db";

const messageSchema = z.object({
  body: z.string().trim().min(1).max(2000),
  senderId: z.string().min(1),
  senderName: z.string().trim().min(1).max(120),
  senderRole: z.enum(["STUDENT", "TEACHER", "ADMIN"]),
});

const deleteMessagesSchema = z.object({
  messageIds: z.array(z.string().min(1)).min(1).max(50),
});

type RouteContext = {
  params: Promise<{
    lessonId: string;
  }>;
};

async function getLessonThread(lessonId: string) {
  const lesson = await db.lesson.findUnique({
    select: {
      id: true,
      studentId: true,
      teacherId: true,
      topic: true,
    },
    where: {
      id: lessonId,
    },
  });

  if (!lesson) {
    return null;
  }

  const thread = await db.chatThread.upsert({
    create: {
      lessonId: lesson.id,
      members: {
        create: [
          {
            studentId: lesson.studentId,
          },
          {
            teacherId: lesson.teacherId,
          },
        ],
      },
      title: `Lesson chat: ${lesson.topic}`,
    },
    update: {},
    where: {
      lessonId: lesson.id,
    },
  });

  return { lesson, thread };
}

async function getMessages(threadId: string) {
  return db.chatMessage.findMany({
    orderBy: {
      createdAt: "asc",
    },
    select: {
      body: true,
      createdAt: true,
      id: true,
      senderId: true,
      senderName: true,
      senderRole: true,
    },
    where: {
      threadId,
    },
  });
}

export async function GET(_request: Request, context: RouteContext) {
  const { lessonId } = await context.params;
  const result = await getLessonThread(lessonId);

  if (!result) {
    return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
  }

  return NextResponse.json({
    lessonId: result.lesson.id,
    messages: await getMessages(result.thread.id),
    threadId: result.thread.id,
  });
}

export async function POST(request: Request, context: RouteContext) {
  const { lessonId } = await context.params;
  const payload = messageSchema.parse(await request.json());
  const result = await getLessonThread(lessonId);

  if (!result) {
    return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
  }

  await db.chatMessage.create({
    data: {
      body: payload.body,
      senderId: payload.senderId,
      senderName: payload.senderName,
      senderRole: payload.senderRole,
      threadId: result.thread.id,
    },
  });

  return NextResponse.json({
    lessonId: result.lesson.id,
    messages: await getMessages(result.thread.id),
    threadId: result.thread.id,
  });
}

export async function DELETE(request: Request, context: RouteContext) {
  const { lessonId } = await context.params;
  const payload = deleteMessagesSchema.parse(await request.json());
  const result = await getLessonThread(lessonId);

  if (!result) {
    return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
  }

  await db.chatMessage.deleteMany({
    where: {
      id: {
        in: payload.messageIds,
      },
      threadId: result.thread.id,
    },
  });

  return NextResponse.json({
    lessonId: result.lesson.id,
    messages: await getMessages(result.thread.id),
    threadId: result.thread.id,
  });
}
