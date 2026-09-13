import { PasswordRecoveryScreen } from "@/components/PasswordRecoveryScreen";
import type { Metadata } from "next";

export const metadata: Metadata = { robots: { follow: false, index: false } };

export default function ResetPasswordPage() {
  return <PasswordRecoveryScreen mode="reset" />;
}
