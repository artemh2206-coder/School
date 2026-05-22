import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/server/db";

type RouteContext = {
  params: Promise<{
    lessonId: string;
  }>;
};

const emptyToNull = z.literal("").transform(() => null);
const dateField = z.string().datetime().nullable().or(emptyToNull);

const updateSessionSchema = z.object({
  actualEndedAt: dateField.optional(),
  actualStartedAt: dateField.optional(),
  createdAt: z.string().datetime().optional(),
  durationMinutes: z.number().int().min(0).max(24 * 60).nullable().optional(),
  endsAt: z.string().datetime().optional(),
  startsAt: z.string().datetime().optional(),
  status: z.enum(["SCHEDULED", "COMPLETED", "CANCELLED", "NO_SHOW"]).optional(),
  studentId: z.string().regex(/^S\d{5}$/).optional(),
  teacherId: z.string().regex(/^T\d{5}$/).optional(),
  topic: z.string().trim().min(1).max(120).optional(),
  transcriptRetainUntil: dateField.optional(),
});

function toIso(date: Date | null) {
  return date?.toISOString() ?? null;
}

async function getSession(lessonId: string) {
  const lesson = await db.lesson.findUnique({
    include: {
      chatThread: {
        include: {
          messages: {
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
          },
        },
      },
      presences: {
        orderBy: {
          lastSeenAt: "desc",
        },
      },
      student: {
        select: {
          fullName: true,
          id: true,
        },
      },
      teacher: {
        select: {
          fullName: true,
          id: true,
        },
      },
    },
    where: {
      id: lessonId,
    },
  });

  if (!lesson) return null;

  return {
    actualEndedAt: toIso(lesson.actualEndedAt),
    actualStartedAt: toIso(lesson.actualStartedAt),
    createdAt: lesson.createdAt.toISOString(),
    endsAt: lesson.endsAt.toISOString(),
    id: lesson.id,
    messages:
      lesson.chatThread?.messages.map((message) => ({
        ...message,
        createdAt: message.createdAt.toISOString(),
      })) ?? [],
    presences: lesson.presences.map((presence) => ({
      connectedAt: presence.connectedAt.toISOString(),
      disconnectedAt: toIso(presence.disconnectedAt),
      id: presence.id,
      lastSeenAt: presence.lastSeenAt.toISOString(),
      participantId: presence.participantId,
      role: presence.role,
    })),
    startsAt: lesson.startsAt.toISOString(),
    status: lesson.status,
    student: lesson.student,
    teacher: lesson.teacher,
    topic: lesson.topic,
    transcriptPurgedAt: toIso(lesson.transcriptPurgedAt),
    transcriptRetainUntil: toIso(lesson.transcriptRetainUntil),
    updatedAt: lesson.updatedAt.toISOString(),
    zoomUrl: lesson.zoomUrl,
  };
}

export async function GET(_request: Request, context: RouteContext) {
  const { lessonId } = await context.params;
  const session = await getSession(lessonId);

  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  return NextResponse.json({ session });
}

export async function PATCH(request: Request, context: RouteContext) {
  const { lessonId } = await context.params;
  const payload = updateSessionSchema.parse(await request.json());
  const actualStartedAt =
    typeof payload.actualStartedAt === "string" ? new Date(payload.actualStartedAt) : payload.actualStartedAt;
  const actualEndedAt =
    payload.durationMinutes != null && actualStartedAt
      ? new Date(actualStartedAt.getTime() + payload.durationMinutes * 60_000)
      : payload.actualEndedAt
        ? new Date(payload.actualEndedAt)
        : payload.actualEndedAt;

  try {
    const updated = await db.lesson.update({
      data: {
        actualEndedAt,
        actualStartedAt,
        createdAt: payload.createdAt ? new Date(payload.createdAt) : undefined,
        endsAt: payload.endsAt ? new Date(payload.endsAt) : undefined,
        startsAt: payload.startsAt ? new Date(payload.startsAt) : undefined,
        status: payload.status,
        studentId: payload.studentId,
        teacherId: payload.teacherId,
        topic: payload.topic,
        transcriptRetainUntil: payload.transcriptRetainUntil ? new Date(payload.transcriptRetainUntil) : payload.transcriptRetainUntil,
      },
      where: {
        id: lessonId,
      },
    });

    if (payload.studentId || payload.teacherId) {
      const thread = await db.chatThread.findUnique({
        select: {
          id: true,
        },
        where: {
          lessonId,
        },
      });

      if (thread) {
        await db.chatMember.deleteMany({
          where: {
            threadId: thread.id,
          },
        });
        await db.chatMember.createMany({
          data: [
            {
              studentId: updated.studentId,
              threadId: thread.id,
            },
            {
              teacherId: updated.teacherId,
              threadId: thread.id,
            },
          ],
        });
      }
    }
  } catch {
    return NextResponse.json({ error: "Could not update session" }, { status: 400 });
  }

  const session = await getSession(lessonId);
  return NextResponse.json({ session });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { lessonId } = await context.params;

  await db.lesson.delete({
    where: {
      id: lessonId,
    },
  });

  return NextResponse.json({ deleted: true });
}
