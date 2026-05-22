import { NextResponse } from "next/server";
import { db } from "@/server/db";

export async function GET() {
  const students = await db.studentProfile.findMany({
    orderBy: {
      id: "asc",
    },
    select: {
      fullName: true,
      id: true,
    },
  });

  return NextResponse.json({ students });
}
