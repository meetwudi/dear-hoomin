import { redirect } from "next/navigation";
import { signOut } from "./actions";
import { getSession } from "../lib/auth/session";

export default async function Home() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  const displayName = session.name ?? session.email ?? "signed-in hoomin";

  return (
    <main className="home-shell">
      <header className="session-bar">
        <p>{displayName}</p>
        <form action={signOut}>
          <button className="text-button" type="submit">
            Sign out
          </button>
        </form>
      </header>
      <section className="thought-card" aria-labelledby="today-heading">
        <p className="eyebrow">Dear Hoomin</p>
        <h1 id="today-heading">today i protected the couch from silence.</h1>
        <p className="supporting-copy">
          A tiny daily thought from the pet who definitely runs the house.
        </p>
      </section>
    </main>
  );
}
