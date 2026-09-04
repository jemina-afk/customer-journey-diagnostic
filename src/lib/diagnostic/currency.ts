/*
  Currency support.

  The diagnostic prices someone's own gaps, so the symbol has to be theirs. It
  deliberately does not convert: the bands and the numbers people type are read
  as amounts in whatever currency they picked, which is how they think about
  their own prices anyway. Converting would need a live rate and would make the
  estimate harder to believe, not easier.

  Static copy that carries a money amount uses the generic currency sign (¤) as
  a placeholder, swapped for the chosen symbol by `localise` at render time.
*/

export interface Currency {
  code: string;
  symbol: string;
  /** Shown in the picker. */
  label: string;
  /** Locale used for thousands separators. */
  locale: string;
}

export const CURRENCIES: readonly Currency[] = [
  { code: "GBP", symbol: "£", label: "£ British pound", locale: "en-GB" },
  { code: "USD", symbol: "$", label: "$ US dollar", locale: "en-US" },
  { code: "EUR", symbol: "€", label: "€ Euro", locale: "en-IE" },
  { code: "AUD", symbol: "A$", label: "A$ Australian dollar", locale: "en-AU" },
  { code: "CAD", symbol: "C$", label: "C$ Canadian dollar", locale: "en-CA" },
  { code: "NZD", symbol: "NZ$", label: "NZ$ New Zealand dollar", locale: "en-NZ" },
  { code: "CHF", symbol: "CHF ", label: "CHF Swiss franc", locale: "de-CH" },
  { code: "AED", symbol: "AED ", label: "AED UAE dirham", locale: "en-AE" },
  { code: "ZAR", symbol: "R", label: "R South African rand", locale: "en-ZA" },
  { code: "SGD", symbol: "S$", label: "S$ Singapore dollar", locale: "en-SG" },
];

export const DEFAULT_CURRENCY = CURRENCIES[0];

/** The placeholder used in static copy, so it can carry any currency. */
export const CURRENCY_MARK = "¤";

export function currencyFor(code: string | undefined | null): Currency {
  if (!code) return DEFAULT_CURRENCY;
  return CURRENCIES.find((c) => c.code === code) ?? DEFAULT_CURRENCY;
}

/** A whole-number amount with the chosen symbol, e.g. "£8,100". */
export function money(value: number, currency: Currency = DEFAULT_CURRENCY): string {
  return `${currency.symbol}${Math.round(value).toLocaleString(currency.locale)}`;
}

/** Swaps the ¤ placeholder in static copy for the chosen symbol. */
export function localise(text: string, currency: Currency = DEFAULT_CURRENCY): string {
  return text.includes(CURRENCY_MARK) ? text.split(CURRENCY_MARK).join(currency.symbol) : text;
}
