import type { Role } from "./roles";

export type Permission =
  | "student:read-own"
  | "student:manage-own"
  | "teacher:read-own"
  | "teacher:manage-own"
  | "teacher:manage-materials"
  | "admin:manage-users"
  | "admin:manage-finance"
  | "admin:manage-platform"
  | "admin:read-logs";

const permissionsByRole: Record<Role, Permission[]> = {
  STUDENT: ["student:read-own", "student:manage-own"],
  TEACHER: ["teacher:read-own", "teacher:manage-own", "teacher:manage-materials"],
  ADMIN: [
    "admin:manage-users",
    "admin:manage-finance",
    "admin:manage-platform",
    "admin:read-logs",
    "student:read-own",
    "teacher:read-own",
  ],
};

export function can(role: Role, permission: Permission) {
  return permissionsByRole[role].includes(permission);
}

export function assertPermission(role: Role, permission: Permission) {
  if (!can(role, permission)) {
    throw new Error(`Permission denied: ${permission}`);
  }
}
