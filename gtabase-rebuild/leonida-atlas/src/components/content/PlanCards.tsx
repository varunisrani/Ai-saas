"use client";

/** Membership plan cards (R-1408, DIVERGENCE D-016): "Sign Up!" and "See Full Details" open the accounts-later dialog. */
import type { Plan } from "@/data";
import { useAccountsDialog } from "@/components/ui";

export function PlanCards({ plans }: { plans: Plan[] }) {
  const accounts = useAccountsDialog();
  return (
    <div className="atlas-plans">
      {plans.map((p) => (
        <section key={p.id} className={`atlas-plan atlas-card ${p.recommended ? "is-recommended" : ""}`} data-testid="plan" aria-labelledby={`plan-${p.id}`}>
          {p.badge ? (
            <span className="atlas-badge" data-testid="plan-recommended">
              {p.badge}
            </span>
          ) : null}
          <h2 id={`plan-${p.id}`} className="atlas-plan-title" data-testid="plan-title">
            {p.title}
          </h2>
          <p className="atlas-plan-price" data-testid="plan-price">
            {p.priceLine}
          </p>
          <ul className="atlas-plan-features">
            {p.features.map((f) => (
              <li key={f.title}>
                <strong data-testid={`plan-${p.id}-features`}>{f.title}</strong>
                <span data-testid={f.key}>{f.subtitle}</span>
              </li>
            ))}
          </ul>
          <div className="atlas-plan-actions">
            <button type="button" className="atlas-pill atlas-pill-primary" onClick={() => accounts.open("default")}>
              Sign Up!
            </button>
            <button type="button" className="atlas-pill atlas-pill-ghost" onClick={() => accounts.open("default")}>
              See Full Details
            </button>
          </div>
        </section>
      ))}
    </div>
  );
}
