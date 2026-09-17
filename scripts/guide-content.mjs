/*
  Content for the free guide. Kept apart from the generator so Jemina can edit
  the words without touching the layout code.

  Written for a cold reader who has answered no questions: plain English, short
  sentences, and nothing that needs their numbers. The diagnostic is what turns
  this into their numbers, which is the whole point of the last page.
*/

export const BRAND = {
  company: "Tulivo Digital",
  consultant: "Jemina Semakula",
  site: "tulivodigital.com",
  email: "jemina@tulivodigital.com",
  diagnosticUrl: "tulivodigital.com/diagnostic",
};

export const TITLE = "The Eight Stages of a Customer Journey";
export const SUBTITLE = "Where service businesses lose enquiries, what it costs, and how to fix it";

export const WHY = {
  eyebrow: "Start here",
  title: ["Your journey decides what", "your marketing is worth"],
  body: [
    "Ads change one thing. They change how many people ask about you.",
    "What happens next decides how many of them become clients. How fast you reply. How easy you are to book. Whether anything reminds them. Whether anyone ever asks them back.",
    "If people slip away along the way, more marketing just means more people slipping away. You pay twice. Once to get the enquiry, and again when that person quietly books somewhere else.",
    "And it is never one big problem. It is eight small ones, and they stack up. Hold on to three out of four people at each step and that sounds fine. Do it four steps in a row and most of the interest you paid for has gone.",
  ],
  stats: [
    {
      stat: "75%",
      title: "People choose fast",
      body: "of people pick a local business in under 30 minutes. More than one in four decide in under five. Most look at three businesses or fewer.",
    },
    {
      stat: "71%",
      title: "Hard to book means no booking",
      body: "of regular clients say they have given up on booking because it was too hard to reach someone or book online. They did not complain. They went elsewhere.",
    },
    {
      stat: "a third",
      title: "One text saves the slot",
      body: "fewer missed appointments after one text reminder the day before: 7.5% down to 5.0%. A no-show is a client you already paid for.",
    },
    {
      stat: "97%",
      title: "Everyone checks you first",
      body: "of people read reviews before choosing a local business. More than two thirds will only use one rated 4 stars or better.",
    },
  ],
  sources:
    "Sources: Consumer Search Behavior, BrightLocal (2026), 1,200+ US consumers. Salon and Spa Consumer Survey, Zenoti (2025), 1,000+ US clients. Chong & Jawad, Reducing Did Not Attends at a Community Mental Health Service Through the Implementation of SMS Reminders: A Closed Loop Audit (2025). Local Consumer Review Survey, BrightLocal (2026), 1,002 US adults.",
};

export const MAP_INTRO = [
  "Every client you have ever had walked the same eight steps. They found you, they got in touch, they waited for an answer, they booked, they turned up, they had a good time, they told someone, and they came back.",
  "Each step can hold or leak on its own. This guide takes them one at a time. For each one you get what it is, what usually goes wrong, what to do about it, and the one number to watch.",
];

