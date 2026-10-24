import { writeFileSync } from "node:fs";
import { scoreDiagnostic } from "./lib/scoring.js";
import { estimateImpact } from "./lib/impact.js";
import { buildReport } from "./lib/pdf.js";
import { currencyFor } from "./lib/currency.js";

/*
  A worked example: a mid-sized aesthetics clinic that is good at being found
  and poor at answering. Deliberately the most common shape - strong top of
  funnel, leaking everywhere after it.
*/
const profile = {
  name: "Sarah Mensah",
  email: "sarah@lumenskinclinic.co.uk",
  business: "Lumen Skin Clinic",
  businessType: "Aesthetics clinic",
  website: "www.lumenskinclinic.co.uk",
  currency: "GBP",
};

const answers = {
  // 1. Lead Sources & Discovery - the part they are doing well.
  "lead-sources.sources": ["instagram", "gbp", "referrals"],
  "lead-sources.gbp": "basic",
  "lead-sources.reviews-count": 31,
  "lead-sources.website": "yes",
  "lead-sources.website-url": "www.lumenskinclinic.co.uk",
  "lead-sources.findability": 3,

  // 2. Lead Response - the worst stage, and the one the cycle should pick.
  "lead-response.speed": "sameday",
  "lead-response.auto-response": "no",
  "lead-response.while-busy": "between",
  "lead-response.script": "partial",
  "lead-response.tracking": "no",

  // 3. Lead Nurture & Follow-Up
  "lead-nurture.followup": "manual",
  "lead-nurture.touchpoints": "1-2",
  "lead-nurture.nurture-sequence": "no",
  "lead-nurture.incentive": "sometimes",
  "lead-nurture.website-capture": "contact-only",
  "lead-nurture.conversion-rate": 35,

  // 4. Booking Process - the strongest stage.
  "booking.method": "online",
  "booking.steps": "3-4",
  "booking.247": "partial",
  "booking.deposit": "sometimes",
  "booking.prices": "from",
  "booking.friction-signals": ["asks-availability", "no-prices"],

  // 5. Confirmation & Pre-Appointment
  "confirmation.confirmation": "email",
  "confirmation.prep-info": "manual",
  "confirmation.forms": "on-arrival",
  "confirmation.expectations": "partial",
  "confirmation.confidence": 3,

  // 6. Reminders & No-Show Prevention
  "reminders.reminders": "sms",
  "reminders.reminder-timing": ["24h"],
  "reminders.noshow-rate": 14,
  "reminders.policy": "unenforced",
  "reminders.noshow-followup": "manual",

  // 7. Reviews & Reputation
  "reviews.asking": "manual",
  "reviews.review-rate": "rarely",
  "reviews.responding": "rarely",
  "reviews.competitors": "fewer",
  "reviews.review-blocker": "It feels like begging, so I only ask when someone is really delighted.",

  // 8. Retention & Re-engagement
  "retention.client-value": "1000-2500",
  "retention.post-appointment": "followup",
  "retention.repeat-rate": 45,
  "retention.reengagement": "no",
  "retention.referral": "informal",
  "retention.retention-rating": 2,

  // The two numbers behind the money model.
  "numbers.appointments": 26,
  "numbers.value": 165,
};

const currency = currencyFor(profile.currency);
const result = scoreDiagnostic(answers, currency);
const impact = estimateImpact(answers, currency);

console.log(`overall ${result.overall}/100 - ${result.bandLabel}`);
result.sections.forEach((s) => console.log(`  ${String(s.score).padStart(3)}  ${s.status.padEnd(6)} ${s.title}  (opportunity ${s.opportunity})`));
console.log("priorities:", result.priorities.map((p) => p.title).join(" | "));
console.log("cycle KPI:", result.cycle.kpi, "->", result.cycle.target, "| worth", result.cycle.worth);
console.log("cycle priorities:", result.cycle.priorities.map((p) => `${p.window}: ${p.stage}`).join(" | "));
console.log("next cycle:", result.cycle.next);
console.log(`revenue £${impact.annualRevenue.toLocaleString()} | recoverable £${impact.recoverable.toLocaleString()}`);
impact.leaks.forEach((l) => console.log(`  £${l.annual.toLocaleString().padStart(7)}  ${l.label}`));
console.log("quick wins:", result.quickWins.length);

const doc = await buildReport(result, profile, answers);

/*
  Stamp it, so a sample can never be mistaken for a real client's data. Done
  here rather than in the product code: the report itself has no idea it is an
  example, and should not have to.
*/
const PAGE_W = 210;
const PAGE_H = 297;
const M = 20;
const total = doc.getNumberOfPages();

doc.setPage(1);
doc.setFillColor(203, 182, 232);
doc.roundedRect(PAGE_W - M - 40, 27, 40, 9, 4.5, 4.5, "F");
doc.setFont("helvetica", "bold");
doc.setFontSize(8);
doc.setTextColor(27, 33, 56);
doc.text("SAMPLE REPORT", PAGE_W - M - 20, 33, { align: "center", charSpace: 0.6 });

doc.setFont("helvetica", "normal");
doc.setFontSize(8);
doc.setTextColor(140, 147, 168);
doc.text(
  "An example of a completed report. Lumen Skin Clinic is a fictional business; every figure is produced by the real scoring model.",
  M,
  PAGE_H - 14,
);

for (let i = 2; i <= total; i++) {
  doc.setPage(i);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(140, 147, 168);
  doc.text("SAMPLE", PAGE_W / 2, PAGE_H - 12, { align: "center", charSpace: 0.8 });
}

writeFileSync(process.argv[2] ?? "sample.pdf", Buffer.from(doc.output("arraybuffer")));
console.log("pages:", doc.getNumberOfPages());
