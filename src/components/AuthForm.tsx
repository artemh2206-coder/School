import Link from "next/link";

type LoginRole = "ADMIN" | "STUDENT" | "TEACHER";

const registerHref: Record<LoginRole, string> = {
  ADMIN: "/admin/login",
  STUDENT: "/student/register",
  TEACHER: "/teacher/register",
};

const loginLabels: Record<LoginRole, string> = {
  ADMIN: "администратора",
  STUDENT: "ученика",
  TEACHER: "учителя",
};

export function LoginForm({
  participantId = "",
  role,
  title,
}: {
  participantId?: string;
  role: LoginRole;
  title?: string;
}) {
  return (
    <main className="auth-shell">
      <section className="auth-card">
        <p className="eyebrow">NeoSchool</p>
        <h1>{title ?? `Вход ${loginLabels[role]}`}</h1>
        <p className="muted">
          Введите имя и фамилию или ID профиля. Пароль пока технический, можно оставить demo.
        </p>
        <form className="auth-form" action="/api/auth/login" method="post">
          <input name="role" type="hidden" value={role} />
          <label>
            Имя и фамилия или ID
            <input
              name="identifier"
              placeholder={
                role === "STUDENT"
                  ? "S00001 или Марк Волков"
                  : role === "TEACHER"
                    ? "T00001 или Анна Смирнова"
                    : "admin"
              }
              defaultValue={participantId}
            />
          </label>
          <label>
            Пароль
            <input name="password" placeholder="demo" type="password" />
          </label>
          <button className="button primary" type="submit">Войти</button>
        </form>
        {role !== "ADMIN" ? (
          <p className="form-help">
            Нет профиля? <Link href={registerHref[role]}>Зарегистрироваться</Link>
          </p>
        ) : null}
      </section>
    </main>
  );
}

export function RoleEntryPage({
  loginHref,
  registerHref,
  roleLabel,
}: {
  loginHref: string;
  registerHref: string;
  roleLabel: string;
}) {
  return (
    <main className="auth-shell">
      <section className="auth-card">
        <p className="eyebrow">NeoSchool</p>
        <h1>{roleLabel}</h1>
        <p className="muted">Выберите вход в существующий профиль или создайте новый технический профиль.</p>
        <div className="auth-form">
          <Link className="button primary" href={loginHref}>Вход</Link>
          <Link className="button" href={registerHref}>Регистрация</Link>
          <Link className="button" href="/">Назад</Link>
        </div>
      </section>
    </main>
  );
}
