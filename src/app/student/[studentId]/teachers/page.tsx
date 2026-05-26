import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { DashboardShell, Panel } from "@/components/DashboardShell";
import { getInitials } from "@/lib/platform-participants";
import { db } from "@/server/db";

export const dynamic = "force-dynamic";

function normalize(value: string | null | undefined) {
  return (value ?? "").trim().toLowerCase();
}

const languageOptions = [
  { label: "Английский", value: "english" },
  { label: "Польский", value: "polish" },
  { label: "Испанский", value: "spanish" },
  { label: "Немецкий", value: "german" },
];

const languageAliases: Record<string, string[]> = {
  english: ["english", "английский", "англ", "en"],
  polish: ["polish", "польский", "польська", "pl"],
  spanish: ["spanish", "испанский", "іспанська", "es"],
  german: ["german", "немецкий", "німецька", "de"],
};

function matchesLanguage(teacherLanguages: string[], selectedLanguage: string) {
  if (!selectedLanguage) return true;
  if (!teacherLanguages.length) return true;

  const aliases = languageAliases[selectedLanguage] ?? [selectedLanguage];
  return teacherLanguages.some((language) => {
    const normalized = normalize(language);
    return aliases.some((alias) => normalized.includes(alias));
  });
}

function getLanguageLabel(value: string) {
  return languageOptions.find((item) => item.value === value)?.label ?? "Все языки";
}

function getMatchScore(teacher: { specialties: string[]; teachingLanguages: string[]; teachingStyle: string[] }, targetLanguage: string | null) {
  let score = 72;
  const target = normalize(targetLanguage);
  const normalizedLanguages = teacher.teachingLanguages.map(normalize);

  if (target && normalizedLanguages.some((item) => item.includes(target) || target.includes(item))) score += 18;

  return Math.min(score, 98);
}

async function selectTeacher(studentId: string, formData: FormData) {
  "use server";

  const teacherId = String(formData.get("teacherId") ?? "");
  const teacher = await db.teacherProfile.findFirst({
    where: {
      id: teacherId,
      isMarketplaceVisible: true,
    },
  });

  if (!teacher) redirect(`/student/${studentId}/teachers`);

  await db.studentProfile.update({
    data: {
      preferredTeacherId: teacher.id,
    },
    where: {
      id: studentId,
    },
  });

  revalidatePath(`/student/${studentId}/dashboard`);
  revalidatePath(`/student/${studentId}/teacher`);
  redirect(`/student/${studentId}/teacher`);
}

export default async function StudentTeacherCatalogPage({
  params,
  searchParams,
}: {
  params: Promise<{ studentId: string }>;
  searchParams: Promise<{ gender?: string; language?: string }>;
}) {
  const { studentId } = await params;
  const filters = await searchParams;
  const student = await db.studentProfile.findUnique({
    include: {
      preferredTeacher: true,
    },
    where: { id: studentId },
  });
  if (!student) redirect("/student");

  const teachers = await db.teacherProfile.findMany({
    orderBy: [
      { ratingAverage: "desc" },
      { ratingCount: "desc" },
      { id: "asc" },
    ],
    where: {
      isMarketplaceVisible: true,
    },
  });
  const selectedLanguage =
    languageOptions.some((item) => item.value === filters.language)
      ? filters.language ?? ""
      : "";
  const selectedGender = filters.gender === "MALE" || filters.gender === "FEMALE" ? filters.gender : "all";
  const filteredTeachers = teachers
    .filter((teacher) => {
      return matchesLanguage(teacher.teachingLanguages, selectedLanguage);
    })
    .filter((teacher) => selectedGender === "all" || teacher.gender === selectedGender)
    .sort((left, right) => getMatchScore(right, selectedLanguage) - getMatchScore(left, selectedLanguage));
  const action = selectTeacher.bind(null, student.id);

  return (
    <DashboardShell
      nav={[
        { href: `/student/${student.id}/dashboard`, label: "Кабинет", description: "главная" },
        { href: `/student/${student.id}/lesson`, label: "Уроки", description: "список уроков" },
        { href: `/student/${student.id}/teacher`, label: "Мой учитель", description: "профиль учителя" },
        { href: "#schedule-modal", label: "Расписание", description: "календарь" },
      ]}
      profile={{
        id: student.id,
        initials: getInitials(student.fullName),
        name: student.fullName,
        status: student.preferredTeacher ? "Выбор нового учителя" : "Выбор учителя",
        meta: selectedLanguage ? `Каталог: ${getLanguageLabel(selectedLanguage)}` : "Каталог преподавателей",
      }}
      hideProfileCard
      logoutHref="/api/auth/logout"
      roleLabel="Кабинет ученика"
    >
      <Panel title={student.preferredTeacher ? "Сменить учителя" : "Выбрать учителя"}>
        <div className="teacher-catalog-intro">
          <div>
            <span>Подбор по языку</span>
            <strong>{selectedLanguage ? getLanguageLabel(selectedLanguage) : "Все языки"}</strong>
          </div>
          <div>
            <span>Текущий учитель</span>
            <strong>{student.preferredTeacher?.fullName ?? "Еще не выбран"}</strong>
          </div>
        </div>

        <form className="teacher-catalog-filters">
          <label>
            <span>Язык</span>
            <select name="language" defaultValue={selectedLanguage}>
              <option value="">Все языки</option>
              {languageOptions.map((language) => (
                <option key={language.value} value={language.value}>
                  {language.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>Пол учителя</span>
            <select name="gender" defaultValue={selectedGender}>
              <option value="all">Любой</option>
              <option value="FEMALE">Женщина</option>
              <option value="MALE">Мужчина</option>
            </select>
          </label>
          <button className="button primary" type="submit">
            Показать
          </button>
        </form>

        {filteredTeachers.length ? (
          <div className="teacher-market-grid">
            {filteredTeachers.map((teacher) => {
              const score = getMatchScore(teacher, selectedLanguage);
              const tags = [...teacher.teachingLanguages, ...teacher.specialties, ...teacher.teachingStyle].filter(Boolean).slice(0, 5);
              const isSelected = student.preferredTeacherId === teacher.id;

              return (
                <article className={`teacher-market-card ${isSelected ? "selected" : ""}`} key={teacher.id}>
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
                    <span className="teacher-market-rating">★ {teacher.ratingAverage.toFixed(1)} · {teacher.ratingCount || "новый"} отзывов · {score}% match</span>
                    <h3>{teacher.fullName}</h3>
                    <p>{teacher.headline ?? teacher.bio ?? "Преподаватель NeoSchool с индивидуальным подходом к урокам."}</p>
                    <strong>{teacher.lessonPriceUah} грн / урок</strong>
                    <div className="teacher-market-tags">
                      {(tags.length ? tags : ["индивидуально", "комфортный старт"]).map((item) => (
                        <span key={item}>{item}</span>
                      ))}
                    </div>
                    <div className="teacher-profile-actions">
                      {teacher.introVideoUrl ? (
                        <a className="button" href={teacher.introVideoUrl} rel="noreferrer" target="_blank">
                          Видео 30 сек
                        </a>
                      ) : null}
                      <form action={action}>
                        <input name="teacherId" type="hidden" value={teacher.id} />
                        <button className="button primary" disabled={isSelected} type="submit">
                          {isSelected ? "Выбран" : student.preferredTeacher ? "Сменить на этого" : "Выбрать"}
                        </button>
                      </form>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="empty-state">Пока нет учителей под выбранный язык. Попробуйте открыть каталог позже.</div>
        )}
      </Panel>
    </DashboardShell>
  );
}
