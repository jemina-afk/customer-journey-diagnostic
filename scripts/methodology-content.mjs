/*
  Content for the methodology document.

  Every number in here is taken from the code, not from memory: stage weights
  from SECTIONS, thresholds from scoring.ts, caps and formulas from impact.ts.
  If any of those change, change them here too - a methodology that does not
  match the tool is worse than none.
*/

export const META = {
  title: "Customer Journey Diagnostic",
  subtitle: "Methodology",
  strap: "How the scores, the priorities and the money estimate are produced",
  version: "Version 1.0",
  company: "Tulivo Digital",
  consultant: "Jemina Semakula",
  site: "tulivodigital.com",
  email: "jemina@tulivodigital.com",
};

export const INTRO = {
  eyebrow: "Why this document exists",
  title: ["Nothing in the report", "is a matter of opinion"],
  body: [
    "The diagnostic gives people a score, a list of priorities and a figure in pounds. All three are the kind of thing a business owner is right to be sceptical about, because most tools that produce them will not say how.",
    "This document says how. Every threshold, weight, formula and cap used in the report is set out below, along with the reasoning behind it.",
    "The model is deterministic. The same answers always produce the same report. Nothing in the scoring is generated, estimated by a language model, or varied between runs.",
  ],
  facts: [
    { k: "8", v: "stages assessed" },
    { k: "42", v: "scored questions" },
    { k: "3", v: "priced leaks" },
    { k: "0", v: "figures invented" },
  ],
};

export const STRUCTURE = {
  eyebrow: "What it measures",
  title: ["Eight stages, weighted", "by what they are worth"],
  body: [
    "The journey is split into eight stages, each scored on its own. Stages are not weighted equally in the overall score. Two things earn a stage extra weight: how quickly it can be moved, and how much of the loss is recoverable when it is.",
    "Lead Response carries the most weight because it is the fastest-moving number in a service business and the cheapest to fix. Reminders and Retention follow, because a missed appointment and a client who never returns are both losses you have already paid to create.",
  ],
  weights: [
    { stage: "Lead Sources & Discovery", weight: "1.0", questions: 6, note: "Important, but slow to move and partly outside your control" },
    { stage: "Lead Response", weight: "1.3", questions: 5, note: "Fastest to fix, largest recoverable loss, costs nothing but a system" },
    { stage: "Lead Nurture & Follow-Up", weight: "1.0", questions: 6, note: "High return, but needs sustained effort, not one change" },
    { stage: "Booking Process", weight: "1.0", questions: 7, note: "Usually a one-off fix with a lasting effect" },
    { stage: "Confirmation & Pre-Appointment", weight: "1.0", questions: 5, note: "Quietly decides attendance and first impressions" },
    { stage: "Reminders & No-Show Prevention", weight: "1.25", questions: 5, note: "The cheapest revenue protection available, and widely under-used" },
    { stage: "Reviews & Reputation", weight: "1.0", questions: 5, note: "Compounding, free, but takes months to build" },
    { stage: "Retention & Re-engagement", weight: "1.2", questions: 6, note: "Where the profit sits, and the hardest loss to see from inside" },
  ],
  note: "Total stage weight: 8.75. Two further questions, asked at the end, collect appointments per week and average appointment value. They are not scored. They exist only to turn the gaps into money.",
};

export const QUESTION_SCORING = {
  eyebrow: "How an answer becomes a number",
  title: ["Every answer maps", "to a value from 0 to 1"],
  body: [
    "A question is worth points only if it has a weight above zero and is not free text. Free-text answers are read for context and never scored. Where a question does not apply to how someone works - quoting, for example - the \"not applicable\" answer scores full marks, so nobody is marked down for a step they do not have.",
  ],
  kinds: [
    {
      kind: "Single choice",
      count: "33 questions",
      how: "Each option carries a fixed score set in advance. 1.0 is best practice, 0 is the answer that costs the most. Nothing is scored on a curve against other businesses.",
    },
    {
      kind: "Multiple choice",
      count: "3 questions",
      how: "The whole selection is scored together, not option by option, because breadth is the point. Three lead sources is not three times one source, and selecting every friction signal is not better than selecting none.",
    },
    {
      kind: "Slider",
      count: "4 questions",
      how: "A curve converts the number to a score, so the distance between 5% and 10% is not treated as the distance between 45% and 50%.",
    },
    {
      kind: "Rating 1 to 5",
      count: "3 questions",
      how: "Scored as (rating - 1) ÷ 4, so 1 scores 0 and 5 scores 1.",
    },
  ],
  unknown: {
    title: "When someone does not know",
    body: "Two sliders, no-show rate and enquiry-to-client conversion, carry an honest way out. Not knowing scores 0.3: below any measured answer, above the worst one. Not tracking a number is a real gap, but it is not the same as a bad number, and pretending otherwise would push people into guessing.",
  },
  safety: "Every score is clamped to the range 0 to 1 before it is used, so no single option can distort a stage.",
};

