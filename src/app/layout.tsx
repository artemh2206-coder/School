import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "School OS",
  description: "Профессиональная платформа онлайн-школы с личными кабинетами, API и серверным ядром.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}
