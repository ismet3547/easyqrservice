"use client";

import { Languages, Loader2 } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  appLocales,
  appLocaleMetadata,
  getLocalizedCounterpartPath,
  type AppLocale,
} from "@/lib/i18n";
import { useAppLocale } from "@/components/LocaleProvider";

export function LocaleSwitcher({ compact = false }: { compact?: boolean }) {
  const router = useRouter();
  const pathname = usePathname();
  const { locale } = useAppLocale();
  const [pendingLocale, setPendingLocale] = useState<AppLocale | null>(null);

  const changeLocale = async (nextLocale: AppLocale) => {
    if (nextLocale === locale || pendingLocale) return;
    setPendingLocale(nextLocale);
    try {
      const response = await fetch("/api/locale", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locale: nextLocale }),
      });
      if (!response.ok) throw new Error("Locale update failed.");
      const localizedPath = getLocalizedCounterpartPath(pathname, nextLocale);
      if (localizedPath && localizedPath !== pathname) {
        router.replace(`${localizedPath}${window.location.search}${window.location.hash}`);
      } else {
        router.refresh();
      }
    } finally {
      setPendingLocale(null);
    }
  };

  return (
    <div className={`locale-switcher ${compact ? "compact" : ""}`} role="group" aria-label={locale === "tr" ? "Uygulama dili" : "Application language"}>
      {!compact && <Languages aria-hidden="true" size={15} />}
      {appLocales.map((option) => (
        <button
          aria-pressed={locale === option}
          className={locale === option ? "active" : ""}
          disabled={pendingLocale !== null}
          key={option}
          onClick={() => void changeLocale(option)}
          title={appLocaleMetadata[option].label}
          type="button"
        >
          {pendingLocale === option
            ? <Loader2 aria-hidden="true" className="spin" size={12} />
            : appLocaleMetadata[option].shortLabel}
        </button>
      ))}
    </div>
  );
}
