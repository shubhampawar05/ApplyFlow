-- Enable Row Level Security on all application tables.
-- ApplyFlow uses Prisma with a direct Postgres connection (postgres role), which bypasses RLS.
-- With RLS enabled and no permissive policies, Supabase PostgREST (anon/authenticated) cannot read or write rows.

ALTER TABLE "public"."_prisma_migrations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."Resume" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."ResumeProfile" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."Job" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."Application" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."GeneratedEmail" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."EmailDelivery" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."ApplicationEvent" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."OAuthConnection" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."AIRequest" ENABLE ROW LEVEL SECURITY;

-- Revoke direct table access from Supabase API roles.
REVOKE ALL ON TABLE "public"."_prisma_migrations" FROM anon, authenticated;
REVOKE ALL ON TABLE "public"."User" FROM anon, authenticated;
REVOKE ALL ON TABLE "public"."Resume" FROM anon, authenticated;
REVOKE ALL ON TABLE "public"."ResumeProfile" FROM anon, authenticated;
REVOKE ALL ON TABLE "public"."Job" FROM anon, authenticated;
REVOKE ALL ON TABLE "public"."Application" FROM anon, authenticated;
REVOKE ALL ON TABLE "public"."GeneratedEmail" FROM anon, authenticated;
REVOKE ALL ON TABLE "public"."EmailDelivery" FROM anon, authenticated;
REVOKE ALL ON TABLE "public"."ApplicationEvent" FROM anon, authenticated;
REVOKE ALL ON TABLE "public"."OAuthConnection" FROM anon, authenticated;
REVOKE ALL ON TABLE "public"."AIRequest" FROM anon, authenticated;
