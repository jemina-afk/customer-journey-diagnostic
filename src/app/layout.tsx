import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Inter, Italiana } from "next/font/google";
import "./globals.css";

/* The brand's three roles: display, secondary serif, body. Nothing else. */
const inter = Inter({ subsets: ["latin"], display: "swap", variable: "--font-inter" });

const italiana = Italiana({
  subsets: ["latin"],
  weight: "400",
  display: "swap",
  variable: "--font-italiana",
});

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["500", "600"],
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
    <html
      lang="en-GB"
      className={`${inter.variable} ${italiana.variable} ${cormorant.variable}`}
    >
      <body className="min-h-screen font-sans antialiased">{children}</body>
    </html>
  );
}
