import { signOut } from "../actions";
import type { AuthSession } from "../../lib/auth/session";

export function SessionHeader({ session }: { session: AuthSession }) {
  const displayName = session.name ?? session.email ?? "signed-in hoomin";

  return (
    <header className="session-bar">
      <p>{displayName}</p>
      <form action={signOut}>
        <button className="text-button" type="submit">
          Sign out
        </button>
      </form>
    </header>
  );
}
