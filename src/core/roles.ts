export const roles = ["STUDENT", "TEACHER", "ADMIN"] as const;

export type Role = (typeof roles)[number];

export const roleHome: Record<Role, string> = {
  ADMIN: "/admin",
  STUDENT: "/student/dashboard",
  TEACHER: "/teacher/dashboard",
};

export function isRole(value: unknown): value is Role {
  return typeof value === "string" && roles.includes(value as Role);
}
