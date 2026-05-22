import { notFound } from "next/navigation";
import { AdminParticipantProfile, type AdminParticipantView } from "@/components/AdminParticipantsList";
import { DashboardShell, Panel } from "@/components/DashboardShell";
import { getInitials, getPlatformParticipant } from "@/lib/platform-participants";

export const dynamic = "force-dynamic";

const nav = [
  { href: "/admin", label: "Платформа", description: "главный экран" },
  { href: "/admin/sessions", label: "Сессии", description: "уроки и наблюдение" },
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

export default async function AdminStudentProfilePage({
  params,
}: {
  params: Promise<{ studentId: string }>;
}) {
  const { studentId } = await params;
  const student = await getPlatformParticipant("STUDENT", studentId);

  if (!student) notFound();

  return (
    <DashboardShell
      compactHeader
      hideProfileCard
      logoutHref="/api/auth/logout"
      nav={nav}
      profile={{
        id: student.id,
        initials: getInitials(student.fullName),
        name: student.fullName,
        status: student.isOnline ? "Ученик · онлайн" : "Ученик · не онлайн",
        meta: "Профиль ученика",
      }}
      roleLabel="Админ"
    >
      <Panel title="Профиль ученика">
        <AdminParticipantProfile participant={serializeParticipant(student)} />
      </Panel>
    </DashboardShell>
  );
}
