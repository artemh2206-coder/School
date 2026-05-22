import type { UserRole, UserStatus } from "@prisma/client";
import { db } from "@/server/db";

export type PlatformParticipantRole = "STUDENT" | "TEACHER";

export type PlatformParticipant = {
  id: string;
  fullName: string;
  role: PlatformParticipantRole;
  status: UserStatus;
  createdAt: Date;
  lastSeenAt: Date | null;
  isOnline: boolean;
  nextLesson: {
    id: string;
    startsAt: Date;
    topic: string;
    counterpartId: string;
    counterpartName: string;
  } | null;
};

const rolePrefix: Record<PlatformParticipantRole, string> = {
  STUDENT: "S",
  TEACHER: "T",
};

export function getInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function formatParticipantId(role: PlatformParticipantRole, value: number) {
  return `${rolePrefix[role]}${String(value).padStart(5, "0")}`;
}

async function getNextParticipantId(role: PlatformParticipantRole) {
  const prefix = rolePrefix[role];
  const latest =
    role === "STUDENT"
      ? await db.studentProfile.findFirst({
          orderBy: {
            id: "desc",
          },
          select: {
            id: true,
          },
          where: {
            id: {
              startsWith: prefix,
            },
          },
        })
      : await db.teacherProfile.findFirst({
          orderBy: {
            id: "desc",
          },
          select: {
            id: true,
          },
          where: {
            id: {
              startsWith: prefix,
            },
          },
        });
  const current = latest ? Number(latest.id.slice(1)) : 0;

  if (!Number.isFinite(current) || current >= 99999) {
    throw new Error(`Could not allocate ${role.toLowerCase()} id`);
  }

  return formatParticipantId(role, current + 1);
}

export async function createParticipant(role: PlatformParticipantRole, fullName: string) {
  const id = await getNextParticipantId(role);
  const email = `${id.toLowerCase()}@neoschool.local`;

  if (role === "STUDENT") {
    await db.user.create({
      data: {
        email,
        role,
        studentProfile: {
          create: {
            fullName,
            id,
          },
        },
      },
    });
  } else {
    await db.user.create({
      data: {
        email,
        role,
        teacherProfile: {
          create: {
            fullName,
            id,
          },
        },
      },
    });
  }

  return id;
}

function isRecentlyOnline(lastSeenAt: Date | null, now: Date) {
  if (!lastSeenAt) return false;
  return now.getTime() - lastSeenAt.getTime() < 2 * 60 * 1000;
}

async function getLastPresenceByParticipant(role: UserRole) {
  const presences = await db.lessonPresence.findMany({
    distinct: ["participantId"],
    orderBy: {
      lastSeenAt: "desc",
    },
    select: {
      lastSeenAt: true,
      participantId: true,
    },
    where: {
      role,
    },
  });

  return new Map(presences.map((presence) => [presence.participantId, presence.lastSeenAt]));
}

export async function getPlatformParticipants(role: PlatformParticipantRole): Promise<PlatformParticipant[]> {
  const now = new Date();
  const lastSeenById = await getLastPresenceByParticipant(role);

  if (role === "STUDENT") {
    const students = await db.studentProfile.findMany({
      include: {
        lessons: {
          include: {
            teacher: {
              select: {
                fullName: true,
                id: true,
              },
            },
          },
          orderBy: {
            startsAt: "asc",
          },
          take: 1,
          where: {
            startsAt: {
              gte: now,
            },
            status: "SCHEDULED",
          },
        },
        user: {
          select: {
            createdAt: true,
            status: true,
          },
        },
      },
      orderBy: {
        id: "asc",
      },
    });

    return students.map((student) => {
      const lastSeenAt = lastSeenById.get(student.id) ?? null;
      const nextLesson = student.lessons[0] ?? null;

      return {
        createdAt: student.user.createdAt,
        fullName: student.fullName,
        id: student.id,
        isOnline: isRecentlyOnline(lastSeenAt, now),
        lastSeenAt,
        nextLesson: nextLesson
          ? {
              counterpartId: nextLesson.teacher.id,
              counterpartName: nextLesson.teacher.fullName,
              id: nextLesson.id,
              startsAt: nextLesson.startsAt,
              topic: nextLesson.topic,
            }
          : null,
        role,
        status: student.user.status,
      };
    });
  }

  const teachers = await db.teacherProfile.findMany({
    include: {
      lessons: {
        include: {
          student: {
            select: {
              fullName: true,
              id: true,
            },
          },
        },
        orderBy: {
          startsAt: "asc",
        },
        take: 1,
        where: {
          startsAt: {
            gte: now,
          },
          status: "SCHEDULED",
        },
      },
      user: {
        select: {
          createdAt: true,
          status: true,
        },
      },
    },
    orderBy: {
      id: "asc",
    },
  });

  return teachers.map((teacher) => {
    const lastSeenAt = lastSeenById.get(teacher.id) ?? null;
    const nextLesson = teacher.lessons[0] ?? null;

    return {
      createdAt: teacher.user.createdAt,
      fullName: teacher.fullName,
      id: teacher.id,
      isOnline: isRecentlyOnline(lastSeenAt, now),
      lastSeenAt,
      nextLesson: nextLesson
        ? {
            counterpartId: nextLesson.student.id,
            counterpartName: nextLesson.student.fullName,
            id: nextLesson.id,
            startsAt: nextLesson.startsAt,
            topic: nextLesson.topic,
          }
        : null,
      role,
      status: teacher.user.status,
    };
  });
}

export async function getPlatformParticipant(role: PlatformParticipantRole, id: string) {
  const participants = await getPlatformParticipants(role);
  return participants.find((participant) => participant.id === id) ?? null;
}
