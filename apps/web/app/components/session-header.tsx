import { signOut } from "../actions";
import type { AuthSession } from "../../lib/auth/session";
import { isAdminSession } from "../../lib/permissions";
import { AddToHomeScreen } from "./add-to-home-screen";
import { productCopy } from "../../lib/product-copy";

export function SessionHeader({ session }: { session: AuthSession }) {
  const displayName =
    session.name ?? session.email ?? productCopy.navigation.signedInFallback;
  const canAccessAdmin = isAdminSession(session);

  return (
    <header className="session-bar">
      <p>{displayName}</p>
      <a className="text-button" href="/">
        {productCopy.navigation.home}
      </a>
      {canAccessAdmin ? (
        <a className="text-button" href="/admin">
          {productCopy.navigation.admin}
        </a>
      ) : null}
      <AddToHomeScreen />
      <form action={signOut}>
        <button className="text-button" type="submit">
          {productCopy.navigation.signOut}
        </button>
      </form>
    </header>
  );
}
