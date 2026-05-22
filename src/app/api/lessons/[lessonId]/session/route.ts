import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/server/db";

const participantSchema = z.object({
  participantId: z.string().min(1),
  role: z.enum(["STUDENT", "TEACHER"]),
});

type RouteContext = {
  params: Promise<{
    lessonId: string;
  }>;
};

const activePresenceWindowMs = 15_000;

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

  if (!lesson) return null;

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

async function addSystemMessage(lessonId: string, body: string) {
  const result = await getLessonThread(lessonId);

  if (!result) return;

  await db.chatMessage.create({
    data: {
      body,
      senderId: "SYSTEM",
      senderName: "Система",
      senderRole: "ADMIN",
      threadId: result.thread.id,
    },
  });
}

async function getParticipantName(role: "STUDENT" | "TEACHER", participantId: string) {
  if (role === "STUDENT") {
    const student = await db.studentProfile.findUnique({
      select: {
        fullName: true,
      },
      where: {
        id: participantId,
      },
    });

    return student?.fullName ?? participantId;
  }

  const teacher = await db.teacherProfile.findUnique({
    select: {
      fullName: true,
    },
    where: {
      id: participantId,
    },
  });

  return teacher?.fullName ?? participantId;
}

async function getPresenceState(lessonId: string, now = new Date()) {
  const activeSince = new Date(now.getTime() - activePresenceWindowMs);
  const [student, teacher] = await Promise.all([
    db.lessonPresence.findFirst({
      where: {
        disconnectedAt: null,
        lastSeenAt: {
          gte: activeSince,
        },
        lessonId,
        role: "STUDENT",
      },
    }),
    db.lessonPresence.findFirst({
      where: {
        disconnectedAt: null,
        lastSeenAt: {
          gte: activeSince,
        },
        lessonId,
        role: "TEACHER",
      },
    }),
  ]);

  return {
    isActive: Boolean(student && teacher),
    student,
    teacher,
  };
}

export async function POST(request: Request, context: RouteContext) {
  const { lessonId } = await context.params;
  const payload = participantSchema.parse(await request.json());
  const now = new Date();
  const lesson = await db.lesson.findUnique({
    select: {
      actualEndedAt: true,
      actualStartedAt: true,
      id: true,
    },
    where: {
      id: lessonId,
    },
  });

  if (!lesson) {
    return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
  }

  const existingPresence = await db.lessonPresence.findUnique({
    select: {
      disconnectedAt: true,
      id: true,
    },
    where: {
      lessonId_participantId_role: {
        lessonId: lesson.id,
        participantId: payload.participantId,
        role: payload.role,
      },
    },
  });
  const shouldAnnounceJoin = !existingPresence || Boolean(existingPresence.disconnectedAt);

  await db.lessonPresence.upsert({
    create: {
      connectedAt: now,
      lastSeenAt: now,
      lessonId: lesson.id,
      participantId: payload.participantId,
      role: payload.role,
    },
    update: {
      disconnectedAt: null,
      lastSeenAt: now,
    },
    where: {
      lessonId_participantId_role: {
        lessonId: lesson.id,
        participantId: payload.participantId,
        role: payload.role,
      },
    },
  });

  if (shouldAnnounceJoin) {
    const name = await getParticipantName(payload.role, payload.participantId);
    await addSystemMessage(lesson.id, `${name} подключился к уроку.`);
  }

  const presence = await getPresenceState(lesson.id, now);
  const shouldStart = presence.isActive && !lesson.actualStartedAt;
  const shouldReopen = presence.isActive && lesson.actualEndedAt;

  const updated = await db.lesson.update({
    data: {
      actualEndedAt: shouldReopen ? null : undefined,
      actualStartedAt: shouldStart ? now : undefined,
    },
    select: {
      actualEndedAt: true,
      actualStartedAt: true,
      id: true,
      status: true,
    },
    where: {
      id: lesson.id,
    },
  });

  return NextResponse.json({ isActive: presence.isActive, lesson: updated });
}

export async function PATCH(request: Request, context: RouteContext) {
  const { lessonId } = await context.params;
  const payload = participantSchema.parse(await request.json());
  const now = new Date();
  const lesson = await db.lesson.findUnique({
    select: {
      actualEndedAt: true,
      actualStartedAt: true,
      id: true,
    },
    where: {
      id: lessonId,
    },
  });

  if (!lesson) {
    return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
  }

  await db.lessonPresence.updateMany({
    data: {
      disconnectedAt: now,
      lastSeenAt: now,
    },
    where: {
      disconnectedAt: null,
      lessonId: lesson.id,
      participantId: payload.participantId,
      role: payload.role,
    },
  });

  const name = await getParticipantName(payload.role, payload.participantId);
  await addSystemMessage(lesson.id, `${name} завершил урок.`);

  const updated = await db.lesson.update({
    data: {
      actualEndedAt: lesson.actualStartedAt && !lesson.actualEndedAt ? now : lesson.actualEndedAt,
      status: lesson.actualStartedAt ? "COMPLETED" : undefined,
      transcriptRetainUntil: lesson.actualStartedAt && !lesson.actualEndedAt ? new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000) : undefined,
    },
    select: {
      actualEndedAt: true,
      actualStartedAt: true,
      id: true,
      status: true,
    },
    where: {
      id: lesson.id,
    },
  });

  return NextResponse.json({ isActive: false, lesson: updated });
}
