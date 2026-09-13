import { redirect } from "next/navigation";
import { MenuStudio } from "@/components/MenuStudio";
import { getCurrentUser } from "@/lib/auth";
import { getLocalizedAppPath } from "@/lib/i18n";
import { getRequestLocale } from "@/lib/i18n-server";

export const dynamic = "force-dynamic";

export default async function StudioPage({
  searchParams,
}: {
  searchParams: Promise<{ new?: string | string[] }>;
}) {
  const [user, locale] = await Promise.all([getCurrentUser(), getRequestLocale()]);
  if (!user) redirect(`${getLocalizedAppPath(locale, "login")}?next=%2Fstudio%3Fnew%3D1`);
  const params = await searchParams;
  if (params.new === "1" && !user.account.canCreateMenu) {
    redirect("/dashboard/settings");
  }
  return <MenuStudio workspaceMode initialUser={user} />;
}
