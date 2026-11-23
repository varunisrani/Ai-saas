/** Renders a resolved article list page with its definition (R-1101..R-1110). */
import { ArticleList, type ArticleListKind } from "./ArticleList";
import { LIST_DEFS, type ResolvedListPage } from "./article-lists";

export function ArticleListPage({ kind, resolved }: { kind: ArticleListKind; resolved: ResolvedListPage }) {
  const def = LIST_DEFS[kind];
  return (
    <ArticleList
      kind={kind}
      page={resolved.page}
      last={resolved.last}
      items={resolved.items}
      heading={resolved.heading}
      suffix={resolved.suffix}
      showDescription={resolved.showDescription}
      intro={def.intro}
      banner={kind === "news" || kind === "videos" ? def.banner : undefined}
      listUrl={def.listUrl}
      crumbs={def.crumbs(null)}
    />
  );
}
