import type { Metadata } from "next";
import { LinkMaker } from "@/components/diagnostic/LinkMaker";

export const metadata: Metadata = {
  title: "Client links - Tulivo Digital",
  robots: { index: false, follow: false },
};

export default function LinksPage() {
  return <LinkMaker />;
}
