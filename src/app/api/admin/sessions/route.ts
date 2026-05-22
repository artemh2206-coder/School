import { NextResponse } from "next/server";
import { db } from "@/server/db";

export async function GET() {
  const liveSince = new Date(Date.now() - 15_000);
  const lessons = await db.lesson.findMany({
    include: {
      presences: {
        where: {
          disconnectedAt: null,
          lastSeenAt: {
            gte: liveSince,
          },
        },
      },
      student: {
        select: {
          fullName: true,
        },
      },
      teacher: {
        select: {
          fullName: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 50,
  });

  return NextResponse.json({
    sessions: lessons.map((lesson) => ({
      actualEndedAt: lesson.actualEndedAt?.toISOString() ?? null,
      actualStartedAt: lesson.actualStartedAt?.toISOString() ?? null,
      createdAt: lesson.createdAt.toISOString(),
      id: lesson.id,
      isLive:
        lesson.presences.some((presence) => presence.role === "STUDENT") &&
        lesson.presences.some((presence) => presence.role === "TEACHER"),
      startsAt: lesson.startsAt.toISOString(),
      status: lesson.status,
      student: {
        fullName: lesson.student.fullName,
        id: lesson.studentId,
      },
      teacher: {
        fullName: lesson.teacher.fullName,
        id: lesson.teacherId,
      },
    })),
    updatedAt: new Date().toISOString(),
  });
}
