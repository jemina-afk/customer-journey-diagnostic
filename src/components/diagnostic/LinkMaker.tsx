"use client";

import { useState } from "react";
import { BUSINESS_TYPES } from "@/lib/diagnostic/sections";
import { Button, Card, Eyebrow, Field, Wordmark, inputClass } from "./ui";

/*
  Jemina's page, not a client's. After a call, she fills in who she spoke to and
  gets a link that opens the diagnostic already unlocked and already knowing
  their name - no payment screen, no unlock code to read out.
*/
export function LinkMaker() {
  const [key, setKey] = useState("");
  const [form, setForm] = useState({
    name: "",
    business: "",
    email: "",
    businessType: "",
    tier: "call",
    days: 60,
  });
  const [link, setLink] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  function set(field: string, value: string | number) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function create(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setLink("");
    try {
      const res = await fetch("/api/diagnostic/link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, key, origin: window.location.origin }),
      });
      const data = (await res.json()) as { url?: string; error?: string };
      if (data.url) {
        setLink(data.url);
        setCopied(false);
      } else {
        setError(data.error ?? "That didn't work.");
      }
    } catch {
      setError("Couldn't reach the server. Try again.");
    } finally {
      setBusy(false);
    }
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-[720px] px-5 py-12 sm:px-8 sm:py-16">
      <Wordmark />
      <Eyebrow className="mt-10">Internal</Eyebrow>
      <h1 className="mt-3 text-[30px] font-semibold leading-[1.1] tracking-[-0.03em] text-tulivo-ink sm:text-[36px]">
        Create a client link
      </h1>
      <p className="mt-3 max-w-[58ch] text-[16px] leading-relaxed text-tulivo-muted">
        For someone you&apos;ve already spoken to. The link opens the diagnostic with their details
        filled in and the full report unlocked, so there&apos;s no paywall between them and the work.
      </p>

      <Card className="mt-8 p-6 sm:p-8">
        <form className="space-y-5" onSubmit={create}>
          <Field label="Your admin key" hint="Set as DIAGNOSTIC_ADMIN_KEY in your environment variables.">
            <input
              className={inputClass}
              value={key}
              onChange={(e) => setKey(e.target.value)}
              type="password"
              autoComplete="off"
            />
          </Field>

          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Their name">
              <input className={inputClass} value={form.name} onChange={(e) => set("name", e.target.value)} />
            </Field>
            <Field label="Business name">
              <input
                className={inputClass}
                value={form.business}
                onChange={(e) => set("business", e.target.value)}
              />
            </Field>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Email">
              <input
                className={inputClass}
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
                type="email"
              />
            </Field>
            <Field label="Business type">
              <select
                className={inputClass}
                value={form.businessType}
                onChange={(e) => set("businessType", e.target.value)}
              >
                <option value="">They&apos;ll choose</option>
                {BUSINESS_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="What they bought">
              <select className={inputClass} value={form.tier} onChange={(e) => set("tier", e.target.value)}>
                <option value="call">Report and walkthrough call</option>
                <option value="report">Report only</option>
              </select>
            </Field>
            <Field label="Link valid for">
              <select
                className={inputClass}
                value={String(form.days)}
                onChange={(e) => set("days", Number(e.target.value))}
              >
                <option value="14">14 days</option>
                <option value="30">30 days</option>
                <option value="60">60 days</option>
                <option value="180">6 months</option>
              </select>
            </Field>
          </div>

          <Button type="submit" disabled={busy || !key} full>
            {busy ? "Creating..." : "Create the link"}
          </Button>
          {error && <p className="text-[13px] leading-relaxed text-tulivo-red">{error}</p>}
        </form>

        {link && (
          <div className="mt-7 rounded-[16px] border border-tulivo-clay/30 bg-tulivo-clay-soft/40 p-5">
            <Eyebrow>Their link</Eyebrow>
            <p className="mt-3 break-all rounded-[12px] border border-tulivo-line bg-tulivo-card px-3.5 py-3 text-[13px] leading-relaxed text-tulivo-ink">
              {link}
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <Button type="button" variant="ghost" onClick={copy} className="min-h-[46px] text-[14px]">
                {copied ? "Copied" : "Copy link"}
              </Button>
              <span className="text-[12.5px] text-tulivo-muted">
                Send it over with a line about what to expect. It expires on its own.
              </span>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
