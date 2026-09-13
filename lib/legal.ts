import type { AppLocale } from "@/lib/i18n";

export const legalDocumentVersion = "2026-09-12";
export const legalDocumentDateLabel = "12 Eylül 2026";
const defaultPublicOrigin = "https://easyqrservice.com";

type LegalConfig = {
  address: string;
  contactEmail: string;
  contactEmailConfigured: boolean;
  entityName: string;
  missingFields: string[];
};

function readValue(name: string, label: string, missingFields: string[], locale: AppLocale) {
  const value = process.env[name]?.trim();
  if (value) return value;
  missingFields.push(label);
  return locale === "tr"
    ? `${label} canlı ortamda yapılandırılacak`
    : `${label} will be configured before launch`;
}

export function getLegalDocumentDateLabel(locale: AppLocale) {
  return locale === "tr" ? legalDocumentDateLabel : "September 12, 2026";
}

export function getLegalConfig(locale: AppLocale = "tr"): LegalConfig {
  const missingFields: string[] = [];
  const labels = locale === "tr"
    ? {
        address: "Tebligat adresi",
        contactEmail: "İletişim e-postası",
        entityName: "Veri sorumlusu unvanı",
      }
    : {
        address: "Legal notice address",
        contactEmail: "Contact email",
        entityName: "Legal entity name",
      };
  const contactEmail = readValue("LEGAL_CONTACT_EMAIL", labels.contactEmail, missingFields, locale);
  return {
    entityName: readValue("LEGAL_ENTITY_NAME", labels.entityName, missingFields, locale),
    contactEmail,
    contactEmailConfigured: !missingFields.includes(labels.contactEmail),
    address: readValue("LEGAL_ADDRESS", labels.address, missingFields, locale),
    missingFields,
  };
}

export function getPublicAppOrigin() {
  try {
    return new URL(process.env.APP_URL?.trim() || defaultPublicOrigin).origin;
  } catch {
    return defaultPublicOrigin;
  }
}
