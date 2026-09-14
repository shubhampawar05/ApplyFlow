import { AppShell } from "@/components/app-shell";
import { requireCurrentUser } from "@/features/auth/require-current-user";

export default async function ApplicationDetailPage() {
  const user = await requireCurrentUser();

  return (
    <AppShell activePath="" userLabel={user.displayName ?? user.email}>
      <p className="eyebrow">Application</p>
      <h1>Application details will appear here.</h1>
      <p className="lede">This screen will become available when the reviewed application workflow is connected to persistence.</p>
    </AppShell>
  );
}
