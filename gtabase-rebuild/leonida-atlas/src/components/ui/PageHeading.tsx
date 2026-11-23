/**
 * The page's single h1 (TA8). `suffix` renders the list-page suffix " - Page N" as its own element
 * (token `page-number`, R-1108).
 */
import type { ReactNode } from "react";

export interface PageHeadingProps {
  children: ReactNode;
  /** e.g. "- Page 2" (rendered after a space, token `page-number`). */
  suffix?: string | null;
  className?: string;
  /** Extra data-testid tokens for the h1. */
  testId?: string;
  id?: string;
}

export function PageHeading({ children, suffix, className, testId, id }: PageHeadingProps) {
  return (
    <h1 id={id} className={`atlas-h1 ${className ?? ""}`} data-testid={testId}>
      {children}
      {suffix ? (
        <>
          {" "}
          <span className="atlas-h1-suffix" data-testid="page-number">
            {suffix}
          </span>
        </>
      ) : null}
    </h1>
  );
}
