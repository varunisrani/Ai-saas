/**
 * Shared server logic of the two comparison routes (R-713, R-715): resolve the requested keys to the canonical
 * comparison (unknown and duplicate keys dropped, at most 4, plain string order). The request proxy already
 * redirects non-canonical URLs; this is the same rule as a fallback when the page is reached without it.
 */
import { permanentRedirect } from "next/navigation";
import { listConfig, vehicles, weapons } from "@/data";
import { canonicalComparison, type CompareType } from "@/lib";
import { ComparisonView } from "./ComparisonView";

type SearchParams = Record<string, string | string[] | undefined>;

function toPairs(sp: SearchParams): Array<[string, string]> {
  const out: Array<[string, string]> = [];
  for (const [k, v] of Object.entries(sp)) {
    if (Array.isArray(v)) for (const x of v) out.push([k, x]);
    else if (typeof v === "string") out.push([k, v]);
  }
  return out;
}

export async function ComparisonRoute({ type, searchParams }: { type: CompareType; searchParams: Promise<SearchParams> }) {
  const sp = await searchParams;
  const config = listConfig(type === "vehicle" ? "vehicles" : "weapons");
  const known = (type === "vehicle" ? vehicles : weapons).map((x) => x.compareKey);
  const canon = canonicalComparison(toPairs(sp), type, known, config.path);
  if (canon.redirect) permanentRedirect(canon.href);
  return <ComparisonView type={type} keys={canon.keys} />;
}
