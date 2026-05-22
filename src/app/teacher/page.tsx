import { RoleEntryPage } from "@/components/AuthForm";

export default function TeacherEntryPage() {
  return (
    <RoleEntryPage
      loginHref="/teacher/login"
      registerHref="/teacher/register"
      roleLabel="Кабинет учителя"
    />
  );
}
