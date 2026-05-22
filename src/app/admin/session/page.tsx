import { notFound } from "next/navigation";
import { AdminSessionDetails, type AdminSessionDetail } from "@/components/AdminSessionDetails";
import { DashboardShell, Panel } from "@/components/DashboardShell";
import { db } from "@/server/db";

export const dynamic = "force-dynamic";

const nav = [
  { href: "/admin", label: "Платформа", description: "главный экран" },
  { href: "/admin/sessions", label: "Сессии", description: "уроки и наблюдение", newTab: true },
  { href: "/admin/teachers", label: "Учителя", description: "список профилей" },
  { href: "/admin/students", label: "Ученики", description: "список профилей" },
  { href: "/admin/finance", label: "Финансы", description: "платежи и выводы" },
];

function toIso(date: Date | null) {
  return date?.toISOString() ?? null;
}

export default async function AdminSessionPage({
  searchParams,
}: {
  searchParams: Promise<{ lessonId?: string }>;
}) {
  const { lessonId } = await searchParams;

  if (!lessonId) notFound();

  const [lesson, students, teachers] = await Promise.all([
    db.lesson.findUnique({
      include: {
        chatThread: {
          include: {
            messages: {
              orderBy: {
                createdAt: "asc",
              },
              select: {
                body: true,
                createdAt: true,
                id: true,
                senderId: true,
                senderName: true,
                senderRole: true,
              },
            },
          },
        },
        presences: {
          orderBy: {
            lastSeenAt: "desc",
          },
        },
        student: {
          select: {
            fullName: true,
            id: true,
          },
        },
        teacher: {
          select: {
            fullName: true,
            id: true,
          },
        },
      },
      where: {
        id: lessonId,
      },
    }),
    db.studentProfile.findMany({
      orderBy: {
        id: "asc",
      },
      select: {
        fullName: true,
        id: true,
      },
    }),
    db.teacherProfile.findMany({
      orderBy: {
        id: "asc",
      },
      select: {
        fullName: true,
        id: true,
      },
    }),
  ]);

  if (!lesson) notFound();

  const session: AdminSessionDetail = {
    actualEndedAt: toIso(lesson.actualEndedAt),
    actualStartedAt: toIso(lesson.actualStartedAt),
    createdAt: lesson.createdAt.toISOString(),
    endsAt: lesson.endsAt.toISOString(),
    id: lesson.id,
    messages:
      lesson.chatThread?.messages.map((message) => ({
        ...message,
        createdAt: message.createdAt.toISOString(),
      })) ?? [],
    presences: lesson.presences.map((presence) => ({
      connectedAt: presence.connectedAt.toISOString(),
      disconnectedAt: toIso(presence.disconnectedAt),
      id: presence.id,
      lastSeenAt: presence.lastSeenAt.toISOString(),
      participantId: presence.participantId,
      role: presence.role,
    })),
    startsAt: lesson.startsAt.toISOString(),
    status: lesson.status,
    student: lesson.student,
    teacher: lesson.teacher,
    topic: lesson.topic,
    transcriptPurgedAt: toIso(lesson.transcriptPurgedAt),
    transcriptRetainUntil: toIso(lesson.transcriptRetainUntil),
    updatedAt: lesson.updatedAt.toISOString(),
    zoomUrl: lesson.zoomUrl,
  };

  return (
    <DashboardShell
      compactHeader
      hideProfileCard
      nav={nav}
      profile={{
        initials: "AD",
        name: "Админ",
        status: "Полный доступ",
        meta: "Подробности сессии",
      }}
      roleLabel="Админ"
    >
      <Panel title="Сессия">
        <AdminSessionDetails initialSession={session} students={students} teachers={teachers} />
      </Panel>
    </DashboardShell>
  );
}
