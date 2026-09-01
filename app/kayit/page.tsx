import { Suspense } from "react";
import { redirect } from "next/navigation";
import { AuthScreen } from "@/components/AuthScreen";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function RegisterPage() {
  if (await getCurrentUser()) redirect("/");
  return <Suspense><AuthScreen mode="register" /></Suspense>;
}
