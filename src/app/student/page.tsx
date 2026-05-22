import { RoleEntryPage } from "@/components/AuthForm";

export default function StudentEntryPage() {
  return (
    <RoleEntryPage
      loginHref="/student/login"
      registerHref="/student/register"
      roleLabel="Кабинет ученика"
    />
  );
}
