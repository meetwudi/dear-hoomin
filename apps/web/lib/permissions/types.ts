import type { AuthSession } from "../auth/session";

export type Permission =
  | "admin:access"
  | "avatar-style:manage"
  | "cron:trigger"
  | "push:test";

export type PermissionContext = {
  session: AuthSession;
};
