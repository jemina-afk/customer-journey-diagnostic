"use client";

import { cn } from "@/lib/utils";

/*
  The test-mode strip. Deliberately unmissable — it should never be possible to
  mistake a test run for a client's, and every email it triggers is labelled
  [TEST] so the inbox tells the same story.
*/

export function TestBar({
  onFill,
  onUnlock,
  onReset,
  unlocked,
  stage,
}: {
  onFill: () => void;
  onUnlock: () => void;
  onReset: () => void;
  unlocked: boolean;
  stage: "welcome" | "sections" | "numbers" | "results";
}) {
  return (
    <div className="sticky top-0 z-40 border-b border-tulivo-gold/40 bg-tulivo-gold-soft/95 backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-[1080px] flex-wrap items-center gap-x-4 gap-y-2 px-5 py-2.5 sm:px-8">
        <span className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-tulivo-gold">
          <span className="inline-block h-2 w-2 rounded-full bg-tulivo-gold" aria-hidden />
          Test mode
        </span>
        <span className="hidden text-[12px] text-tulivo-muted sm:inline">
          Nothing here is charged, and any email sent is marked [TEST].
        </span>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <TestButton onClick={onFill}>
            {stage === "results" ? "New sample answers" : "Fill sample answers"}
          </TestButton>
          <TestButton onClick={onUnlock} disabled={unlocked}>
            {unlocked ? "Unlocked" : "Unlock without paying"}
          </TestButton>
          <TestButton onClick={onReset}>Reset</TestButton>
        </div>
      </div>
    </div>
  );
}

function TestButton({
  children,
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "min-h-[36px] rounded-full border border-tulivo-gold/50 bg-tulivo-card/80 px-3.5 text-[13px] font-medium text-tulivo-ink",
        "transition-colors hover:bg-tulivo-card disabled:cursor-not-allowed disabled:opacity-45",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tulivo-gold/50",
      )}
    >
      {children}
    </button>
  );
}
