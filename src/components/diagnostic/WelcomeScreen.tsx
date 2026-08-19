"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { BUSINESS_TYPES, SECTIONS } from "@/lib/diagnostic/sections";
import type { Profile } from "@/lib/diagnostic/types";
import { Button, Card, Eyebrow, Field, Wordmark, inputClass } from "./ui";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function WelcomeScreen({
  initial,
  onStart,
}: {
  initial: Profile | null;
  onStart: (profile: Profile) => void;
}) {
  const [profile, setProfile] = useState<Profile>(
    initial ?? { name: "", email: "", business: "", businessType: "" },
  );
  const [errors, setErrors] = useState<Partial<Record<keyof Profile, string>>>({});

  function set(key: keyof Profile, value: string) {
    setProfile((p) => ({ ...p, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  }

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const next: Partial<Record<keyof Profile, string>> = {};
    if (!profile.name.trim()) next.name = "Please add your name";
    if (!EMAIL.test(profile.email.trim())) next.email = "Please add a valid email address";
    if (!profile.business.trim()) next.business = "Please add your business name";
    if (!profile.businessType) next.businessType = "Please choose the closest match";
    setErrors(next);
    if (Object.keys(next).length > 0) return;
    onStart({
      name: profile.name.trim(),
      email: profile.email.trim(),
      business: profile.business.trim(),
      businessType: profile.businessType,
    });
  }

  return (
    <div className="mx-auto w-full max-w-[1080px] px-5 py-10 sm:px-8 sm:py-16">
      <Wordmark />

      <div className="mt-12 grid gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        >
          <Eyebrow>For wellness &amp; beauty business owners</Eyebrow>
          <h1 className="mt-5 text-[38px] font-semibold leading-[1.05] tracking-[-0.03em] text-tulivo-ink sm:text-[52px]">
            Customer Journey
            <br />
            Diagnostic
          </h1>
          <p className="mt-6 max-w-[46ch] text-[17px] leading-relaxed text-tulivo-muted sm:text-[19px]">
            Discover exactly where your business is losing enquiries — and what to fix first.
          </p>

          <div className="mt-9 flex flex-wrap items-center gap-x-6 gap-y-2 text-[13px] text-tulivo-faint">
            <span>10–15 minutes</span>
            <span className="hidden h-1 w-1 rounded-full bg-tulivo-line sm:inline-block" />
            <span>{SECTIONS.length} stages assessed</span>
            <span className="hidden h-1 w-1 rounded-full bg-tulivo-line sm:inline-block" />
            <span>Your score, free</span>
          </div>

          <ol className="mt-10 space-y-4 border-l border-tulivo-line pl-6">
            {SECTIONS.map((section, i) => (
              <li key={section.id} className="relative text-[14px] text-tulivo-muted">
                <span className="absolute -left-[26px] top-[3px] flex h-4 w-4 items-center justify-center rounded-full border border-tulivo-line bg-tulivo-card text-[9px] font-semibold text-tulivo-faint">
                  {i + 1}
                </span>
                <span className="font-medium text-tulivo-ink">{section.title}</span>
              </li>
            ))}
          </ol>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
        >
          <Card className="p-6 sm:p-8">
            <h2 className="text-[20px] font-semibold tracking-[-0.02em] text-tulivo-ink">
              Let&apos;s start with you
            </h2>
            <p className="mt-2 text-[14px] leading-relaxed text-tulivo-muted">
              So your results and report are written for your business, not a generic one.
            </p>

            <form className="mt-7 space-y-5" onSubmit={submit} noValidate>
              <Field label="Your name" error={errors.name}>
                <input
                  className={inputClass}
                  value={profile.name}
                  onChange={(e) => set("name", e.target.value)}
                  autoComplete="name"
                  placeholder="Jane Smith"
                />
              </Field>

              <Field label="Email address" error={errors.email} hint="Your results are sent here.">
                <input
                  className={inputClass}
                  value={profile.email}
                  onChange={(e) => set("email", e.target.value)}
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  placeholder="jane@yourbusiness.co.uk"
                />
              </Field>

              <Field label="Business name" error={errors.business}>
                <input
                  className={inputClass}
                  value={profile.business}
                  onChange={(e) => set("business", e.target.value)}
                  autoComplete="organization"
                  placeholder="The Glow Room"
                />
              </Field>

              <Field label="Business type" error={errors.businessType}>
                <select
                  className={`${inputClass} appearance-none bg-[length:16px] bg-[right_1rem_center] bg-no-repeat pr-11`}
                  style={{
                    backgroundImage:
                      "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' fill='none' stroke='%236a6058' stroke-width='1.5'%3E%3Cpath d='M4 6l4 4 4-4'/%3E%3C/svg%3E\")",
                  }}
                  value={profile.businessType}
                  onChange={(e) => set("businessType", e.target.value)}
                >
                  <option value="">Select the closest match…</option>
                  {BUSINESS_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </Field>

              <Button type="submit" full className="mt-2">
                Start your diagnostic
              </Button>

              <p className="text-center text-[12px] leading-relaxed text-tulivo-faint">
                Your answers are saved as you go, so you can finish later on the same device.
              </p>
            </form>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
