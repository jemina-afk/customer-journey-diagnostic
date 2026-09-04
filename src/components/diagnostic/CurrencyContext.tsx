"use client";

import { createContext, useContext } from "react";
import { DEFAULT_CURRENCY, localise, type Currency } from "@/lib/diagnostic/currency";

/*
  Question copy is static data shared by every reader, so the money amounts in
  it are written with the ¤ placeholder. Rather than thread the chosen currency
  through every control, the app publishes it once and the controls read it.
*/
const CurrencyContext = createContext<Currency>(DEFAULT_CURRENCY);

export function CurrencyProvider({
  currency,
  children,
}: {
  currency: Currency;
  children: React.ReactNode;
}) {
  return <CurrencyContext.Provider value={currency}>{children}</CurrencyContext.Provider>;
}

export function useCurrency(): Currency {
  return useContext(CurrencyContext);
}

/** Swaps ¤ for the reader's symbol. */
export function useMoneyText(): (text: string) => string {
  const currency = useCurrency();
  return (text: string) => localise(text, currency);
}
