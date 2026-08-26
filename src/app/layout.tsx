import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Customer Journey Diagnostic - Tulivo Digital",
  description:
    "Discover exactly where your business is losing enquiries - and what to fix first. A free 10-minute diagnostic for wellness and beauty business owners.",
  openGraph: {
    title: "Customer Journey Diagnostic - Tulivo Digital",
    description:
      "Discover exactly where your business is losing enquiries - and what to fix first.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#faf7f3",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-GB" className={inter.variable}>
      <body className="min-h-screen font-display antialiased">
        <div className="tulivo-wash" />
        {children}
      </body>
    </html>
  );
}
