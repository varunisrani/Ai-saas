import { ComparisonRoute } from "@/components/compare/comparison-route";
import { comparisonMetadata } from "@/components/compare/ComparisonView";

export const metadata = comparisonMetadata("vehicle");

export default function VehicleComparisonPage(props: PageProps<"/gta-6/vehicles/comparison">) {
  return <ComparisonRoute type="vehicle" searchParams={props.searchParams} />;
}
