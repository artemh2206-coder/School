import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/server/db";

const messageSchema = z.object({
  attachmentData: z.string().optional(),
  attachmentMime: z.string().optional(),
  attachmentName: z.string().optional(),
  attachmentSize: z.number().int().max(2_500_000).optional(),
  body: z.string().trim().max(2000),
  senderId: z.string().min(1),
  senderName: z.string().trim().min(1).max(120),
  senderRole: z.enum(["STUDENT", "TEACHER", "ADMIN"]),
}).refine((value) => value.body.length > 0 || Boolean(value.attachmentData), "Message body or attachment is required");

const deleteMessagesSchema = z.object({
  messageIds: z.array(z.string().min(1)).min(1).max(50),
});

const updateAttachmentSchema = z.object({
  attachmentData: z.string().min(1),
  attachmentMime: z.string().min(1),
  attachmentName: z.string().min(1).max(255),
  attachmentSize: z.number().int().positive(),
  messageId: z.string().min(1),
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
      attachmentData: true,
      attachmentMime: true,
      attachmentName: true,
      attachmentSize: true,
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
      attachmentData: payload.attachmentData,
      attachmentMime: payload.attachmentMime,
      attachmentName: payload.attachmentName,
      attachmentSize: payload.attachmentSize,
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

export async function PATCH(request: Request, context: RouteContext) {
  const { lessonId } = await context.params;
  const payload = updateAttachmentSchema.parse(await request.json());
  const result = await getLessonThread(lessonId);

  if (!result) {
    return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
  }

  await db.chatMessage.updateMany({
    data: {
      attachmentData: payload.attachmentData,
      attachmentMime: payload.attachmentMime,
      attachmentName: payload.attachmentName,
      attachmentSize: payload.attachmentSize,
    },
    where: {
      id: payload.messageId,
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
