import { ListPageShell, listPageMetadata } from "@/components/lists/ListPageShell";

export const metadata = listPageMetadata("weapons");

export default function WeaponsListPage() {
  return <ListPageShell list="weapons" />;
}
