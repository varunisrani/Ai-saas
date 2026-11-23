"use client";

/**
 * Release countdown (R-1318): target 19 November 2026 00:00:00 in the viewer's time zone; ticks once per
 * second; once negative the fields are replaced for good by "GTA 6 is Out Now!" and the ticking stops.
 * The server renders the same rule with its own clock; the client re-evaluates immediately.
 */
import { useEffect, useState } from "react";
import { COUNTDOWN_TICK_MS, countdownState, RELEASE_LOCAL, type CountdownState } from "@/lib";

function offsetAtRelease(): number {
  return new Date(RELEASE_LOCAL.year, RELEASE_LOCAL.monthIndex, RELEASE_LOCAL.day).getTimezoneOffset();
}

export function CountdownTimer({ initial }: { initial: CountdownState }) {
  const [state, setState] = useState<CountdownState>(initial);

  useEffect(() => {
    let timer: number | null = null;
    const tick = () => {
      const next = countdownState(Date.now(), offsetAtRelease());
      setState(next);
      if (next.out && timer !== null) {
        window.clearInterval(timer);
        timer = null;
      }
      return next;
    };
    const first = tick();
    if (!first.out) timer = window.setInterval(tick, COUNTDOWN_TICK_MS);
    return () => {
      if (timer !== null) window.clearInterval(timer);
    };
  }, []);

  return (
    <div className="atlas-countdown-timer" data-testid="countdown-timer" aria-live="off">
      {state.out ? (
        <p className="atlas-countdown-out caps">{state.text}</p>
      ) : (
        <div className="atlas-countdown-fields">
          {state.fields.map((f) => (
            <div key={f.label} className="atlas-countdown-field">
              <span className="atlas-countdown-value" data-testid="countdown-digits">
                {f.value}
              </span>
              <span className="atlas-countdown-label">{f.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
