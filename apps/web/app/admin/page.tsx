import { notFound, redirect } from "next/navigation";
import { SessionHeader } from "../components/session-header";
import { DailyGenerationTrigger } from "./daily-generation-trigger";
import { AdminPushTest } from "./push-test";
import { getSession } from "../../lib/auth/session";
import { can } from "../../lib/permissions";
import { getBaseAvatarStyleAsset } from "../../lib/pets/store";
import { productCopy } from "../../lib/product-copy";
import { imageUploadAccept } from "../../lib/uploads/images";
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
          <p className="eyebrow">{productCopy.admin.eyebrow}</p>
          <h1 id="admin-heading">{productCopy.admin.heading}</h1>
          <p className="supporting-copy">{productCopy.admin.intro}</p>
        </div>

        <div className="section-block">
          <h2>{productCopy.admin.pushHeading}</h2>
          <AdminPushTest />
        </div>

        <div className="section-block">
          <h2>{productCopy.admin.dailyGenerationHeading}</h2>
          <p className="supporting-copy compact-copy">
            {productCopy.admin.dailyGenerationIntro}
          </p>
          <DailyGenerationTrigger />
        </div>

        <div className="section-block">
          <h2>{productCopy.admin.baseAvatarStyleHeading}</h2>
          <p className="supporting-copy compact-copy">
            {productCopy.admin.baseAvatarStyleIntro}
          </p>
          {baseAvatarStyle ? (
            <div className="pet-card-media admin-preview">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                alt={productCopy.media.baseAvatarStyleAlt}
                src={`/files/${baseAvatarStyle.object_key}`}
              />
            </div>
          ) : (
            <p className="admin-status">{productCopy.admin.noBaseAvatarStyle}</p>
          )}
          <form action={uploadBaseAvatarStyleAction} className="pet-form">
            <label>
              {productCopy.admin.styleImageLabel}
              <input
                accept={imageUploadAccept}
                name="baseAvatarStyle"
                required
                type="file"
              />
            </label>
            <button className="primary-button" type="submit">
              {productCopy.admin.uploadStyleButton}
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
