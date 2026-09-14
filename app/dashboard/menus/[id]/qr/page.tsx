import { notFound, redirect } from "next/navigation";
import { QrCenter } from "@/components/QrCenter";
import { getCurrentUser } from "@/lib/auth";
import { getLocalizedAppPath } from "@/lib/i18n";
import { getRequestLocale } from "@/lib/i18n-server";
import { getUserMenu, listUserMenus } from "@/lib/menus";
import { getQrCenterPath } from "@/lib/onboarding";

export const dynamic = "force-dynamic";

type QrCenterPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ onboarding?: string | string[] }>;
};

export default async function QrCenterPage({ params, searchParams }: QrCenterPageProps) {
  const [user, locale, { id }, query] = await Promise.all([getCurrentUser(), getRequestLocale(), params, searchParams]);
  const onboardingMode = query.onboarding === "1";
  if (!user) {
    const nextPath = getQrCenterPath(id, onboardingMode);
    redirect(`${getLocalizedAppPath(locale, "login")}?next=${encodeURIComponent(nextPath)}`);
  }

  const storedMenu = getUserMenu(user.id, id);
  if (!storedMenu) notFound();

  return (
    <QrCenter
      menuCount={listUserMenus(user.id).length}
      onboardingMode={onboardingMode}
      storedMenu={storedMenu}
      user={user}
    />
  );
}