export const ROLLUP = {
  eyebrow: "From answers to scores",
  title: ["Two weighted averages,", "and nothing else"],
  steps: [
    {
      n: "1",
      title: "The stage score",
      formula: "stage = total of (answer score × question weight) ÷ total weight × 100",
      body: "Only answered questions appear on either side of the division. A half-finished section is scored on what was answered rather than penalised for what was not. Question weights run from 0.8 to 1.5 within a stage.",
    },
    {
      n: "2",
      title: "The overall score",
      formula: "overall = total of (stage score × stage weight) ÷ 8.75",
      body: "The same arithmetic one level up, using the stage weights opposite. Both results are rounded to a whole number once, at the end, rather than at each step.",
    },
  ],
  statusTitle: "Stage status",
  status: [
    { label: "Strong", range: "75 - 100", note: "Working. Leave it alone and spend the effort elsewhere." },
    { label: "Needs work", range: "50 - 74", note: "Functioning, but losing people at the edges." },
    { label: "Critical gap", range: "0 - 49", note: "Actively costing money every week it stays open." },
  ],
  bandTitle: "Overall band",
  bands: [
    { label: "Optimised", range: "80 - 100" },
    { label: "Functional", range: "60 - 79" },
    { label: "Leaking", range: "40 - 59" },
    { label: "Critical", range: "0 - 39" },
  ],
};

export const PRIORITIES = {
  eyebrow: "How the order is decided",
  title: ["The weakest stage is not", "always the first one to fix"],
  body: [
    "Priorities are ranked by headroom, not by score. A stage is ranked on how much room it has to improve, multiplied by how much that stage matters.",
  ],
  formula: "opportunity = (100 - stage score) × stage weight",
  after: [
    "The three highest become the report's priorities. This is why a stage scoring 46 can outrank one scoring 41: the first hour of work on it buys more.",
    "Quick wins are picked separately: one per stage, weakest stage first, deduplicated, capped at three. One action from each of three stages beats three versions of the same idea, and all three are chosen to be doable in a week without buying anything.",
  ],
};

export const MONEY = {
  eyebrow: "The money model",
  title: ["Three leaks, priced", "from their own numbers"],
  body: [
    "The estimate uses two numbers the reader gives at the end, appointments in a typical week and what an average one is worth, together with four answers from the assessment: no-show rate, enquiry-to-client conversion, repeat client rate, and what a client is worth over their lifetime.",
    "A year is 50 working weeks, not 52. Annual revenue is appointments per week × 50 × average value, and every figure below is a share of that.",
  ],
  leaks: [
    {
      name: "Appointments that don't turn up",
      formula: "bookings × no-show rate × value × 0.5",
      why: "Half of a no-show rate is treated as winnable, not all of it. Where someone does not track the number, the model assumes 10% and says so on the page.",
    },
    {
      name: "Enquiries that never became clients",
      formula: "enquiries × 10 percentage points × value per client",
      why: "Enquiries are worked back from appointments rather than guessed: a client who visits monthly is one enquiry, not twelve. Visits per year come from the lifetime band divided by the appointment value; new clients are what is left after the repeat rate. The lift is capped at 10 points and never takes conversion above 70%. Value per client is half the lifetime midpoint, because lifetime value accrues over years and this is a yearly figure.",
    },
    {
      name: "Clients who don't come back",
      formula: "bookings × gap to 60% × 0.5 × value",
      why: "Only half the gap between the current repeat rate and 60% is counted, and the gap itself is capped at 20 points. Nobody closes a retention gap in full.",
    },
  ],
  capsTitle: "The caps, and why they are there",
  caps: [
    { k: "18%", v: "of annual revenue is the most any single leak may claim" },
    { k: "35%", v: "of annual revenue is the most the total may reach" },
    { k: "£100", v: "minimum before a leak is shown at all" },
    { k: "£250", v: "minimum total before any money figure is shown" },
  ],
  capNote: "Where a cap bites, the report says so in the line beneath the figure rather than presenting the capped number as a precise one. Figures are rounded to the nearest £100 above £1,000 and the nearest £10 below it, so nothing reads as more exact than it is.",
  bandsTitle: "What a client is worth: bands and midpoints",
  bands: [
    { band: "Under £250", mid: "£150" },
    { band: "£250 - £500", mid: "£350" },
    { band: "£500 - £1,000", mid: "£700" },
    { band: "£1,000 - £2,500", mid: "£1,600" },
    { band: "£2,500 - £5,000", mid: "£3,500" },
    { band: "Over £5,000", mid: "£7,000" },
  ],
  bandNote: "Each midpoint sits slightly below the middle of its band, and the open top band is read conservatively rather than optimistically. Amounts are read in whatever currency the reader picked. Nothing is converted between currencies.",
};

