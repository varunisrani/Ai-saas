import type { Metadata } from "next";
import { CheatPage, cheatMetadata } from "@/components/content/CheatPage";

export const metadata: Metadata = cheatMetadata("ps5");

/** Cheat page (R-1009..R-1012). */
export default function Page() {
  return <CheatPage platform="ps5" />;
}
