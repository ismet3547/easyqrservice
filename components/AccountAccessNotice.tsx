"use client";

import { ArrowRight, Clock3, ShieldAlert } from "lucide-react";
import Link from "next/link";
import type { AccountAccess } from "@/lib/account-plan";
import { useAppLocale } from "@/components/LocaleProvider";

export function AccountAccessNotice({ account }: { account: AccountAccess }) {
  const { locale, number } = useAppLocale();
  const t = (english: string, turkish: string) => locale === "tr" ? turkish : english;
  const expired = account.status === "expired";
  const menuLimitReached = !expired && !account.canCreateMenu;
  if (!expired && account.plan === "pro" && !menuLimitReached) return null;

  return (
    <aside className={`account-access-notice ${expired ? "expired" : "active"}`}>
      <span>{expired ? <ShieldAlert size={19} /> : <Clock3 size={19} />}</span>
      <div>
        <strong>{expired
          ? account.plan === "trial" ? t("Your trial has ended", "Deneme süren sona erdi") : t("Your Pro access has ended", "Pro erişim süren sona erdi")
          : menuLimitReached ? t("You've reached your menu limit", "Menü sınırına ulaştın") : t(`${number(account.daysRemaining)} days left in your trial`, `Denemende ${number(account.daysRemaining)} gün kaldı`)}</strong>
        <p>{expired
          ? t("You can still edit menus and view your data. Activate Pro to create menus, use AI, and publish.", "Menülerini düzenleyebilir ve verilerini görebilirsin. Yeni menü, AI araçları ve yayınlama için Pro erişimini etkinleştir.")
          : menuLimitReached
            ? t(`You can keep managing your ${number(account.menuCount)} existing menus. Activate Pro to add another.`, `Mevcut ${number(account.menuCount)} menünü yönetmeye devam edebilirsin. Yeni menü için Pro erişimini etkinleştir.`)
            : t(`Your trial includes up to ${number(account.maxMenus)} menu, publishing, and AI tools.`, `Deneme planında ${number(account.maxMenus)} menü oluşturabilir, yayınlayabilir ve AI araçlarını kullanabilirsin.`)}</p>
      </div>
      <Link href="/dashboard/settings">{t("Plan details", "Plan ayrıntıları")} <ArrowRight size={15} /></Link>
    </aside>
  );
}
