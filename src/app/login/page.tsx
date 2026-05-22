import { LoginForm } from "@/components/AuthForm";
import { isRole } from "@/core/roles";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ participantId?: string; role?: string }>;
}) {
  const params = await searchParams;
  const role = isRole(params.role) ? params.role : "STUDENT";

  return <LoginForm participantId={params.participantId} role={role} />;
}
