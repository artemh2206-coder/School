import Link from "next/link";

export default function HomePage() {
  return (
    <main className="auth-shell">
      <section className="auth-card">
        <p className="eyebrow">School OS</p>
        <h1>Техническая открытка платформы</h1>
        <p className="muted">
          Временный вход без авторизации. Позже эти три кнопки можно подключить к полноценному
          публичному сайту школы.
        </p>
        <div className="auth-form">
          <Link className="button primary" href="/student/dashboard">
            Кабинет ученика
          </Link>
          <Link className="button" href="/teacher/dashboard">
            Кабинет учителя
          </Link>
          <Link className="button" href="/admin">
            Админ
          </Link>
        </div>
      </section>
    </main>
  );
}
