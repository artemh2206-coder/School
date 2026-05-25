import { AccessToken } from "livekit-server-sdk";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/server/db";

const tokenRequestSchema = z.object({
  participantId: z.string().min(1),
  participantName: z.string().min(1),
  participantRole: z.enum(["STUDENT", "TEACHER", "ADMIN"]),
});

type RouteContext = {
  params: Promise<{
    lessonId: string;
  }>;
};

function getLiveKitConfig() {
  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;
  const serverUrl = process.env.LIVEKIT_URL ?? process.env.NEXT_PUBLIC_LIVEKIT_URL;

  if (!apiKey || !apiSecret || !serverUrl) {
    return null;
  }

  return { apiKey, apiSecret, serverUrl };
}

export async function POST(request: Request, context: RouteContext) {
  const { lessonId } = await context.params;
  const payload = tokenRequestSchema.parse(await request.json());
  const config = getLiveKitConfig();

  if (!config) {
    return NextResponse.json({ error: "LiveKit is not configured" }, { status: 503 });
  }

  const lesson = await db.lesson.findUnique({
    select: {
      id: true,
      studentId: true,
      teacherId: true,
    },
    where: {
      id: lessonId,
    },
  });

  if (!lesson) {
    return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
  }

  const isTeacher = payload.participantRole === "TEACHER" && payload.participantId === lesson.teacherId;
  const isStudent = payload.participantRole === "STUDENT" && payload.participantId === lesson.studentId;
  const isAdmin = payload.participantRole === "ADMIN";

  if (!isTeacher && !isStudent && !isAdmin) {
    return NextResponse.json({ error: "Participant is not allowed in this lesson" }, { status: 403 });
  }

  const canPublish = !isAdmin;
  const roomName = `neoschool-lesson-${lesson.id}`;
  const token = new AccessToken(config.apiKey, config.apiSecret, {
    identity: `${payload.participantRole}:${payload.participantId}`,
    metadata: JSON.stringify({
      lessonId: lesson.id,
      participantId: payload.participantId,
      role: payload.participantRole,
    }),
    name: payload.participantName,
    ttl: "3h",
  });

  token.addGrant({
    canPublish,
    canPublishData: canPublish,
    canSubscribe: true,
    room: roomName,
    roomJoin: true,
  });

  return NextResponse.json({
    roomName,
    serverUrl: config.serverUrl,
    token: await token.toJwt(),
  });
}
