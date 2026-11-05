import { RequireAuth } from "@/components/auth/require-auth";
import ProfilePage from "./page";

export const metadata = { title: "Your profile" };

// The profile is outside the signed-in shell, so it asks for a signed-in person itself.
export default function HostedProfilePage() {
  return (
    <RequireAuth>
      <ProfilePage />
    </RequireAuth>
  );
}
