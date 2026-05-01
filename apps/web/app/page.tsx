import { redirect } from "next/navigation";
import { SessionHeader } from "./components/session-header";
import { getSession } from "../lib/auth/session";
import { listFamiliesForHoomin } from "../lib/families/store";
import { createFamilyAction } from "./families/actions";

export default async function Home() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  const families = await listFamiliesForHoomin(session.hoominId);

  if (families.length > 0) {
    redirect(`/families/${families[0].id}`);
  }

  return (
    <main className="app-shell">
      <SessionHeader session={session} />
      <section className="app-panel" aria-labelledby="first-family-heading">
        <p className="eyebrow">Dear Hoomin</p>
        <h1 id="first-family-heading">start with your family.</h1>
        <p className="supporting-copy">
          Create a family for the hoomins who share this pet ritual.
        </p>
        <form action={createFamilyAction} className="stacked-form">
          <label>
            Family name
            <input
              maxLength={100}
              name="name"
              placeholder="Mochi's household"
              required
            />
          </label>
          <button className="primary-button" type="submit">
            Create family
          </button>
        </form>
      </section>
    </main>
  );
}
