import { ok } from "@/server/responses";

export async function GET() {
  return ok({
    name: "School OS API",
    status: "ok",
    version: "0.1.0",
  });
}
