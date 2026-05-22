import { NextResponse } from "next/server";
import { z } from "zod";
import { getPlatformParticipants } from "@/lib/platform-participants";

const schema = z.object({
  role: z.enum(["STUDENT", "TEACHER"]),
});

function serializeParticipant(participant: Awaited<ReturnType<typeof getPlatformParticipants>>[number]) {
  return {
    ...participant,
    createdAt: participant.createdAt.toISOString(),
    lastSeenAt: participant.lastSeenAt?.toISOString() ?? null,
    nextLesson: participant.nextLesson
      ? {
          ...participant.nextLesson,
          startsAt: participant.nextLesson.startsAt.toISOString(),
        }
      : null,
  };
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const { role } = schema.parse({
    role: url.searchParams.get("role"),
  });
  const participants = await getPlatformParticipants(role);

  return NextResponse.json({
    participants: participants.map(serializeParticipant),
    updatedAt: new Date().toISOString(),
  });
}
