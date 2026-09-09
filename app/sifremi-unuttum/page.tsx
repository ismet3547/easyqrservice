import { redirect } from "next/navigation";
import { PasswordRecoveryScreen } from "@/components/PasswordRecoveryScreen";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function ForgotPasswordPage() {
  if (await getCurrentUser()) redirect("/dashboard/settings");
  return <PasswordRecoveryScreen mode="request" />;
}
