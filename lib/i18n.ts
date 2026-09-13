export const appLocales = ["en", "tr"] as const;

export type AppLocale = (typeof appLocales)[number];

export const defaultAppLocale: AppLocale = "en";
export const appLocaleCookieName = "easyqr-locale";

export const localizedAppPaths = {
  cookies: { en: "/cookies", tr: "/cerez-politikasi" },
  forgotPassword: { en: "/forgot-password", tr: "/sifremi-unuttum" },
  login: { en: "/login", tr: "/giris" },
  privacy: { en: "/privacy", tr: "/gizlilik" },
  register: { en: "/register", tr: "/kayit" },
  resetPassword: { en: "/reset-password", tr: "/sifre-sifirla" },
  sampleMenu: { en: "/sample-menu", tr: "/ornek-menu" },
  terms: { en: "/terms", tr: "/kullanim-kosullari" },
} as const;

export type LocalizedAppPathKey = keyof typeof localizedAppPaths;

export const appLocaleMetadata: Record<
  AppLocale,
  { htmlLang: string; intlLocale: string; label: string; shortLabel: string }
> = {
  en: {
    htmlLang: "en",
    intlLocale: "en-US",
    label: "English",
    shortLabel: "EN",
  },
  tr: {
    htmlLang: "tr",
    intlLocale: "tr-TR",
    label: "Türkçe",
    shortLabel: "TR",
  },
};

export function isAppLocale(value: unknown): value is AppLocale {
  return typeof value === "string" && appLocales.includes(value as AppLocale);
}

export function resolveAppLocale(value: unknown): AppLocale {
  return isAppLocale(value) ? value : defaultAppLocale;
}

export function resolveAcceptLanguage(value: string | null | undefined): AppLocale {
  if (!value) return defaultAppLocale;

  const candidates = value
    .split(",")
    .map((entry, index) => {
      const [language = "", ...parameters] = entry.trim().split(";");
      const qualityValue = parameters
        .map((parameter) => parameter.trim())
        .find((parameter) => parameter.startsWith("q="))
        ?.slice(2);
      const parsedQuality = qualityValue === undefined ? 1 : Number.parseFloat(qualityValue);
      return {
        index,
        language: language.toLocaleLowerCase("en-US"),
        quality: Number.isFinite(parsedQuality) ? parsedQuality : 0,
      };
    })
    .filter((entry) => entry.language && entry.language !== "*" && entry.quality > 0)
    .sort((left, right) => right.quality - left.quality || left.index - right.index);

  for (const candidate of candidates) {
    const baseLanguage = candidate.language.split("-")[0];
    if (isAppLocale(baseLanguage)) return baseLanguage;
  }
  return defaultAppLocale;
}

export function resolveRequestLocale(request: Request): AppLocale {
  const cookieHeader = request.headers.get("cookie") || "";
  for (const entry of cookieHeader.split(";")) {
    const separatorIndex = entry.indexOf("=");
    if (separatorIndex < 0) continue;
    const name = entry.slice(0, separatorIndex).trim();
    if (name !== appLocaleCookieName) continue;
    const value = entry.slice(separatorIndex + 1).trim();
    if (isAppLocale(value)) return value;
  }
  return resolveAcceptLanguage(request.headers.get("accept-language"));
}

export function getIntlLocale(locale: AppLocale) {
  return appLocaleMetadata[locale].intlLocale;
}

export function getLocalizedAppPath(locale: AppLocale, key: LocalizedAppPathKey) {
  return localizedAppPaths[key][locale];
}

export function getAppLocaleFromPathname(pathname: string): AppLocale | null {
  const normalizedPathname = pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;
  for (const paths of Object.values(localizedAppPaths)) {
    if (paths.en === normalizedPathname) return "en";
    if (paths.tr === normalizedPathname) return "tr";
  }
  return null;
}

export function getLocalizedCounterpartPath(pathname: string, locale: AppLocale) {
  const normalizedPathname = pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;
  for (const paths of Object.values(localizedAppPaths)) {
    if (paths.en === normalizedPathname || paths.tr === normalizedPathname) return paths[locale];
  }
  return null;
}

export function formatAppNumber(locale: AppLocale, value: number, options?: Intl.NumberFormatOptions) {
  return new Intl.NumberFormat(getIntlLocale(locale), options).format(value);
}

export function formatAppDate(
  locale: AppLocale,
  value: Date | string | number,
  options?: Intl.DateTimeFormatOptions,
) {
  const date = value instanceof Date ? value : new Date(value);
  return new Intl.DateTimeFormat(getIntlLocale(locale), options).format(date);
}

export function localize<Value>(locale: AppLocale, values: Record<AppLocale, Value>) {
  return values[locale];
}
