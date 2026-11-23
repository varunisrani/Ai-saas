/**
 * Shared UI of Leonida Atlas (owned by UI-A). Other builders import from "@/components/ui".
 *
 * Page contract: the root layout renders the shell (skip links, header, GTA 6 sub-navigation, <main id="content">
 * with the page content followed by the side column, lazy footer with breadcrumbs, back-to-top) and mounts
 * AccountsDialogProvider. Pages render ONLY their content (no <main>, no SideColumn): typically an <article> or
 * <div> starting with <PageHeading> (the single h1), plus <Breadcrumbs items=[…]/> to declare the footer trail.
 */
export { AccountsDialogProvider, useAccountsDialog, ACCOUNTS_DIALOG_TITLE } from "./AccountsDialog";
export type { AccountsDialogContext } from "./AccountsDialog";
export { Breadcrumbs, HOME_CRUMB, GTA6_CRUMB } from "./Breadcrumbs";
export type { Crumb } from "./Breadcrumbs";
export { PageHeading } from "./PageHeading";
export type { PageHeadingProps } from "./PageHeading";
export { SideColumn } from "./SideColumn";
export { FavoritesBlock, notifyFavoritesChanged, FAVORITES_EVENT } from "./SideColumnClient";
export { Pagination } from "./Pagination";
export type { PaginationProps, PaginationVariant } from "./Pagination";
export { Lightbox } from "./Lightbox";
export type { LightboxProps } from "./Lightbox";
export { ArtImage } from "./ArtImage";
export type { ArtImageProps } from "./ArtImage";
export { ShareActions, useCopyFeedback } from "./ShareActions";
export { LazyReveal } from "./LazyReveal";
export type { LazyRevealProps } from "./LazyReveal";
export { ShellProvider, useShell, NotFoundMarker } from "./ShellContext";