export const STAGES = [
  {
    n: 1,
    title: "Lead Sources & Discovery",
    what: "How people find out you exist in the first place.",
    why: "If you only have one way of being found, you are one algorithm change away from a very quiet month.",
    wrong: [
      "Everything comes from one place. Usually Instagram, or word of mouth. When it dips, nothing replaces it.",
      "Your Google Business Profile exists but is half empty. No prices, no recent photos, no answers to the obvious questions.",
      "Your website looks fine on a laptop, but on a phone the way to book is hidden.",
    ],
    fix: [
      "Fill in every field on your Google Business Profile. Services with prices, ten recent photos, opening hours, and your five most common questions answered.",
      "Put one clear 'Book now' button in the header, at the top of every service page, and fixed to the bottom of the screen on a phone.",
      "Name your third route. If Google and Instagram are two, pick one more and give it a month.",
    ],
    kpi: "New enquiries a month, split by where each one came from",
    from: "A one-line note per enquiry: date, source, did they book. Plus your Google Business Profile insights.",
  },
  {
    n: 2,
    title: "Lead Response",
    what: "How long someone waits between asking and getting a useful answer.",
    why: "This is the fastest-moving number you have, and the cheapest to fix. It costs nothing but a system.",
    wrong: [
      "Enquiries land while you are with a client and get answered at the end of the day, or the next morning.",
      "The first reply is 'Hi, thanks for getting in touch' with no price, no availability and no link. So they have to ask again.",
      "Nobody knows how long you actually take, because nobody has ever counted.",
    ],
    fix: [
      "Turn on instant replies on Instagram and Facebook, and an automatic email on your website form. Include your prices and a booking link.",
      "Write three saved replies for your most common enquiries. Each one ends with a clear next step.",
      "Decide who answers when you are with a client, and by when. Put it in writing, even if it is just you.",
    ],
    kpi: "Minutes between an enquiry landing and a useful reply going out",
    from: "The timestamps already in your inbox and your social media threads. Take the last ten and write down the gap.",
  },
  {
    n: 3,
    title: "Lead Nurture & Follow-Up",
    what: "What happens to the people who ask, then go quiet.",
    why: "Most enquiries are not a no. They are a not right now. Without follow-up, every one of those becomes a no by default.",
    wrong: [
      "One reply, and if they do not answer, that is that. You paid for that enquiry and it is gone.",
      "Following up feels pushy, so it does not happen.",
      "There is no list. People who enquired six months ago are strangers again.",
    ],
    fix: [
      "Follow up three times, not once. Day two, day seven, day twenty-one. Short, warm, and useful each time.",
      "Give the last one a reason to reply: a cancellation slot, a new treatment, a question about what put them off.",
      "Keep every enquiry in one place, even a spreadsheet, with a date and what happened.",
    ],
    kpi: "The share of enquiries that become paying clients",
    from: "Count enquiries and count new clients for the same month, then divide. Once a month is often enough.",
  },
  {
    n: 4,
    title: "Booking Process",
    what: "Everything between 'I want this' and 'it is in the diary'.",
    why: "Every extra step loses people. Booking friction costs you clients who had already decided to buy.",
    wrong: [
      "Booking means ringing you, and you are with a client, so it does not happen.",
      "It takes five taps, an account, and a page that does not work properly on a phone.",
      "Prices are not shown anywhere, so people have to ask before they can decide.",
    ],
    fix: [
      "Let people book online, at any hour, without creating an account.",
      "Count the taps from your home page to a confirmed booking. Take out every step that is not strictly needed.",
      "Publish your prices. 'From' pricing is fine. Silence costs you more than the number ever will.",
    ],
    kpi: "The share of bookings that happen without you touching them",
    from: "Your booking system will tell you online versus manual. If you take bookings by hand, keep a tally for a fortnight.",
  },
  {
    n: 5,
    title: "Confirmation & Pre-Appointment",
    what: "The gap between booking and arriving.",
    why: "This is where doubt creeps in. What you send in that window decides whether someone turns up relaxed and ready, or nervous, late, or not at all.",
    wrong: [
      "A bare confirmation with a date and time, and nothing else until the day.",
      "Nobody has told them where to park, what to bring, how long it takes, or what will actually happen.",
      "First-timers arrive anxious, which makes the appointment harder and the rebooking less likely.",
    ],
    fix: [
      "Send one welcome message after booking that answers the five things people always ask.",
      "Say what will happen, step by step, so nothing is a surprise.",
      "Send any forms up front, so the appointment starts on time and starts well.",
    ],
    kpi: "The share of first appointments that actually happen",
    from: "Your diary. Count first-time bookings and count first-time arrivals for the same month.",
  },
  {
    n: 6,
    title: "Reminders & No-Show Prevention",
    what: "Making sure the diary you have is the diary you work.",
    why: "A no-show is the most expensive thing in your week. You already paid to win that client, you blocked the time, and there is nothing to sell in its place.",
    wrong: [
      "One reminder, sent too early, or none at all.",
      "There is a cancellation policy on the website that nobody has ever enforced.",
      "No deposit, so breaking the appointment costs the client nothing.",
    ],
    fix: [
      "Send two reminders: one three days before, one the day before. Text beats email.",
      "Make the reminder useful, not just a nudge. Include how to move the appointment, so they move it instead of missing it.",
      "Take a deposit on new clients and on your longest appointments.",
    ],
    kpi: "Your no-show rate",
    from: "Count missed appointments and total appointments for the same month, then divide. Watch it monthly.",
  },
  {
    n: 7,
    title: "Reviews & Reputation",
    what: "The proof that makes everything else you do work harder.",
    why: "Reviews lift your local search ranking, raise click-through and shorten the decision. And they are free.",
    wrong: [
      "You have a handful of reviews, all from people who felt strongly enough to do it unprompted.",
      "Nobody asks. It feels awkward, so it never becomes a habit.",
      "Reviews sit there unanswered, good and bad alike.",
    ],
    fix: [
      "Ask every happy client, the same day, with a direct link. Not 'please review us' on a poster.",
      "Set a target and count towards it. Twenty-five reviews is the point where new clients start to feel safe choosing you.",
      "Reply to every review within a week. Warmly to the good ones, calmly to the bad ones.",
    ],
    kpi: "Your review count and your average rating",
    from: "Your Google Business Profile. Write the number down on the first of every month.",
  },
  {
    n: 8,
    title: "Retention & Re-engagement",
    what: "Whether people come back, and what happens when they stop.",
    why: "Retention is where the profit lives. A client who rebooks costs you nothing to win, spends more over time, and refers people who already trust you.",
    wrong: [
      "Rebooking is left to the client to remember. Most will not.",
      "When someone drifts away, nothing happens. No note, no message, no idea they have gone.",
      "You have no idea what share of your clients are regulars, so you cannot tell whether it is getting better or worse.",
    ],
    fix: [
      "Ask for the next appointment while they are still in the chair. Every time, without exception.",
      "Set up one 'we have missed you' message that goes out at eight to twelve weeks of silence.",
      "Count your regulars once a quarter. You cannot improve a number you have never looked at.",
    ],
    kpi: "The share of clients who book again",
    from: "Your booking system's client list, or a count of repeat names in your diary over three months.",
  },
];

