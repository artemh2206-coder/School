import { redirect } from "next/navigation";
import { isRole } from "@/core/roles";

export default async function LoginRedirectPage({
  searchParams,
}: {
  searchParams: Promise<{ participantId?: string; role?: string }>;
}) {
  const params = await searchParams;
  const suffix = params.participantId ? `?participantId=${encodeURIComponent(params.participantId)}` : "";

  if (params.role === "STUDENT") redirect(`/student/login${suffix}`);
  if (params.role === "TEACHER") redirect(`/teacher/login${suffix}`);
  if (isRole(params.role) && params.role === "ADMIN") redirect("/admin/login");

  redirect("/");
}
