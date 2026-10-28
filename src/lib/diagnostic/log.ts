/*
  The log that feeds each focus number: what to write down, an example of it
  filled in, and how the number falls out of it.

  One line per person is the whole discipline. Everything else on the tracking
  page exists to make that one habit feel small enough to keep.
*/

export interface LogShape {
  /** Column headings, left to right. */
  columns: string[];
  /** Three filled-in rows, so the shape is obvious at a glance. */
  rows: string[][];
  /** The sum, worked through with the example figures. */
  worked: string;
  /** Which month to count, and why that one. */
  whichMonth: string;
  /** The Monday routine, in order. */
  monday: string[];
}

const ENQUIRY_LOG: LogShape = {
  columns: ["Date", "Name", "Where they came from", "Replied within", "Booked?", "First appointment"],
  rows: [
    ["3 Sep", "Hannah B", "Instagram", "6 min", "Yes", "11 Sep"],
    ["4 Sep", "Priya N", "Google", "2 hrs", "No", "-"],
    ["6 Sep", "Dani R", "Referral", "11 min", "Yes", "19 Sep"],
  ],
  worked: "September: 41 enquiries, 14 booked. 14 ÷ 41 = 34%.",
  whichMonth:
    "Count last month rather than this one, because somebody who enquired on Friday has not had a chance to book yet.",
  monday: [
    "Add last week's enquiries to the log, one line each.",
    "Mark anyone who has booked since you last looked.",
    "Once a month, work out the number and write it in the scoreboard below.",
  ],
};

const RESPONSE_LOG: LogShape = {
  columns: ["Date", "Name", "Where they came from", "Came in at", "Replied at", "Minutes"],
  rows: [
    ["3 Sep", "Hannah B", "Instagram", "09:14", "09:20", "6"],
    ["4 Sep", "Priya N", "Google", "18:40", "20:35", "115"],
    ["6 Sep", "Dani R", "Referral", "11:02", "11:13", "11"],
  ],
  worked:
    "Of the last ten enquiries, eight were answered inside 15 minutes and the slowest took 115 minutes. The slowest one is the number to watch.",
  whichMonth:
    "Take the last ten enquiries each week rather than a whole month, so a bad week shows up while you can still do something about it.",
  monday: [
    "Open your last ten enquiries and write down the gap for each.",
    "Note the slowest one, and what you were doing when it came in.",
    "Once a month, write the slowest figure in the scoreboard below.",
  ],
};

const NO_SHOW_LOG: LogShape = {
  columns: ["Date", "Name", "Treatment", "Reminder sent", "Confirmed?", "Outcome"],
  rows: [
    ["11 Sep", "Hannah B", "Facial", "48h + 24h", "Yes", "Attended"],
    ["12 Sep", "Priya N", "Massage", "48h only", "No", "No-show"],
    ["13 Sep", "Dani R", "Facial", "48h + 24h", "Yes", "Moved"],
  ],
  worked: "September: 96 appointments booked, 9 missed. 9 ÷ 96 = 9%.",
  whichMonth:
    "Count the month just gone, and treat a cancellation you could not refill the same as a no-show, because it cost you the same.",
  monday: [
    "Mark last week's misses in the diary while you still remember them.",
    "Note whether each one had confirmed the reminder.",
    "Once a month, work out the rate and write it in the scoreboard below.",
  ],
};

const REPEAT_LOG: LogShape = {
  columns: ["Date", "Name", "New or returning", "Treatment", "Rebooked before leaving?", "Next visit"],
  rows: [
    ["11 Sep", "Hannah B", "Returning", "Facial", "Yes", "9 Oct"],
    ["12 Sep", "Priya N", "New", "Massage", "No", "-"],
    ["13 Sep", "Dani R", "Returning", "Facial", "Yes", "25 Oct"],
  ],
  worked: "September: 96 appointments, 38 with clients who had been before. 38 ÷ 96 = 40%.",
  whichMonth:
    "Count the month just gone. Rebooking habits show up within weeks, so this is the number that moves first.",
  monday: [
    "Add last week's appointments to the log, marking new or returning.",
    "Note who left with their next visit already booked.",
    "Once a month, work out the number and write it in the scoreboard below.",
  ],
};

