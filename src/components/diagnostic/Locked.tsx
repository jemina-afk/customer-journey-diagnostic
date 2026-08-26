"use client";

import { cn } from "@/lib/utils";

/* Locked content is rendered for real and then blurred - people can see there
   is something specific there, which is what makes unlocking feel worth it. */

export function Locked({
  children,
  className,
  label = "Unlock full report",
  /** Caps how much blurred content is shown, so a locked page stays readable. */
  maxHeight,
}: {
  children: React.ReactNode;
  className?: string;
  label?: string;
  maxHeight?: number;
}) {
  return (
    <div className={cn("relative overflow-hidden", className)} aria-hidden>
      <div className="locked-blur" style={maxHeight ? { maxHeight, overflow: "hidden" } : undefined}>
        {children}
      </div>
      <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-b from-tulivo-card/10 via-tulivo-card/40 to-tulivo-card/75">
        <span className="inline-flex items-center gap-2 rounded-full border border-tulivo-line bg-tulivo-card/95 px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-tulivo-muted shadow-sm">
          <LockIcon />
          {label}
        </span>
      </div>
    </div>
  );
}

export function LockIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" className={cn("h-3.5 w-3.5", className)} aria-hidden>
      <path
        d="M4.5 7V5.2a3.5 3.5 0 017 0V7"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      <rect x="3" y="7" width="10" height="7" rx="2" fill="currentColor" opacity="0.85" />
    </svg>
  );
}
