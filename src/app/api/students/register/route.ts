import { redirect } from "next/navigation";
import { z } from "zod";
import { createParticipant } from "@/lib/platform-participants";

const schema = z.object({
  fullName: z.string().min(2),
});

export async function POST(request: Request) {
  const formData = await request.formData();
  const payload = schema.parse({
    fullName: formData.get("fullName"),
  });

  const id = await createParticipant("STUDENT", payload.fullName);
  redirect(`/login?role=STUDENT&participantId=${id}`);
}
