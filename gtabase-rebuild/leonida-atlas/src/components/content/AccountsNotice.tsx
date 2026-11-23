/** Accounts-later notice as a page (R-306, R-1411; DIVERGENCE D-001, D-026): no form, no inputs. */
import Link from "next/link";
import { Breadcrumbs, PageHeading } from "@/components/ui";

export function AccountsNotice({ heading, crumb }: { heading: string; crumb: string }) {
  return (
    <div className="atlas-notice-page">
      <Breadcrumbs items={[{ label: crumb }]} />
      <PageHeading>{heading}</PageHeading>
      <p>
        Accounts are coming later. You don&apos;t need one to use Leonida Atlas: checklist ticks, map finds, favorites and
        settings are saved in this browser only, on this device.
      </p>
      <p>
        <Link href="/gta-6/" className="atlas-pill atlas-pill-primary">
          Back to GTA 6
        </Link>
      </p>
    </div>
  );
}
