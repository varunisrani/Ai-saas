import { ListPageShell, listPageMetadata } from "@/components/lists/ListPageShell";

export const metadata = listPageMetadata("vehicles");

export default function VehiclesListPage() {
  return <ListPageShell list="vehicles" />;
}
