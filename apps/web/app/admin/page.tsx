import { notFound, redirect } from "next/navigation";
import { SessionHeader } from "../components/session-header";
import { DailyGenerationTrigger } from "./daily-generation-trigger";
import { AdminPushTest } from "./push-test";
import { getSession } from "../../lib/auth/session";
import { can } from "../../lib/permissions";
import { getBaseAvatarStyleAsset } from "../../lib/pets/store";
import { uploadBaseAvatarStyleAction } from "./actions";

export default async function AdminPage() {
  const session = await getSession();

  if (!session) {
    redirect("/login?next=/admin");
  }

  if (!can("admin:access", { session })) {
    notFound();
  }

  const baseAvatarStyle = await getBaseAvatarStyleAsset();

  return (
    <main className="app-shell">
      <SessionHeader session={session} />
      <section className="app-panel" aria-labelledby="admin-heading">
        <div className="panel-heading">
          <p className="eyebrow">Admin</p>
          <h1 id="admin-heading">ops checks.</h1>
          <p className="supporting-copy">
            Run narrow production diagnostics without exposing them to regular users.
          </p>
        </div>

        <div className="section-block">
          <h2>Push notifications</h2>
          <AdminPushTest />
        </div>

        <div className="section-block">
          <h2>Daily generation</h2>
          <p className="supporting-copy compact-copy">
            Runs the same hourly cron logic now, including timezone and 6am checks.
          </p>
          <DailyGenerationTrigger />
        </div>

        <div className="section-block">
          <h2>Base avatar style</h2>
          <p className="supporting-copy compact-copy">
            This system image guides every pet avatar. Hoomins can tweak content,
            not the style.
          </p>
          {baseAvatarStyle ? (
            <div className="pet-card-media admin-preview">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img alt="Base avatar style" src={`/files/${baseAvatarStyle.object_key}`} />
            </div>
          ) : (
            <p className="admin-status">No base avatar style uploaded yet.</p>
          )}
          <form action={uploadBaseAvatarStyleAction} className="pet-form">
            <label>
              Style image
              <input
                accept="image/jpeg,image/png,image/webp"
                name="baseAvatarStyle"
                required
                type="file"
              />
            </label>
            <button className="primary-button" type="submit">
              Upload style
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
