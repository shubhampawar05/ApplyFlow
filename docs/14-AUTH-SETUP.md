# Authentication Setup

ApplyFlow uses **Supabase Auth** with **Google** as the only MVP sign-in method.
Google OAuth client ID and client secret stay in the Supabase dashboard. They must never be added to this repository or to `.env`.

Application sessions are cookie-based (`@supabase/ssr`, PKCE). Next.js middleware refreshes the session and blocks unauthenticated access to application routes.

## Environment variables in this app

Copy these into `.env` from the Supabase project **Settings → API**:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` is accepted as an alias for the anon/publishable key.
Do not put the service-role key in this app.

Gmail send will use separate Google OAuth credentials in a later milestone. Those are not used for login.

## Supabase dashboard

1. Authentication → URL configuration
   - Site URL: `http://localhost:3000` for local development.
   - Redirect URLs: `http://localhost:3000/auth/callback` (add the production origin later).
2. Authentication → Providers → Google
   - Enable Google.
   - Paste the Web application **Client ID** and **Client secret** from Google Cloud.
   - Copy the callback URL shown on that page. It looks like `https://<project-ref>.supabase.co/auth/v1/callback`.

## Google Cloud

1. Create an OAuth client of type **Web application**.
2. Authorized JavaScript origins: `http://localhost:3000` (and the production origin later).
3. Authorized redirect URIs: **only** the Supabase callback URL from the previous section — not the Next.js `/auth/callback` route.
4. Scopes required for login: `openid`, `userinfo.email`, `userinfo.profile`.
   Do not add Gmail scopes here.

## Local database user

On successful Google sign-in, `/auth/callback` exchanges the PKCE code for a cookie session and upserts a `User` row keyed by `authUserId` (the Supabase Auth user id). Application data stays scoped to that row, not to a client-supplied id.
