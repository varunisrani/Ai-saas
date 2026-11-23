// Rebuild-only asset route `/art/<kind>/<id>.svg` (section 0.1 row 36): generated placeholder artwork.
import { artFor } from "@/data";
import { renderArtSvg } from "@/components/content/art-svg";

export async function GET(_request: Request, ctx: RouteContext<"/art/[kind]/[file]">) {
  const { kind, file } = await ctx.params;
  if (!file.endsWith(".svg")) return new Response("Not found", { status: 404 });
  const d = artFor(kind, file.slice(0, -4));
  if (!d) return new Response("Not found", { status: 404 });
  return new Response(renderArtSvg(d), {
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
