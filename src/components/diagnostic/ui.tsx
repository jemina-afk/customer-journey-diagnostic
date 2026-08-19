"use client";

import { cn } from "@/lib/utils";

/* Shared visual primitives for the diagnostic — kept deliberately small so the
   whole product reads as one considered surface rather than a kit of parts. */

export function Wordmark({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <span className="inline-block h-[7px] w-[7px] rotate-45 bg-tulivo-clay" aria-hidden />
      <span className="text-[11px] font-semibold uppercase tracking-[0.34em] text-tulivo-muted">
        Tulivo Digital
      </span>
    </div>
  );
}

export function Eyebrow({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <p className={cn("text-[11px] font-semibold uppercase tracking-[0.28em] text-tulivo-clay", className)}>
      {children}
    </p>
  );
}

export function Card({
  children,
  className,
  as: Tag = "div",
}: {
  children: React.ReactNode;
  className?: string;
  as?: "div" | "section" | "article";
}) {
  return (
    <Tag
      className={cn(
        "rounded-[22px] border border-tulivo-line bg-tulivo-card",
        "shadow-[0_1px_2px_rgba(32,27,24,0.04),0_18px_40px_-28px_rgba(32,27,24,0.35)]",
        className,
      )}
    >
      {children}
    </Tag>
  );
}

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost" | "quiet";
  full?: boolean;
};

export function Button({ variant = "primary", full, className, ...props }: ButtonProps) {
  return (
    <button
      {...props}
      className={cn(
        "inline-flex min-h-[52px] items-center justify-center gap-2 rounded-full px-7 text-[15px] font-medium tracking-[-0.01em]",
        "transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tulivo-clay/40 focus-visible:ring-offset-2 focus-visible:ring-offset-tulivo-canvas",
        "disabled:cursor-not-allowed disabled:opacity-40",
        variant === "primary" &&
          "bg-tulivo-clay text-white shadow-[0_10px_24px_-12px_rgba(154,71,47,0.7)] hover:bg-tulivo-clay-deep hover:shadow-[0_14px_30px_-12px_rgba(154,71,47,0.75)] active:translate-y-[1px]",
        variant === "ghost" &&
          "border border-tulivo-line bg-tulivo-card text-tulivo-ink hover:border-tulivo-clay/40 hover:bg-tulivo-clay-soft/50",
        variant === "quiet" && "px-3 text-tulivo-muted hover:text-tulivo-ink",
        full && "w-full",
        className,
      )}
    />
  );
}

export function Field({
  label,
  error,
  children,
  hint,
}: {
  label: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-[13px] font-medium tracking-[-0.01em] text-tulivo-ink">{label}</span>
      {children}
      {hint && !error && <span className="mt-1.5 block text-[12px] text-tulivo-faint">{hint}</span>}
      {error && <span className="mt-1.5 block text-[12px] font-medium text-tulivo-red">{error}</span>}
    </label>
  );
}

export const inputClass =
  "w-full min-h-[52px] rounded-[14px] border border-tulivo-line bg-white/70 px-4 text-[16px] text-tulivo-ink " +
  "placeholder:text-tulivo-faint transition-colors focus:border-tulivo-clay/60 focus:bg-white focus:outline-none " +
  "focus:ring-4 focus:ring-tulivo-clay/10";

export function StatusDot({ status, className }: { status: "green" | "amber" | "red"; className?: string }) {
  return (
    <span
      className={cn(
        "inline-block h-2.5 w-2.5 flex-none rounded-full",
        status === "green" && "bg-tulivo-green",
        status === "amber" && "bg-tulivo-amber",
        status === "red" && "bg-tulivo-red",
        className,
      )}
      aria-hidden
    />
  );
}

export function Rule({ className }: { className?: string }) {
  return <div className={cn("h-px w-full bg-tulivo-hairline", className)} />;
}
