import type { AuthSession } from "../auth/session";
import type { Permission, PermissionContext } from "./types";

const adminEmails = new Set(["meetwudi@gmail.com"]);

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function isAdminSession(session: AuthSession) {
  return adminEmails.has(normalizeEmail(session.email));
}

export function can(permission: Permission, context: PermissionContext) {
  switch (permission) {
    case "admin:access":
    case "avatar-style:manage":
    case "push:test":
      return isAdminSession(context.session);
    default:
      return false;
  }
}

export function requirePermission(
  permission: Permission,
  context: PermissionContext,
) {
  if (!can(permission, context)) {
    throw new Error("permission_denied");
  }
}
