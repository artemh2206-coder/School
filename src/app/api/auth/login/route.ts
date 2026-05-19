import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getRoleHome } from "@/server/auth";

const schema = z.object({
  email: z.string().email().optional().or(z.literal("")),
  password: z.string().optional(),
  role: z.enum(["STUDENT", "TEACHER", "ADMIN"]),
});

export async function POST(request: Request) {
  const formData = await request.formData();
  const payload = schema.parse({
    email: formData.get("email"),
    password: formData.get("password"),
    role: formData.get("role"),
  });

  const cookieStore = await cookies();
  cookieStore.set("school_os_role", payload.role, {
    httpOnly: true,
    path: "/",
    sameSite: "lax",
  });

  redirect(getRoleHome(payload.role));
}
