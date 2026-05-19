# School OS

Профессиональное ядро платформы онлайн-школы: публичный сайт, личные кабинеты,
серверное API, роли, PostgreSQL-модель данных, материалы, чат, финансы и audit logs.

## Архитектура

```text
Public website
  -> auth / registration / teacher applications
  -> protected dashboards
  -> API routes
  -> domain services
  -> PostgreSQL via Prisma
  -> file storage / payments / realtime later
```

## Основные маршруты

```text
/                         публичный сайт
/students                 страница для учеников
/teachers                 страница для преподавателей
/login                    общий вход
/student/register         регистрация ученика
/teacher/apply            заявка преподавателя / CV
/admin/login              вход администратора
/student/dashboard        кабинет ученика
/teacher/dashboard        кабинет учителя
/admin                    супер админка
/api/health               health endpoint ядра
```

## Ядро данных

Prisma schema находится в `prisma/schema.prisma`.

Ключевые домены:

```text
users
sessions
student_profiles
teacher_profiles
teacher_applications
courses
lesson_packages
student_balances
availability_slots
lessons
materials
material_access
homework
chat_threads
chat_messages
payments
withdrawal_requests
audit_logs
platform_settings
```

## Локальный запуск

```bash
npm install
npx prisma generate
npm run dev
```

Для реальной базы:

```bash
copy .env.example .env
npx prisma migrate dev
```

`DATABASE_URL` должен указывать на PostgreSQL.

## Текущее состояние auth

Сейчас используется demo-cookie auth, чтобы можно было строить защищенные кабинеты
и API без ожидания полной production-auth интеграции.

Следующий слой:

```text
email/password
Google login
phone login later
hashed passwords
database sessions
role redirects
audit logs for login/admin actions
```

## Production direction

Рекомендуемый деплой:

```text
Next.js app: Vercel / Railway / Render
Database: managed PostgreSQL, например Neon / Supabase / Railway
File storage: Cloudflare R2 / S3 / Supabase Storage
Payments: Stripe for EUR/USD, отдельный провайдер для UAH
Realtime: WebSocket / Pusher / Supabase Realtime
```
