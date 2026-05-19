import Link from "next/link";

export function LoginForm({ title = "Вход в платформу" }: { title?: string }) {
  return (
    <main className="auth-shell">
      <section className="auth-card">
        <p className="eyebrow">Authentication</p>
        <h1>{title}</h1>
        <p className="muted">
          В production здесь будет email/password, Google login и телефон. Сейчас вход ставит
          demo-сессию, чтобы строить кабинеты и API.
        </p>
        <form className="auth-form" action="/api/auth/login" method="post">
          <label>
            Роль
            <select name="role" defaultValue="STUDENT">
              <option value="STUDENT">Ученик</option>
              <option value="TEACHER">Учитель</option>
              <option value="ADMIN">Админ</option>
            </select>
          </label>
          <label>
            Email
            <input name="email" placeholder="name@example.com" type="email" />
          </label>
          <label>
            Пароль
            <input name="password" placeholder="demo" type="password" />
          </label>
          <button className="button primary" type="submit">Войти</button>
        </form>
        <p className="form-help">
          Ученики регистрируются через <Link href="/student/register">запись на курс</Link>, а
          учителя отправляют <Link href="/teacher/apply">CV на проверку</Link>.
        </p>
      </section>
    </main>
  );
}
