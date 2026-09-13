import { MenuStudio } from "@/components/MenuStudio";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { alternates: { canonical: "/" } };

export default async function Home() {
  if (await getCurrentUser()) redirect("/dashboard");
  return <MenuStudio />;
}
