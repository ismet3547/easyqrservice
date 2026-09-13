import CookiePolicyPage, { generateMetadata as buildMetadata } from "@/app/cerez-politikasi/page";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  return buildMetadata();
}

export default function CookiesAliasPage() {
  return <CookiePolicyPage />;
}
