import { redirect } from "next/navigation";
import { SessionHeader } from "../../components/session-header";
import { getSession } from "../../../lib/auth/session";
import { getInviteForHoomin } from "../../../lib/families/store";
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
          <p className="eyebrow">Invite</p>
          <h1>this invite is missing.</h1>
          <p className="supporting-copy">
            Ask your family hoomin for a fresh invite link.
          </p>
        </section>
      </main>
    );
  }

  const expired = invite.expiresAt ? invite.expiresAt < new Date() : false;

  return (
    <main className="app-shell">
      <SessionHeader session={session} />
      <section className="app-panel" aria-labelledby="invite-heading">
        <p className="eyebrow">Invite</p>
        <h1 id="invite-heading">join {invite.familyName}?</h1>
        <p className="supporting-copy">
          {invite.memberCount} hoomin{invite.memberCount === 1 ? "" : "s"} are
          already here.
        </p>

        {invite.isMember ? (
          <a className="primary-link" href={`/families/${invite.familyId}`}>
            Open family
          </a>
        ) : expired ? (
          <p className="auth-error">This invite link has expired.</p>
        ) : (
          <form action={acceptFamilyInviteAction}>
            <input name="inviteToken" type="hidden" value={invite.inviteToken} />
            <button className="primary-button" type="submit">
              Join family
            </button>
          </form>
        )}
      </section>
    </main>
  );
}
