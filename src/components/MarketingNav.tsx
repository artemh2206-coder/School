import Link from "next/link";
import { LanguageSwitcher } from "./LanguageRuntime";

export function MarketingNav() {
  return (
    <header className="site-nav">
      <Link className="brand" href="/">
        <span className="brand-mark">N</span>
        <span>
          <strong>NeoSchool</strong>
          <span>онлайн-школа</span>
        </span>
      </Link>
      <nav className="nav-links" aria-label="Основная навигация">
        <Link href="/students">Ученикам</Link>
        <Link href="/teachers">Учителям</Link>
        <Link href="/login">Войти</Link>
        <Link className="admin-link" href="/admin/login">
          Админ
        </Link>
        <LanguageSwitcher />
      </nav>
    </header>
  );
}
