import TermsPage, { generateMetadata as buildMetadata } from "@/app/kullanim-kosullari/page";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  return buildMetadata();
}

export default function TermsAliasPage() {
  return <TermsPage />;
}
