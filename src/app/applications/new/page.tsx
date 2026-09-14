import { NewApplicationPage } from "./new-application-page";
import { requireCurrentUser } from "@/features/auth/require-current-user";

export default async function NewApplicationRoute() {
  const user = await requireCurrentUser("/applications/new");
  return <NewApplicationPage userLabel={user.displayName ?? user.email} />;
}
