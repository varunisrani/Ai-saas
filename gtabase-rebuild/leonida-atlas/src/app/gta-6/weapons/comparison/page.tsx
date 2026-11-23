import { ComparisonRoute } from "@/components/compare/comparison-route";
import { comparisonMetadata } from "@/components/compare/ComparisonView";

export const metadata = comparisonMetadata("weapon");

export default function WeaponComparisonPage(props: PageProps<"/gta-6/weapons/comparison">) {
  return <ComparisonRoute type="weapon" searchParams={props.searchParams} />;
}
