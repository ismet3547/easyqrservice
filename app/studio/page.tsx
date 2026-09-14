import { redirect } from "next/navigation";
import { MenuStudio } from "@/components/MenuStudio";
import { getCurrentUser } from "@/lib/auth";
import { getLocalizedAppPath } from "@/lib/i18n";
import { getRequestLocale } from "@/lib/i18n-server";

export const dynamic = "force-dynamic";

export default async function StudioPage({
  searchParams,
}: {
  searchParams: Promise<{
    menu?: string | string[];
    new?: string | string[];
    onboarding?: string | string[];
    publish?: string | string[];
  }>;
}) {
  const [user, locale, params] = await Promise.all([getCurrentUser(), getRequestLocale(), searchParams]);
  const onboardingMode = params.onboarding === "1";
  if (!user) {
    const nextParams = new URLSearchParams();
    if (typeof params.menu === "string") nextParams.set("menu", params.menu);
    else if (params.new === "1") nextParams.set("new", "1");
    if (onboardingMode) nextParams.set("onboarding", "1");
    if (params.publish === "1") nextParams.set("publish", "1");
    const nextPath = `/studio${nextParams.size ? `?${nextParams.toString()}` : ""}`;
    redirect(`${getLocalizedAppPath(locale, "login")}?next=${encodeURIComponent(nextPath)}`);
  }
  if (params.new === "1" && !user.account.canCreateMenu) {
    redirect("/dashboard/settings");
  }
  return (
    <MenuStudio
      workspaceMode
      initialOnboarding={onboardingMode}
      initialUser={user}
    />
  );
}
