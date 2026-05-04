import { redirect } from "next/navigation";
import { SessionHeader } from "../../components/session-header";
import { getSession } from "../../../lib/auth/session";
import { getInviteForHoomin } from "../../../lib/families/store";
import { productCopy } from "../../../lib/product-copy";
import { acceptFamilyInviteAction } from "../../families/actions";

type InvitePageProps = {
  params: Promise<{
    token: string;
  }>;
};

export default async function InvitePage({ params }: InvitePageProps) {
  const { token } = await params;
  const session = await getSession();

  if (!session) {
    redirect(`/login?next=/invite/${token}`);
  }

  const invite = await getInviteForHoomin(token, session.hoominId);

  if (!invite) {
    return (
      <main className="app-shell">
        <SessionHeader session={session} />
        <section className="app-panel">
          <p className="eyebrow">{productCopy.invite.eyebrow}</p>
          <h1>{productCopy.invite.missingHeading}</h1>
          <p className="supporting-copy">{productCopy.invite.missingIntro}</p>
        </section>
      </main>
    );
  }

  const expired = invite.expiresAt ? invite.expiresAt < new Date() : false;

  return (
    <main className="app-shell">
      <SessionHeader session={session} />
      <section className="app-panel" aria-labelledby="invite-heading">
        <p className="eyebrow">{productCopy.invite.eyebrow}</p>
        <h1 id="invite-heading">{productCopy.invite.heading(invite.familyName)}</h1>
        <p className="supporting-copy">
          {productCopy.invite.memberCount(invite.memberCount)}
        </p>

        {invite.isMember ? (
          <a className="primary-link" href={`/families/${invite.familyId}`}>
            {productCopy.invite.openFamilyLink}
          </a>
        ) : expired ? (
          <p className="auth-error">{productCopy.invite.expiredError}</p>
        ) : (
          <form action={acceptFamilyInviteAction}>
            <input name="inviteToken" type="hidden" value={invite.inviteToken} />
            <button className="primary-button" type="submit">
              {productCopy.invite.joinButton}
            </button>
          </form>
        )}
      </section>
    </main>
  );
}
