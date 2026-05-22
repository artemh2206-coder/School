import { LoginForm } from "@/components/AuthForm";

export default async function TeacherLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ participantId?: string }>;
}) {
  const { participantId } = await searchParams;

  return <LoginForm participantId={participantId} role="TEACHER" title="Вход учителя" />;
}
