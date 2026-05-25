import type { Metadata } from "next";
import { LanguageRuntime } from "@/components/LanguageRuntime";
import "./globals.css";

export const metadata: Metadata = {
  title: "NeoSchool",
  description: "Профессиональная платформа онлайн-школы с личными кабинетами, API и серверным ядром.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body>
        <LanguageRuntime />
        {children}
      </body>
    </html>
  );
}
