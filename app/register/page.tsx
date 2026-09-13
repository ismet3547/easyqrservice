import { Suspense } from "react";
import { redirect } from "next/navigation";
import { AuthScreen } from "@/components/AuthScreen";
import { getCurrentUser } from "@/lib/auth";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { robots: { follow: false, index: false } };

export default async function RegisterPage() {
  if (await getCurrentUser()) redirect("/");
  return <Suspense><AuthScreen mode="register" /></Suspense>;
}