const REVIEW_LOG: LogShape = {
  columns: ["Date", "Name", "Treatment", "Request sent?", "Review left?", "Rating"],
  rows: [
    ["11 Sep", "Hannah B", "Facial", "Yes", "Yes", "5"],
    ["12 Sep", "Priya N", "Massage", "Yes", "No", "-"],
    ["13 Sep", "Dani R", "Facial", "No", "No", "-"],
  ],
  worked: "End of September: 64 reviews in total, 7 of them new that month, averaging 4.8.",
  whichMonth:
    "Write the running total on the same date each month, so the new-reviews figure always covers the same length of time.",
  monday: [
    "Check which of last week's clients were sent a request.",
    "Reply to any review that arrived.",
    "Once a month, write the total, the new ones and the average in the scoreboard below.",
  ],
};

const BOOKING_LOG: LogShape = {
  columns: ["Date", "Name", "Treatment", "How it was booked", "Messages first?", "Deposit taken?"],
  rows: [
    ["11 Sep", "Hannah B", "Facial", "Online", "No", "Yes"],
    ["12 Sep", "Priya N", "Massage", "By phone", "Yes", "No"],
    ["13 Sep", "Dani R", "Facial", "Online", "No", "Yes"],
  ],
  worked: "September: 96 bookings, 59 made online with no messages first. 59 ÷ 96 = 61%.",
  whichMonth:
    "Count the month just gone. If your system does not split online from manual, tally the manual ones for a fortnight instead.",
  monday: [
    "Add last week's bookings to the log, marking how each one was made.",
    "Note any that needed messages before they could book.",
    "Once a month, work out the number and write it in the scoreboard below.",
  ],
};

const ATTENDANCE_LOG: LogShape = {
  columns: ["Date", "Name", "Treatment", "Confirmation sent", "Form returned?", "Arrived?"],
  rows: [
    ["11 Sep", "Hannah B", "Facial", "At booking", "Yes", "On time"],
    ["12 Sep", "Priya N", "Massage", "At booking", "No", "Late"],
    ["13 Sep", "Dani R", "Facial", "None", "No", "No-show"],
  ],
  worked: "September: 22 first-time bookings, 19 arrived. 19 ÷ 22 = 86%.",
  whichMonth: "Count new clients only, for the month just gone. Returning clients behave differently.",
  monday: [
    "Add last week's first-time bookings to the log.",
    "Note who returned their form before the day.",
    "Once a month, work out the number and write it in the scoreboard below.",
  ],
};

const SOURCES_LOG: LogShape = {
  columns: ["Date", "Name", "Where they came from", "What they asked about", "Booked?", "First appointment"],
  rows: [
    ["3 Sep", "Hannah B", "Instagram", "Facial", "Yes", "11 Sep"],
    ["4 Sep", "Priya N", "Google", "Prices", "No", "-"],
    ["6 Sep", "Dani R", "Referral", "Availability", "Yes", "19 Sep"],
  ],
  worked:
    "September: 41 enquiries - 18 from Google, 14 from Instagram, 9 from referrals. Three routes, none of them carrying everything.",
  whichMonth:
    "Count the month just gone, and look at which route produced paying clients rather than which produced the most messages.",
  monday: [
    "Add last week's enquiries to the log, one line each.",
    "Make sure every line says where that person came from.",
    "Once a month, count them by route and write the total in the scoreboard below.",
  ],
};

const BY_KPI: Record<string, LogShape> = {
  "Enquiry-to-client conversion": ENQUIRY_LOG,
  "Enquiry response time": RESPONSE_LOG,
  "No-show rate": NO_SHOW_LOG,
  "Repeat client rate": REPEAT_LOG,
  "Google reviews": REVIEW_LOG,
  "Bookings taken without you": BOOKING_LOG,
  "First-appointment attendance": ATTENDANCE_LOG,
  "New enquiries a month": SOURCES_LOG,
};

export function logFor(kpi: string): LogShape {
  return BY_KPI[kpi] ?? ENQUIRY_LOG;
}

export const WHERE_TO_KEEP_IT =
  "A spreadsheet, a notes app or your booking system's client notes all work. What matters is one line per person.";
