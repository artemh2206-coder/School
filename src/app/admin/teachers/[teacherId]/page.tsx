import { notFound } from "next/navigation";
import { AdminParticipantProfile, type AdminParticipantView } from "@/components/AdminParticipantsList";
import { DashboardShell, Panel } from "@/components/DashboardShell";
import { getInitials, getPlatformParticipant } from "@/lib/platform-participants";

export const dynamic = "force-dynamic";

const nav = [
  { href: "/admin", label: "Платформа", description: "главный экран" },
  { href: "/admin/sessions", label: "Сессии", description: "уроки и наблюдение", newTab: true },
  { href: "/admin/teachers", label: "Учителя", description: "список профилей" },
  { href: "/admin/students", label: "Ученики", description: "список профилей" },
  { href: "/admin/finance", label: "Финансы", description: "платежи и выводы" },
];

function serializeParticipant(participant: NonNullable<Awaited<ReturnType<typeof getPlatformParticipant>>>): AdminParticipantView {
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

export default async function AdminTeacherProfilePage({
  params,
}: {
  params: Promise<{ teacherId: string }>;
}) {
  const { teacherId } = await params;
  const teacher = await getPlatformParticipant("TEACHER", teacherId);

  if (!teacher) notFound();

  return (
    <DashboardShell
      compactHeader
      hideProfileCard
      nav={nav}
      profile={{
        id: teacher.id,
        initials: getInitials(teacher.fullName),
        name: teacher.fullName,
        status: teacher.isOnline ? "Учитель · онлайн" : "Учитель · не онлайн",
        meta: "Профиль учителя",
      }}
      roleLabel="Админ"
    >
      <Panel title="Профиль учителя">
        <AdminParticipantProfile participant={serializeParticipant(teacher)} />
      </Panel>
    </DashboardShell>
  );
}