export const CYCLE = {
  eyebrow: "The 90-day plan",
  title: ["One number, three or", "four priorities"],
  body: [
    "The plan follows the LEAP structure: a single KPI for the cycle, with every priority chosen because it moves that one number. Spreading effort across eight stages is why most improvement plans stall.",
  ],
  steps: [
    { n: "1", title: "The focus KPI", body: "Taken from the stage with the highest opportunity score. Each of the eight stages owns one KPI, so the choice of stage decides the number." },
    { n: "2", title: "The supporting stages", body: "Each KPI declares which stages move it. Those are added weakest first. A supporting stage already scoring 75 or above is skipped, because a priority spent there buys nothing." },
    { n: "3", title: "The actions", body: "The lead stage gets three actions, each supporting stage gets two, drawn from the recommendations that stage's answers generated. Anything already listed as a quick win is left out so the cycle does not repeat this week's work." },
    { n: "4", title: "The windows", body: "Up to four: Weeks 1-2, Weeks 3-6, Weeks 7-10, Weeks 11-13. Fewer where the supporting stages are already strong." },
    { n: "5", title: "The next cycle", body: "Named at the end: the highest remaining opportunity this cycle did not cover, with its own KPI. That is where the following 90 days would start." },
  ],
  worth: "Where the lead stage maps to one of the three priced leaks, the cycle carries that figure as what the KPI is worth once it moves. Where it does not, no figure is shown rather than an invented one.",
};

export const MEASUREMENT = {
  eyebrow: "Making it checkable",
  title: ["Every KPI comes with", "how to measure it"],
  body: [
    "A plan nobody can check is a plan nobody follows. Each of the eight KPIs carries three things: what the number actually is, where to get it, and how often to look.",
    "Sources are deliberately limited to what the reader already has. Inbox and message timestamps, booking system exports, Google Business Profile insights, and a tally kept by hand. Nothing in the report requires buying a tool to measure.",
  ],
  example: {
    kpi: "Enquiry response time",
    what: "Minutes between an enquiry landing and a useful reply going out.",
    where: "The timestamps already in your inbox and your Instagram and Facebook threads. Take the last ten enquiries and write down the gap for each.",
    cadence: "Weekly, on a sample of ten. Watch the worst one, not the average.",
  },
  note: "The report also carries a weekly scoreboard and a rule for what to do when a number has not moved in six weeks: the priority is wrong, not the effort.",
};

export const LIMITS = {
  eyebrow: "Being straight about it",
  title: ["What this model", "deliberately does not do"],
  items: [
    {
      title: "It does not benchmark you against other businesses",
      body: "Scores are measured against defined best practice, not against a peer group. There is no dataset of comparable businesses behind it, so no claim is made about where you sit relative to anyone else.",
    },
    {
      title: "It does not promise the money back",
      body: "The figure is what the gaps appear to be costing, estimated conservatively. It is not a forecast of what fixing them will return, and the report does not present it as one.",
    },
    {
      title: "It does not convert currency",
      body: "Amounts are read as amounts in the currency the reader picked. There is no exchange rate in the model, because a rate that moves would make the estimate harder to believe rather than easier.",
    },
    {
      title: "It does not replace your own numbers",
      body: "Where someone does not track something, the model uses a stated placeholder and flags it. A placeholder is a prompt to start measuring, not a substitute for having measured.",
    },
    {
      title: "It does not vary between runs",
      body: "No part of the scoring, prioritisation or money model uses a language model. The same answers produce the same report every time, on any device.",
    },
  ],
};

export const SOURCES = {
  eyebrow: "Evidence",
  title: ["Where the research in", "the report comes from"],
  body: "Four findings are cited on the first page of the report and on the website. Each is a named, dated study with a stated sample. They inform which stages carry extra weight; they are not used to compute any score.",
  list: [
    {
      stat: "75% decide in under 30 minutes",
      cite: "Consumer Search Behavior, BrightLocal (2026). Survey of 1,200+ US consumers about their most recent local business search.",
    },
    {
      stat: "71% have given up on a booking",
      cite: "Salon and Spa Consumer Survey, Zenoti (2025). Survey of 1,000+ US salon and spa clients.",
    },
    {
      stat: "A third fewer missed appointments",
      cite: "Chong & Jawad, Reducing Did Not Attends at a Community Mental Health Service Through the Implementation of SMS Reminders: A Closed Loop Audit (2025). Missed appointments fell from 7.5% to 5.0%.",
    },
    {
      stat: "97% read reviews first",
      cite: "Local Consumer Review Survey, BrightLocal (2026). Representative panel of 1,002 US adults.",
    },
  ],
  close:
    "Where a figure could not be verified at its original source, it was left out. Two widely repeated statistics were removed during development for exactly that reason.",
};
