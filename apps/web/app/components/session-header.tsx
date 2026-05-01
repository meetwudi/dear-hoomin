import { signOut } from "../actions";
import type { AuthSession } from "../../lib/auth/session";
import { isAdminSession } from "../../lib/permissions";
import { AddToHomeScreen } from "./add-to-home-screen";

export function SessionHeader({ session }: { session: AuthSession }) {
  const displayName = session.name ?? session.email ?? "signed-in hoomin";
  const canAccessAdmin = isAdminSession(session);

  return (
    <header className="session-bar">
      <p>{displayName}</p>
      <a className="text-button" href="/">
        Home
      </a>
      {canAccessAdmin ? (
        <a className="text-button" href="/admin">
          Admin
        </a>
      ) : null}
      <AddToHomeScreen />
      <form action={signOut}>
        <button className="text-button" type="submit">
          Sign out
        </button>
      </form>
    </header>
  );
}
