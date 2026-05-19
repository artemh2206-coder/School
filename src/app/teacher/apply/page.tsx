import { MarketingNav } from "@/components/MarketingNav";

export default function TeacherApplyPage() {
  return (
    <main className="site-shell">
      <MarketingNav />
      <section className="auth-card" style={{ margin: "18px auto 0" }}>
        <p className="eyebrow">Заявка преподавателя</p>
        <h1>Отправить CV</h1>
        <form className="auth-form" action="/api/teacher-applications" method="post">
          <div className="field-row">
            <label>
              Имя
              <input name="fullName" placeholder="Ваше имя" required />
            </label>
            <label>
              Телефон
              <input name="phone" placeholder="+380 / +48 / +49" />
            </label>
          </div>
          <label>
            Email
            <input name="email" placeholder="teacher@example.com" required type="email" />
          </label>
          <label>
            Ссылка на CV / портфолио
            <input name="cvUrl" placeholder="https://..." />
          </label>
          <label>
            Комментарий
            <textarea name="note" placeholder="Опыт, языки, специализация" />
          </label>
          <button className="button primary" type="submit">Отправить на проверку</button>
        </form>
      </section>
    </main>
  );
}
