import { NextResponse } from "next/server";
import { db } from "@/server/db";

export async function POST() {
  const now = new Date();
  const lessons = await db.lesson.findMany({
    select: {
      chatThread: {
        select: {
          id: true,
        },
      },
      id: true,
    },
    where: {
      transcriptPurgedAt: null,
      transcriptRetainUntil: {
        lt: now,
      },
    },
  });

  const threadIds = lessons.flatMap((lesson) => (lesson.chatThread?.id ? [lesson.chatThread.id] : []));

  const deletedMessages = threadIds.length
    ? await db.chatMessage.deleteMany({
        where: {
          threadId: {
            in: threadIds,
          },
        },
      })
    : { count: 0 };

  await db.lesson.updateMany({
    data: {
      transcriptPurgedAt: now,
    },
    where: {
      id: {
        in: lessons.map((lesson) => lesson.id),
      },
    },
  });

  return NextResponse.json({
    deletedMessages: deletedMessages.count,
    purgedSessions: lessons.length,
  });
}
