"use client";

import { Coins, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { useAppLocale } from "@/components/LocaleProvider";

type CreditResponse = {
  credits?: {
    balance: number;
    costs: {
      themeDesign: number;
    };
  };
};

export function AICreditBadge({ compact = false }: { compact?: boolean }) {
  const { locale, number } = useAppLocale();
  const t = (english: string, turkish: string) => locale === "tr" ? turkish : english;
  const [credits, setCredits] = useState<CreditResponse["credits"]>();
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    const loadCredits = async () => {
      try {
        const response = await fetch("/api/ai-credits", {
          cache: "no-store",
          signal: controller.signal,
        });
        const result = (await response.json()) as CreditResponse;
        if (!response.ok || !result.credits) throw new Error("Credit balance unavailable.");
        setCredits(result.credits);
      } catch (error) {
        if ((error as Error).name !== "AbortError") setFailed(true);
      }
    };

    void loadCredits();
    return () => controller.abort();
  }, []);

  const balance = credits?.balance;
  const title = failed
    ? t("AI credit information is currently unavailable", "AI kredi bilgisi şu anda alınamıyor")
    : balance === undefined
      ? t("Loading AI credit balance", "AI kredi bakiyesi yükleniyor")
      : t(`${number(balance)} AI credits`, `${number(balance)} AI kredisi`);

  return (
    <div
      className={`ai-credit-badge ${compact ? "compact" : ""} ${failed ? "is-error" : ""}`}
      aria-busy={balance === undefined && !failed}
      aria-label={title}
      aria-live="polite"
      title={title}
    >
      <span className="ai-credit-icon"><Coins size={compact ? 15 : 18} /></span>
      <div>
        <small>{t("AI balance", "AI bakiyesi")}</small>
        <strong>{balance === undefined ? "—" : number(balance)}<em> {t("credits", "kredi")}</em></strong>
      </div>
      {!compact && (
        <span className="ai-credit-cost"><Sparkles size={12} /> {credits ? t(`Custom design ${number(credits.costs.themeDesign)} credits`, `Özel tasarım ${number(credits.costs.themeDesign)} kredi`) : failed ? t("Try again later", "Tekrar deneyebilirsin") : t("Preparing balance", "Bakiye hazırlanıyor")}</span>
      )}
    </div>
  );
}
