"use client";

import { cn } from "@/lib/utils";

/*
  A switch between the two states of the results page, so both can be read and
  edited without paying and without a code.

  It only appears while no way to take money is configured, which is also the
  only time the report opens on its own. Connect Stripe or a checkout URL and
  this disappears with it; set NEXT_PUBLIC_REQUIRE_PAYMENT to "true" and it
  disappears straight away.
*/
export function PreviewToggle({
  open,
  onChange,
}: {
  open: boolean;
  onChange: (open: boolean) => void;
}) {
  return (
    <div
      className="pointer-events-none fixed inset-x-0 z-50 flex justify-center px-4"
      style={{ bottom: "max(18px, env(safe-area-inset-bottom, 0px))" }}
    >
      <div
        className={cn(
          "pointer-events-auto flex items-center gap-3 rounded-pill border border-tulivo-purple/35",
          "bg-tulivo-navy/95 px-4 py-2.5 shadow-[0_18px_40px_-18px_rgba(19,18,23,0.65)] backdrop-blur",
        )}
      >
        <span className="text-[11px] font-medium uppercase tracking-[0.17em] text-tulivo-muted-navy">
          Preview
        </span>

        <div className="flex rounded-pill bg-white/8 p-0.5" role="group">
          <Side label="Closed" active={!open} onClick={() => onChange(false)} />
          <Side label="Open" active={open} onClick={() => onChange(true)} />
        </div>
      </div>
    </div>
  );
}

function Side({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "min-h-[34px] rounded-pill px-4 text-[13px] font-medium transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tulivo-lilac/60",
        active
          ? "bg-tulivo-card text-tulivo-navy"
          : "text-tulivo-on-navy/70 hover:text-tulivo-on-navy",
      )}
    >
      {label}
    </button>
  );
}
