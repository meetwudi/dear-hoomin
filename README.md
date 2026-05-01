# Dear Hoomin

Daily pet thoughts for hoomins.

Dear Hoomin is a mobile-friendly ritual app where families can see each pet's daily thought with a cute cartoon image.

The web app lives in `apps/web`.

Database schema and Supabase project files live in `infra/supabase/`.

For Vercel, set Root Directory to `apps/web`.

## Development

```sh
cd apps/web
npm install
cp .env.example .env.local
npm run dev
```

## Verification

```sh
cd apps/web
npm run typecheck
npm run build
npm audit --audit-level=moderate
```
