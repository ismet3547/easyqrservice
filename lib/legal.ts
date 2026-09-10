export const legalDocumentVersion = "2026-09-10";
export const legalDocumentDateLabel = "10 Eylül 2026";
const defaultPublicOrigin = "https://easyqrservice.com";

type LegalConfig = {
  address: string;
  contactEmail: string;
  entityName: string;
  missingFields: string[];
};

function readValue(name: string, label: string, missingFields: string[]) {
  const value = process.env[name]?.trim();
  if (value) return value;
  missingFields.push(label);
  return `${label} canlı ortamda yapılandırılacak`;
}

export function getLegalConfig(): LegalConfig {
  const missingFields: string[] = [];
  return {
    entityName: readValue("LEGAL_ENTITY_NAME", "Veri sorumlusu unvanı", missingFields),
    contactEmail: readValue("LEGAL_CONTACT_EMAIL", "İletişim e-postası", missingFields),
    address: readValue("LEGAL_ADDRESS", "Tebligat adresi", missingFields),
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
