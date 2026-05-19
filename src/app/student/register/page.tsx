import { MarketingNav } from "@/components/MarketingNav";

export default function StudentRegisterPage() {
  return (
    <main className="site-shell">
      <MarketingNav />
      <section className="auth-card" style={{ margin: "18px auto 0" }}>
        <p className="eyebrow">Регистрация ученика</p>
        <h1>Записаться на курс</h1>
        <form className="auth-form" action="/api/students/register" method="post">
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
            <input name="email" placeholder="name@example.com" required type="email" />
          </label>
          <label>
            Курс
            <select name="courseSlug" defaultValue="english-b1">
              <option value="english-b1">English B1</option>
              <option value="speaking">Speaking practice</option>
              <option value="ielts">IELTS preparation</option>
            </select>
          </label>
          <button className="button primary" type="submit">Создать заявку ученика</button>
        </form>
      </section>
    </main>
  );
}
