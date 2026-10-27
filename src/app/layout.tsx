import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";

/*
  One typeface carries the page: Switzer, self-hosted from Fontshare. Headlines
  are weight 500 and tightly tracked, body copy is 400. Cormorant Garamond is
  kept for one thing only, the tulivo wordmark.
*/
const switzer = localFont({
  src: [
    { path: "../fonts/switzer-400.woff2", weight: "400", style: "normal" },
    { path: "../fonts/switzer-500.woff2", weight: "500", style: "normal" },
    { path: "../fonts/switzer-600.woff2", weight: "600", style: "normal" },
  ],
  display: "swap",
  variable: "--font-switzer",
  fallback: ["ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "sans-serif"],
});

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["500"],
  display: "swap",
  variable: "--font-cormorant",
});

export const metadata: Metadata = {
  title: "Customer Journey Diagnostic - Tulivo Digital",
  description:
    "See where your business loses enquiries, what each gap costs you, and what to fix first. A free diagnostic for service business owners.",
  openGraph: {
    title: "Customer Journey Diagnostic - Tulivo Digital",
    description:
      "Discover exactly where your business is losing enquiries - and what to fix first.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#F5F3EF",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-GB" className={`${switzer.variable} ${cormorant.variable}`}>
      <body className="min-h-screen font-sans antialiased">{children}</body>
    </html>
  );
}
