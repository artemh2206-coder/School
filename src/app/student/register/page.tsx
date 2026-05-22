import { MarketingNav } from "@/components/MarketingNav";

export default function StudentRegisterPage() {
  return (
    <main className="site-shell">
      <MarketingNav />
      <section className="auth-card" style={{ margin: "18px auto 0" }}>
        <p className="eyebrow">Регистрация ученика</p>
        <h1>Создать профиль ученика</h1>
        <form className="auth-form" action="/api/students/register" method="post">
          <label>
            Имя и фамилия
            <input name="fullName" placeholder="Например: Марк Волков" required />
          </label>
          <button className="button primary" type="submit">Зарегистрировать ученика</button>
        </form>
      </section>
    </main>
  );
}
