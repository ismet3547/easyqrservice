"use client";

import { Coins, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";

type CreditResponse = {
  credits?: {
    balance: number;
    costs: {
      themeDesign: number;
    };
  };
};

export function AICreditBadge({ compact = false }: { compact?: boolean }) {
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
        if (!response.ok || !result.credits) throw new Error("Kredi bilgisi alınamadı.");
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
    ? "AI kredi bilgisi şu anda alınamıyor"
    : balance === undefined
      ? "AI kredi bakiyesi yükleniyor"
      : `${balance} AI kredisi`;

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
        <small>AI bakiyesi</small>
        <strong>{balance === undefined ? "—" : balance}<em> kredi</em></strong>
      </div>
      {!compact && (
        <span className="ai-credit-cost"><Sparkles size={12} /> {credits ? `Özel tasarım ${credits.costs.themeDesign} kredi` : failed ? "Tekrar deneyebilirsin" : "Bakiye hazırlanıyor"}</span>
      )}
    </div>
  );
}
