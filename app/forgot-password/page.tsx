import { redirect } from "next/navigation";
import { PasswordRecoveryScreen } from "@/components/PasswordRecoveryScreen";
import { getCurrentUser } from "@/lib/auth";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { robots: { follow: false, index: false } };

export default async function ForgotPasswordPage() {
  if (await getCurrentUser()) redirect("/dashboard/settings");
  return <PasswordRecoveryScreen mode="request" />;
}
