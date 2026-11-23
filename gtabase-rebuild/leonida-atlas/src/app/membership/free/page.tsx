import type { Metadata } from "next";
import { AccountsNotice } from "@/components/content/AccountsNotice";

export const metadata: Metadata = {
  title: "Join Leonida Atlas — GTA 6 accounts are coming later | Leonida Atlas",
};

/** "Join" page (section 0.1 row 34): the accounts-later notice. */
export default function Page() {
  return <AccountsNotice heading="Join Leonida Atlas" crumb="Join" />;
}