/*
  The cost table.

  Deliberately simple arithmetic the reader can check. Each row is a multiple of
  their service price, based on one stated, conservative assumption. Held at 20
  appointments a week so the reader has one number to scale from, and the total
  lands at a fifth of revenue rather than the scariest figure available.
*/
export const COST = {
  basis: "20 appointments a week, 50 weeks a year. That is 1,000 appointments.",
  scale: "Doing 40 a week? Double every number. Doing 10? Halve them.",
  columns: [
    { price: 50, label: "£50 a visit", example: "Hair, nails, massage" },
    { price: 150, label: "£150 a visit", example: "Aesthetics, physio, PT blocks" },
    { price: 400, label: "£400 a visit", example: "Treatment courses, larger jobs" },
    { price: 1000, label: "£1,000 a visit", example: "Implants, build work, retainers" },
  ],
  rows: [
    {
      leak: "Slow replies",
      assumption: "Two enquiries a week go cold. One in four would have booked, and stayed for two visits.",
      multiple: 50,
    },
    {
      leak: "No follow-up",
      assumption: "One enquiry a month is a not-yet, not a no. Three follow-ups win it back.",
      multiple: 24,
    },
    {
      leak: "Booking friction",
      assumption: "One in twenty people who start a booking give up. Half of those are winnable.",
      multiple: 26,
    },
    {
      leak: "No-shows",
      assumption: "A 10% no-show rate, with half of those preventable by reminders and deposits.",
      multiple: 50,
    },
    {
      leak: "No rebooking",
      assumption: "Moving repeat business from 40% to 50% of appointments.",
      multiple: 50,
    },
  ],
  note: "That total is a fifth of your revenue. It is meant to be conservative, not alarming. Every figure above assumes you recover only part of each gap, because that is what actually happens.",
  close:
    "None of these gaps show up in your accounts. There is no line for the client who gave up on your booking page, or the one who drifted away and never said why. You only ever see the takings you did get, which is why a business can leak like this for years and still feel like it is doing fine.",
};

export const FIRST_WEEK = {
  intro:
    "You cannot fix eight stages at once, and trying is why most improvement plans stall. Pick the weakest one and give it ninety days. But this week, do these five things. None of them costs anything and all five can be done between clients.",
  steps: [
    {
      day: "Monday",
      title: "Time your replies",
      body: "Open your inbox and your social media messages. Take the last ten enquiries and write down how long each one waited. Look at the worst one, not the average.",
    },
    {
      day: "Tuesday",
      title: "Finish your Google profile",
      body: "Services with prices. Ten recent photos. Opening hours. Your five most common questions, answered. It is the highest-return hour you will spend all month.",
    },
    {
      day: "Wednesday",
      title: "Write three replies",
      body: "Your three most common enquiries, answered properly and saved where you can reach them in one tap. Each one ends with a booking link.",
    },
    {
      day: "Thursday",
      title: "Turn on a second reminder",
      body: "Most booking systems already do this and most people have only switched on one. Three days before, and the day before.",
    },
    {
      day: "Friday",
      title: "Ask five people for a review",
      body: "Five clients you saw this week who left happy. Same day, direct link, by text. Then do it again next Friday.",
    },
  ],
  close:
    "Do that for a fortnight and you will have moved three of the eight stages without buying anything or building anything.",
};

export const NEXT = {
  title: ["Want to know which stage", "is costing you the most?"],
  body: [
    "This guide is the general version. The eight stages are the same for everyone, but the leaks are not, and neither is the bill.",
    "The Customer Journey Diagnostic scores your business on all eight stages and puts a figure on what each gap is costing you, worked out from your own appointment numbers. It takes about fifteen minutes.",
    "Your score and your cost estimate are free. No card needed.",
  ],
  bullets: [
    "A score out of 100 for each of the eight stages",
    "Your three biggest leaks, named in plain words",
    "What those leaks cost you over a year, in money",
    "The one number to move first",
  ],
  about:
    "Jemina Semakula helps service business owners fix the journey between \"I'm interested\" and \"I've booked again\". Most of them do not have a marketing problem. They have a journey problem: enquiries that go unanswered, follow-ups that never happen, and clients who simply drift away.",
};
