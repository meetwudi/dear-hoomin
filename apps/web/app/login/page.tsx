import { redirect } from "next/navigation";
import { signInWithGoogle } from "./actions";
import { getSession } from "../../lib/auth/session";
import { productCopy } from "../../lib/product-copy";

type LoginPageProps = {
  searchParams: Promise<{
    error?: string;
    next?: string;
  }>;
};

const errorMessages: Record<string, string> = {
  "google-token-exchange-failed": productCopy.auth.errors.googleTokenExchangeFailed,
  "google-auth-failed": productCopy.auth.errors.googleAuthFailed,
  "missing-auth-code": productCopy.auth.errors.missingAuthCode,
  "missing-oauth-state": productCopy.auth.errors.missingOauthState,
  "invalid-oauth-state": productCopy.auth.errors.invalidOauthState,
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const session = await getSession();

  if (session) {
    redirect("/");
  }

  const { error, next } = await searchParams;
  const errorMessage =
    error ? errorMessages[error] ?? productCopy.auth.errors.fallback : null;
  const nextPath = next?.startsWith("/") ? next : "/";

  return (
    <main className="auth-shell">
      <section className="auth-panel" aria-labelledby="login-heading">
        <p className="eyebrow">{productCopy.auth.eyebrow}</p>
        <h1 id="login-heading">{productCopy.auth.heading}</h1>
        <p className="supporting-copy">{productCopy.auth.intro}</p>
        <form action={signInWithGoogle}>
          <input name="next" type="hidden" value={nextPath} />
          <button className="google-button" type="submit">
            <span aria-hidden="true" className="google-mark">
              G
            </span>
            {productCopy.auth.googleButton}
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
