import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const users = [
  {
    email: "teacher@neoschool.local",
    profileId: "T00001",
    fullName: "Анна Белова",
    role: "TEACHER",
  },
  {
    email: "student@neoschool.local",
    profileId: "S00001",
    fullName: "Марк Волков",
    role: "STUDENT",
  },
  {
    email: "student2@neoschool.local",
    profileId: "S00002",
    fullName: "Ирина Коваль",
    role: "STUDENT",
  },
];

function getLessonStartDate({ day, month, start, week }) {
  const firstDayOfMonth = new Date(Date.UTC(2026, month, 1));
  const mondayOffset = (firstDayOfMonth.getUTCDay() + 6) % 7;
  const date = 1 - mondayOffset + week * 7 + day;

  return new Date(Date.UTC(2026, month, date, start, 0, 0, 0));
}

async function upsertUsers() {
  for (const item of users) {
    const user = await prisma.user.upsert({
      create: {
        email: item.email,
        role: item.role,
      },
      update: {
        role: item.role,
      },
      where: {
        email: item.email,
      },
    });

    if (item.role === "TEACHER") {
      await prisma.teacherProfile.upsert({
        create: {
          id: item.profileId,
          fullName: item.fullName,
          userId: user.id,
        },
        update: {
          fullName: item.fullName,
        },
        where: {
          id: item.profileId,
        },
      });
    }

    if (item.role === "STUDENT") {
      await prisma.studentProfile.upsert({
        create: {
          id: item.profileId,
          fullName: item.fullName,
          level: item.profileId === "S00001" ? "B1" : "A2",
          targetLanguage: "English",
          userId: user.id,
        },
        update: {
          fullName: item.fullName,
          targetLanguage: "English",
        },
        where: {
          id: item.profileId,
        },
      });
    }
  }
}

async function upsertLesson({ day, id, month, start, studentId, topic, week }) {
  const startsAt = getLessonStartDate({ day, month, start, week });
  const endsAt = new Date(startsAt);
  endsAt.setUTCHours(startsAt.getUTCHours() + 1);

  await prisma.lesson.upsert({
    create: {
      endsAt,
      id,
      startsAt,
      studentId,
      teacherId: "T00001",
      topic,
    },
    update: {
      endsAt,
      startsAt,
      studentId,
      teacherId: "T00001",
      topic,
    },
    where: {
      id,
    },
  });
}

async function main() {
  await upsertUsers();

  await upsertLesson({
    day: 3,
    id: "lesson-demo-1",
    month: 4,
    start: 18,
    studentId: "S00001",
    topic: "Travel speaking + modal verbs",
    week: 3,
  });

  await upsertLesson({
    day: 2,
    id: "lesson-demo-2",
    month: 4,
    start: 17,
    studentId: "S00002",
    topic: "Listening practice + daily routines",
    week: 3,
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
