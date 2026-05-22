import { MarketingNav } from "@/components/MarketingNav";

export default function TeacherApplyPage() {
  return (
    <main className="site-shell">
      <MarketingNav />
      <section className="auth-card" style={{ margin: "18px auto 0" }}>
        <p className="eyebrow">Регистрация учителя</p>
        <h1>Создать профиль учителя</h1>
        <form className="auth-form" action="/api/teacher-applications" method="post">
          <label>
            Имя и фамилия
            <input name="fullName" placeholder="Например: Анна Смирнова" required />
          </label>
          <button className="button primary" type="submit">Зарегистрировать учителя</button>
        </form>
      </section>
    </main>
  );
}
