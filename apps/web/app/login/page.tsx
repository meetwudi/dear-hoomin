import { redirect } from "next/navigation";
import { signInWithGoogle } from "./actions";
import { getSession } from "../../lib/auth/session";

type LoginPageProps = {
  searchParams: Promise<{
    error?: string;
  }>;
};

const errorMessages: Record<string, string> = {
  "google-token-exchange-failed": "Google login did not finish. Try again.",
  "google-auth-failed": "Google login did not finish. Try again.",
  "missing-auth-code": "Google did not return a login code. Try again.",
  "missing-oauth-state": "Google login expired. Try again.",
  "invalid-oauth-state": "Google login could not be verified. Try again.",
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const session = await getSession();

  if (session) {
    redirect("/");
  }

  const { error } = await searchParams;
  const errorMessage = error ? errorMessages[error] ?? "Login failed." : null;

  return (
    <main className="auth-shell">
      <section className="auth-panel" aria-labelledby="login-heading">
        <p className="eyebrow">Dear Hoomin</p>
        <h1 id="login-heading">see today&apos;s tiny thought.</h1>
        <p className="supporting-copy">
          Sign in with Google to open your daily pet ritual.
        </p>
        <form action={signInWithGoogle}>
          <button className="google-button" type="submit">
            <span aria-hidden="true" className="google-mark">
              G
            </span>
            Continue with Google
          </button>
        </form>
        {errorMessage ? (
          <p className="auth-error" role="alert">
            {errorMessage}
          </p>
        ) : null}
      </section>
    </main>
  );
}
