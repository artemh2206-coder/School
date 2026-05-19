import { ok } from "@/server/responses";
import { db } from "@/server/db";

export async function GET() {
  await db.$queryRaw`SELECT 1`;

  return ok({
    database: "ok",
    name: "NeoSchool API",
    status: "ok",
    version: "0.1.0",
  });
}
