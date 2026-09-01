import { MenuStudio } from "@/components/MenuStudio";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function Home() {
  if (await getCurrentUser()) redirect("/dashboard");
  return <MenuStudio />;
}
