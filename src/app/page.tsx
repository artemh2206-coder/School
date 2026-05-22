import Link from "next/link";

export default function HomePage() {
  return (
    <main className="auth-shell">
      <section className="auth-card">
        <p className="eyebrow">NeoSchool</p>
        <h1>Технический вход в платформу</h1>
        <p className="muted">
          Выберите, в какой кабинет хотите войти. На следующем шаге будет вход или регистрация только для выбранной роли.
        </p>
        <div className="auth-form">
          <Link className="button primary" href="/student">
            Кабинет ученика
          </Link>
          <Link className="button" href="/teacher">
            Кабинет учителя
          </Link>
          <Link className="button" href="/admin/login">
            Админ
          </Link>
        </div>
      </section>
    </main>
  );
}
