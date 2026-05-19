import Link from "next/link";
import { MarketingNav } from "@/components/MarketingNav";

export default function TeachersLandingPage() {
  return (
    <main className="site-shell">
      <MarketingNav />
      <section className="hero-card" style={{ marginTop: 18 }}>
        <p className="eyebrow">Для преподавателей</p>
        <h1>Преподавателей подключает админ после проверки CV.</h1>
        <p>
          Учитель не регистрируется самостоятельно. Он отправляет CV, админ проверяет заявку и
          создает доступ к кабинету преподавателя.
        </p>
        <div className="hero-actions">
          <Link className="button primary" href="/teacher/apply">Отправить CV</Link>
          <Link className="button" href="/login">Войти как учитель</Link>
        </div>
      </section>
    </main>
  );
}
