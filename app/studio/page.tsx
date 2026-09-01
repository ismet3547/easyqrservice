import { redirect } from "next/navigation";
import { MenuStudio } from "@/components/MenuStudio";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function StudioPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/giris?next=%2Fstudio%3Fnew%3D1");
  return <MenuStudio workspaceMode initialUser={user} />;
}
