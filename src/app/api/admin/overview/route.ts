import { NextResponse } from "next/server";
import { db } from "@/server/db";

export async function GET() {
  const [students, teachers, scheduledLessons] = await Promise.all([
    db.studentProfile.count(),
    db.teacherProfile.count(),
    db.lesson.count({
      where: {
        status: "SCHEDULED",
      },
    }),
  ]);

  return NextResponse.json({
    scheduledLessons,
    students,
    teachers,
    updatedAt: new Date().toISOString(),
  });
}
