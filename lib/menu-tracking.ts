export const menuTrafficSources = [
  "qr",
  "direct",
  "instagram",
  "google",
  "facebook",
  "whatsapp",
  "other",
  "unknown",
] as const;
export type MenuTrafficSource = (typeof menuTrafficSources)[number];

export const trackedMenuDeviceTypes = ["mobile", "tablet", "desktop", "unknown"] as const;
export type TrackedMenuDeviceType = (typeof trackedMenuDeviceTypes)[number];
export type MenuDeviceType = TrackedMenuDeviceType | "bot";

export const menuViewLanguages = ["tr", "en", "unknown"] as const;
export type MenuViewLanguage = (typeof menuViewLanguages)[number];

export type MenuViewContext = {
  deviceType: MenuDeviceType;
  language: MenuViewLanguage;
  source: MenuTrafficSource;
};

export type ExplicitMenuTrafficSource = "qr" | "instagram" | "google" | "facebook" | "whatsapp";

const explicitSources = new Set<ExplicitMenuTrafficSource>([
  "qr",
  "instagram",
  "google",
  "facebook",
  "whatsapp",
]);

export function buildMenuTrafficUrl(
  menuUrl: string,
  source: ExplicitMenuTrafficSource,
) {
  if (!menuUrl) return "";

  try {
    const trackedUrl = new URL(menuUrl);
    trackedUrl.searchParams.set("src", source);
    return trackedUrl.toString();
  } catch {
    const separator = menuUrl.includes("?") ? "&" : "?";
    return `${menuUrl}${separator}src=${source}`;
  }
}

function matchesDomain(hostname: string, domain: string) {
  return hostname === domain || hostname.endsWith(`.${domain}`);
}

export function resolveMenuTrafficSource(
  sourceParameter: string | null | undefined,
  referrer: string | null,
  currentHost: string | null,
): MenuTrafficSource {
  const explicitSource = sourceParameter?.trim().toLocaleLowerCase("en-US") as ExplicitMenuTrafficSource;
  if (explicitSources.has(explicitSource)) return explicitSource;
  if (!referrer) return "direct";

  try {
    const hostname = new URL(referrer).hostname.toLocaleLowerCase("en-US");
    const ownHostname = currentHost
      ? (currentHost.startsWith("[")
          ? currentHost.slice(1, currentHost.indexOf("]"))
          : currentHost.split(":")[0]
        ).toLocaleLowerCase("en-US")
      : "";
    if (ownHostname && hostname === ownHostname) return "direct";
    if (matchesDomain(hostname, "instagram.com")) return "instagram";
    if (
      matchesDomain(hostname, "google.com") ||
      hostname.startsWith("google.") ||
      hostname.includes(".google.")
    ) return "google";
    if (
      matchesDomain(hostname, "facebook.com") ||
      matchesDomain(hostname, "fb.com") ||
      matchesDomain(hostname, "fb.me")
    ) return "facebook";
    if (matchesDomain(hostname, "whatsapp.com") || matchesDomain(hostname, "wa.me")) {
      return "whatsapp";
    }
    return "other";
  } catch {
    return "other";
  }
}

export function resolveMenuDeviceType(
  userAgent: string | null,
  mobileClientHint: string | null,
): MenuDeviceType {
  if (!userAgent) return mobileClientHint === "?1" ? "mobile" : "unknown";
  if (
    /bot|crawler|spider|slurp|facebookexternalhit|facebot|telegrambot|discordbot|twitterbot|linkedinbot|google-inspectiontool|lighthouse|headlesschrome/i
      .test(userAgent)
  ) return "bot";
  if (/ipad|tablet|playbook|silk|(android(?!.*mobile))/i.test(userAgent)) return "tablet";
  if (mobileClientHint === "?1" || /mobi|iphone|ipod|android|windows phone/i.test(userAgent)) {
    return "mobile";
  }
  return "desktop";
}
