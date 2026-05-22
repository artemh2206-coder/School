import { AdminParticipantsList, type AdminParticipantView } from "@/components/AdminParticipantsList";
import { DashboardShell, Panel } from "@/components/DashboardShell";
import { getPlatformParticipants } from "@/lib/platform-participants";

export const dynamic = "force-dynamic";

const nav = [
  { href: "/admin", label: "Платформа", description: "главный экран" },
  { href: "/admin/sessions", label: "Сессии", description: "уроки и наблюдение" },
  { href: "/admin/teachers", label: "Учителя", description: "список профилей" },
  { href: "/admin/students", label: "Ученики", description: "список профилей" },
  { href: "/admin/finance", label: "Финансы", description: "платежи и выводы" },
];

function serializeParticipant(participant: Awaited<ReturnType<typeof getPlatformParticipants>>[number]): AdminParticipantView {
  return {
    ...participant,
    createdAt: participant.createdAt.toISOString(),
    lastSeenAt: participant.lastSeenAt?.toISOString() ?? null,
    nextLesson: participant.nextLesson
      ? {
          ...participant.nextLesson,
          startsAt: participant.nextLesson.startsAt.toISOString(),
        }
      : null,
  };
}

export default async function AdminTeachersPage() {
  const teachers = await getPlatformParticipants("TEACHER");

  return (
    <DashboardShell
      compactHeader
      hideProfileCard
      logoutHref="/api/auth/logout"
      nav={nav}
      profile={{
        initials: "AD",
        name: "Администратор",
        status: "Супер админ · полный доступ",
        meta: "Список учителей платформы",
      }}
      roleLabel="Админ"
    >
      <Panel title="Учителя">
        <AdminParticipantsList participants={teachers.map(serializeParticipant)} role="TEACHER" />
      </Panel>
    </DashboardShell>
  );
}
