import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { DashboardShell, Panel } from "@/components/DashboardShell";
import { TeacherProfileForm } from "@/components/TeacherProfileForm";
import { getInitials } from "@/lib/platform-participants";
import { db } from "@/server/db";

export const dynamic = "force-dynamic";

function splitList(value: FormDataEntryValue | null) {
  return String(value ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 10);
}

function cleanText(value: FormDataEntryValue | null, maxLength: number) {
  return String(value ?? "").trim().slice(0, maxLength);
}

async function updateTeacherProfile(teacherId: string, formData: FormData) {
  "use server";

  const lessonPriceUah = Math.max(0, Math.round(Number(formData.get("lessonPriceUah") ?? 0)));
  const experienceYears = Math.max(0, Math.round(Number(formData.get("experienceYears") ?? 0)));

  await db.teacherProfile.update({
    data: {
      bio: cleanText(formData.get("bio"), 1400) || null,
      experienceYears,
      gender: cleanText(formData.get("gender"), 20) || "UNSPECIFIED",
      headline: cleanText(formData.get("headline"), 120) || null,
      introVideoUrl: cleanText(formData.get("introVideoUrl"), 500) || null,
      isMarketplaceVisible: formData.get("isMarketplaceVisible") === "on",
      lessonPriceUah: lessonPriceUah || 500,
      profilePhotoPositionX: Math.min(100, Math.max(0, Math.round(Number(formData.get("profilePhotoPositionX") ?? 50)))),
      profilePhotoPositionY: Math.min(100, Math.max(0, Math.round(Number(formData.get("profilePhotoPositionY") ?? 50)))),
      profilePhotoUrl: cleanText(formData.get("profilePhotoUrl"), 3_600_000) || null,
      specialties: splitList(formData.get("specialties")),
      teachingLanguages: splitList(formData.get("teachingLanguages")),
      teachingStyle: splitList(formData.get("teachingStyle")),
    },
    where: {
      id: teacherId,
    },
  });

  revalidatePath(`/teacher/${teacherId}/profile`);
  revalidatePath("/student");
  redirect(`/teacher/${teacherId}/profile?saved=1`);
}

export default async function TeacherProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ teacherId: string }>;
  searchParams: Promise<{ saved?: string }>;
}) {
  const { teacherId } = await params;
  const { saved } = await searchParams;
  const teacher = await db.teacherProfile.findUnique({ where: { id: teacherId } });
  if (!teacher) redirect("/teacher");

  const action = updateTeacherProfile.bind(null, teacher.id);
  const specialties = teacher.specialties.join(", ");
  const style = teacher.teachingStyle.join(", ");

  return (
    <DashboardShell
      nav={[
        { href: `/teacher/${teacher.id}/dashboard`, label: "Кабинет", description: "главная" },
        { href: "#schedule-modal", label: "Расписание", description: "календарь" },
        { href: `/teacher/${teacher.id}/lesson`, label: "Уроки", description: "список уроков" },
        { href: `/teacher/${teacher.id}/students`, label: "Ученики", description: "список учеников" },
      ]}
      profile={{
        id: teacher.id,
        initials: getInitials(teacher.fullName),
        name: teacher.fullName,
        status: "Преподаватель · публичный профиль",
        meta: "Витрина для новых учеников",
      }}
      hideProfileCard
      logoutHref="/api/auth/logout"
      roleLabel="Кабинет учителя"
      scheduleEditable
      scheduleTeacherId={teacher.id}
    >
      <div className="teacher-profile-editor-grid">
        <Panel title="Публичный профиль">
          {saved ? <div className="success-state">Профиль сохранен и обновлен в каталоге учителей.</div> : null}
          <TeacherProfileForm
            action={action}
            initial={{
              bio: teacher.bio ?? "",
              experienceYears: teacher.experienceYears,
              gender: teacher.gender,
              headline: teacher.headline ?? "",
              introVideoUrl: teacher.introVideoUrl ?? "",
              isMarketplaceVisible: teacher.isMarketplaceVisible,
              lessonPriceUah: teacher.lessonPriceUah,
              profilePhotoPositionX: teacher.profilePhotoPositionX,
              profilePhotoPositionY: teacher.profilePhotoPositionY,
              profilePhotoUrl: teacher.profilePhotoUrl ?? "",
              specialties,
              teachingLanguages: teacher.teachingLanguages.length ? teacher.teachingLanguages : ["English"],
              teachingStyle: style,
            }}
          />
        </Panel>

        <Panel title="Как это увидит ученик">
          <div className="teacher-market-card preview">
            <div className="teacher-market-photo">
              {teacher.profilePhotoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  alt={teacher.fullName}
                  src={teacher.profilePhotoUrl}
                  style={{ objectPosition: `${teacher.profilePhotoPositionX}% ${teacher.profilePhotoPositionY}%` }}
                />
              ) : (
                <span>{getInitials(teacher.fullName)}</span>
              )}
            </div>
            <div className="teacher-market-info">
              <span className="teacher-market-rating">★ {teacher.ratingAverage.toFixed(1)} · {teacher.ratingCount || "новый"} отзывов</span>
              <h3>{teacher.fullName}</h3>
              <p>{teacher.headline ?? "Преподаватель NeoSchool"}</p>
              <strong>{teacher.lessonPriceUah} грн / урок</strong>
              <div className="teacher-market-tags">
                {(teacher.specialties.length ? teacher.specialties : ["разговорная практика", "индивидуальный подход"]).slice(0, 4).map((item) => (
                  <span key={item}>{item}</span>
                ))}
              </div>
            </div>
          </div>
        </Panel>
      </div>
    </DashboardShell>
  );
}
