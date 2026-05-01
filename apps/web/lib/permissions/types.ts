import type { AuthSession } from "../auth/session";

export type Permission = "admin:access" | "push:test" | "avatar-style:manage";

export type PermissionContext = {
  session: AuthSession;
};
