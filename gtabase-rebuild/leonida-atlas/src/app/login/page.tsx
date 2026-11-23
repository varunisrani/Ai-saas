import type { Metadata } from "next";
import { AccountsNotice } from "@/components/content/AccountsNotice";

export const metadata: Metadata = {
  title: "Sign in — GTA 6 accounts are coming later | Leonida Atlas",
};

/** Sign-in page (R-306, R-1411): the accounts-later notice, no form. */
export default function Page() {
  return <AccountsNotice heading="Sign in to Leonida Atlas" crumb="Sign in" />;
}
