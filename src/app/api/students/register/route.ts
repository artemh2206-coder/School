import { redirect } from "next/navigation";
import { z } from "zod";

const schema = z.object({
  courseSlug: z.string().min(1),
  email: z.string().email(),
  fullName: z.string().min(2),
  phone: z.string().optional(),
});

export async function POST(request: Request) {
  const formData = await request.formData();
  schema.parse({
    courseSlug: formData.get("courseSlug"),
    email: formData.get("email"),
    fullName: formData.get("fullName"),
    phone: formData.get("phone") || undefined,
  });

  // Next step: persist student registration and start payment/package flow.
  redirect("/login");
}
