import { redirect } from "next/navigation";
import { z } from "zod";

const schema = z.object({
  cvUrl: z.string().url().optional().or(z.literal("")),
  email: z.string().email(),
  fullName: z.string().min(2),
  note: z.string().optional(),
  phone: z.string().optional(),
});

export async function POST(request: Request) {
  const formData = await request.formData();
  schema.parse({
    cvUrl: formData.get("cvUrl") || "",
    email: formData.get("email"),
    fullName: formData.get("fullName"),
    note: formData.get("note") || undefined,
    phone: formData.get("phone") || undefined,
  });

  // Next step: persist teacher application for admin review.
  redirect("/teachers");
}
