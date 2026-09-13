import PrivacyPage, { generateMetadata as buildMetadata } from "@/app/gizlilik/page";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  return buildMetadata();
}

export default function PrivacyAliasPage() {
  return <PrivacyPage />;
}
