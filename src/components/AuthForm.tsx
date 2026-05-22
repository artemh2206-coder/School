import Link from "next/link";

export function LoginForm({
  participantId = "",
  role = "STUDENT",
  title = "Вход в платформу",
}: {
  participantId?: string;
  role?: "ADMIN" | "STUDENT" | "TEACHER";
  title?: string;
}) {
  return (
    <main className="auth-shell">
      <section className="auth-card">
        <p className="eyebrow">Authentication</p>
        <h1>{title}</h1>
        <p className="muted">
          Сейчас вход упрощен: выберите роль и укажите ID профиля, который был выдан при регистрации.
        </p>
        <form className="auth-form" action="/api/auth/login" method="post">
          <label>
            Роль
            <select name="role" defaultValue={role}>
              <option value="STUDENT">Ученик</option>
              <option value="TEACHER">Учитель</option>
              <option value="ADMIN">Админ</option>
            </select>
          </label>
          <label>
            ID профиля
            <input name="participantId" placeholder="S00001 или T00001" defaultValue={participantId} />
          </label>
          <label>
            Пароль
            <input name="password" placeholder="demo" type="password" />
          </label>
          <button className="button primary" type="submit">Войти</button>
        </form>
        <p className="form-help">
          Ученики регистрируются через <Link href="/student/register">регистрацию ученика</Link>, учителя через{" "}
          <Link href="/teacher/register">регистрацию учителя</Link>.
        </p>
      </section>
    </main>
  );
}
