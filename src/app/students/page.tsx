import Link from "next/link";
import { MarketingNav } from "@/components/MarketingNav";

export default function StudentsLandingPage() {
  return (
    <main className="site-shell">
      <MarketingNav />
      <section className="hero-card" style={{ marginTop: 18 }}>
        <p className="eyebrow">Для учеников</p>
        <h1>Запись на курс, уроки и прогресс в одном кабинете.</h1>
        <p>
          Ученик регистрируется сам, выбирает курс, оплачивает пакет и после входа получает
          доступ только к своему кабинету.
        </p>
        <div className="hero-actions">
          <Link className="button primary" href="/student/register">Зарегистрироваться</Link>
          <Link className="button" href="/login">Уже есть аккаунт</Link>
        </div>
      </section>
    </main>
  );
}
