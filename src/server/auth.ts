import { cookies } from "next/headers";
import { cache } from "react";
import type { Role } from "@/core/roles";
import { isRole, roleHome } from "@/core/roles";

export type SessionUser = {
  id: string;
  email: string;
  role: Role;
  name: string;
};

const demoUsers: Record<Role, SessionUser> = {
  ADMIN: {
    id: "demo-admin",
    email: "admin@school.test",
    name: "Super Admin",
    role: "ADMIN",
  },
  STUDENT: {
    id: "demo-student",
    email: "student@school.test",
    name: "Марк Волков",
    role: "STUDENT",
  },
  TEACHER: {
    id: "demo-teacher",
    email: "teacher@school.test",
    name: "Анна Белова",
    role: "TEACHER",
  },
};

export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  const cookieStore = await cookies();
  const role = cookieStore.get("school_os_role")?.value;
  const participantId = cookieStore.get("school_os_participant_id")?.value;

  if (!isRole(role)) {
    return null;
  }

  return {
    ...demoUsers[role],
    id: participantId ?? demoUsers[role].id,
  };
});

export async function requireUser() {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error("Authentication required");
  }

  return user;
}

export async function requireRole(role: Role) {
  const user = await requireUser();

  if (user.role !== role) {
    throw new Error(`Expected role ${role}, received ${user.role}`);
  }

  return user;
}

export function getRoleHome(role: Role) {
  return roleHome[role];
}
