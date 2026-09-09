import { ArrowRight, Clock3, ShieldAlert } from "lucide-react";
import Link from "next/link";
import type { AccountAccess } from "@/lib/account-plan";

export function AccountAccessNotice({ account }: { account: AccountAccess }) {
  const expired = account.status === "expired";
  const menuLimitReached = !expired && !account.canCreateMenu;
  if (!expired && account.plan === "pro" && !menuLimitReached) return null;

  return (
    <aside className={`account-access-notice ${expired ? "expired" : "active"}`}>
      <span>{expired ? <ShieldAlert size={19} /> : <Clock3 size={19} />}</span>
      <div>
        <strong>{expired
          ? account.plan === "trial" ? "Deneme süren sona erdi" : "Pro erişim süren sona erdi"
          : menuLimitReached ? "Menü sınırına ulaştın" : `Denemende ${account.daysRemaining} gün kaldı`}</strong>
        <p>{expired
          ? "Menülerini düzenleyebilir ve verilerini görebilirsin. Yeni menü, AI araçları ve yayınlama için Pro erişimini etkinleştir."
          : menuLimitReached
            ? `Mevcut ${account.menuCount} menünü yönetmeye devam edebilirsin. Yeni menü için Pro erişimini etkinleştir.`
            : `Deneme planında ${account.maxMenus} menü oluşturabilir, yayınlayabilir ve AI araçlarını kullanabilirsin.`}</p>
      </div>
      <Link href="/dashboard/settings">Plan ayrıntıları <ArrowRight size={15} /></Link>
    </aside>
  );
}
