/** R-1301: three skip links first on every page. */
export function SkipLinks() {
  return (
    <div className="atlas-skip">
      <a href="#content" data-testid="skip-links">
        Skip to content
      </a>
      <a href="#main-nav" data-testid="skip-links">
        Skip to main navigation
      </a>
      <a href="#side-column" data-testid="skip-links">
        Skip to 2nd column
      </a>
    </div>
  );
}
