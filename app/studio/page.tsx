import { redirect } from "next/navigation";
import { MenuStudio } from "@/components/MenuStudio";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function StudioPage({
  searchParams,
}: {
  searchParams: Promise<{ new?: string | string[] }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/giris?next=%2Fstudio%3Fnew%3D1");
  const params = await searchParams;
  if (params.new === "1" && !user.account.canCreateMenu) {
    redirect("/dashboard/settings");
  }
  return <MenuStudio workspaceMode initialUser={user} />;
}
