import { LoginForm } from "@/components/AuthForm";

export default async function StudentLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ participantId?: string }>;
}) {
  const { participantId } = await searchParams;

  return <LoginForm participantId={participantId} role="STUDENT" title="Вход ученика" />;
}
