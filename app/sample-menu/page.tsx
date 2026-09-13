import ExampleMenuPage, { generateMetadata as buildMetadata } from "@/app/ornek-menu/page";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  return buildMetadata();
}

export default function SampleMenuAliasPage() {
  return <ExampleMenuPage />;
}
