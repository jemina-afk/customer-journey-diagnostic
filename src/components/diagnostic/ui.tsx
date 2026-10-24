"use client";

import { cn } from "@/lib/utils";

/* Shared visual primitives for the diagnostic - kept deliberately small so the
   whole product reads as one considered surface rather than a kit of parts. */

export function Wordmark({
  className,
  tone = "dark",
}: {
  className?: string;
  /** "light" is the white logo, for navy and gradient surfaces. */
  tone?: "dark" | "light";
}) {
  /* The real logo file, never retyped. Sized by height so the lockup keeps
     its proportions, with clear space of at least the height of the "t". */
  return (
    /* eslint-disable-next-line @next/next/no-img-element */
    <img
      src={tone === "light" ? "/brand/tulivo-logo-white.svg" : "/brand/tulivo-logo-original.svg"}
      alt="Tulivo Digital"
      className={cn("h-[34px] w-auto select-none", className)}
      draggable={false}
    />
  );
}

/*
  A section label in the brand's own form: a short thin rule, then a small
  label-grey label. Sits above an Italiana title.
*/
export function Eyebrow({
  children,
  className,
  tone = "dark",
}: {
  children: React.ReactNode;
  className?: string;
  tone?: "dark" | "light";
}) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <span
        className={cn("h-px w-7 flex-none", tone === "light" ? "bg-tulivo-lilac" : "bg-tulivo-purple")}
        aria-hidden
      />
      <p
        className={cn(
          "text-[13px] leading-[1.3]",
          tone === "light" ? "text-tulivo-muted-navy" : "text-tulivo-muted",
        )}
      >
        {children}
      </p>
    </div>
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
  /* Thin borders on off-white, consistent corners, no heavy shadows. */
  return (
    <Tag
      className={cn(
        "rounded-[4px] border border-tulivo-line bg-tulivo-card",
        "shadow-[0_1px_2px_rgba(27,33,56,0.03),0_18px_40px_-32px_rgba(27,33,56,0.25)]",
        className,
      )}
    >
      {children}
    </Tag>
  );
}

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  /** "onDark" is the cream button for navy and gradient surfaces. */
  variant?: "primary" | "onDark" | "ghost" | "quiet";
  full?: boolean;
};

export function Button({ variant = "primary", full, className, ...props }: ButtonProps) {
  return (
    <button
      {...props}
      className={cn(
        "inline-flex min-h-[52px] items-center justify-center gap-2 rounded-pill px-8 text-[14px] font-medium tracking-[0.02em]",
        "transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tulivo-purple/40 focus-visible:ring-offset-2 focus-visible:ring-offset-tulivo-canvas",
        "disabled:cursor-not-allowed disabled:opacity-40",
        variant === "primary" &&
          "bg-tulivo-dark text-white hover:bg-tulivo-navy active:translate-y-[1px]",
        variant === "onDark" && "bg-tulivo-card text-tulivo-navy hover:bg-white active:translate-y-[1px]",
        variant === "ghost" &&
          "border border-tulivo-line bg-tulivo-card text-tulivo-ink hover:border-tulivo-purple/40 hover:bg-tulivo-section",
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
  "w-full min-h-[52px] rounded-[4px] border border-tulivo-line bg-white/70 px-4 text-[16px] text-tulivo-ink " +
  "placeholder:text-tulivo-faint transition-colors focus:border-tulivo-purple/60 focus:bg-white focus:outline-none " +
  "focus:ring-4 focus:ring-tulivo-purple/10";

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
