import { AppShell } from "@/components/app-shell";
import { requireCurrentUser } from "@/features/auth/require-current-user";

export default async function SettingsPage() {
  const user = await requireCurrentUser("/settings");

  return (
    <AppShell activePath="/settings" userLabel={user.displayName ?? user.email}>
      <p className="eyebrow">Settings</p>
      <h1>Set up your application profile.</h1>
      <p className="lede">You are signed in as {user.email}. Resume and Gmail connection controls will be added in a later milestone.</p>
    </AppShell>
  );
}
