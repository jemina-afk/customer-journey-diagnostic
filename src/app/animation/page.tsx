import type { Metadata } from "next";
import { AnimationStage } from "@/components/journey/AnimationStage";

/*
  The animation on its own, at a chosen size, so it can be recorded for reels
  or embedded elsewhere. Not for people to find:

    /animation?variant=leaking&ratio=9x16&theme=navy
    /animation?variant=fixed&ratio=1x1&t=12.5

  `t` freezes a single frame, which is how scripts/record-animation.mjs walks
  the whole thing and hands the frames to ffmpeg.
*/

export const metadata: Metadata = {
  title: "Customer journey animation - Tulivo Digital",
  robots: { index: false, follow: false },
};

export default function AnimationPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const one = (key: string) => {
    const v = searchParams[key];
    return Array.isArray(v) ? v[0] : v;
  };
  const t = one("t");
  return (
    <AnimationStage
      variant={one("variant") === "fixed" ? "fixed" : "leaking"}
      ratio={(one("ratio") as "9x16" | "1x1" | "16x9") ?? "9x16"}
      theme={one("theme") === "light" ? "light" : "navy"}
      time={t === undefined ? undefined : Number(t)}
    />
  );
}
