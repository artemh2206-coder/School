import { NextResponse } from "next/server";
import { ZodError } from "zod";

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json({ data }, init);
}

export function fail(message: string, status = 400) {
  return NextResponse.json({ error: { message } }, { status });
}

export function handleApiError(error: unknown) {
  if (error instanceof ZodError) {
    return NextResponse.json(
      { error: { message: "Validation failed", issues: error.issues } },
      { status: 422 },
    );
  }

  if (error instanceof Error) {
    return fail(error.message, 400);
  }

  return fail("Unexpected error", 500);
}
