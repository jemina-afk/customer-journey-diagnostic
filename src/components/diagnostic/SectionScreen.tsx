"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { SECTIONS } from "@/lib/diagnostic/sections";
import { hasAnswer, questionKey, sectionComplete } from "@/lib/diagnostic/scoring";
import type { Answers, AnswerValue, Section } from "@/lib/diagnostic/types";
import { QuestionControl } from "./questions";
import { Button, Card, Wordmark } from "./ui";

export function SectionScreen({
  section,
  index,
  answers,
  onAnswer,
  onBack,
  onNext,
  progress,
}: {
  section: Section;
  index: number;
  answers: Answers;
  onAnswer: (key: string, value: AnswerValue) => void;
  onBack: () => void;
  onNext: () => void;
  /** 0–1 across the whole assessment. */
  progress: number;
}) {
  const top = useRef<HTMLDivElement>(null);
  const complete = sectionComplete(section, answers);
  const isLast = index === SECTIONS.length - 1;

  useEffect(() => {
    top.current?.scrollIntoView({ block: "start" });
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [index]);

  return (
    <div ref={top} className="min-h-screen pb-32 sm:pb-16">
      {/* Progress stays pinned so it's always visible, even mid-scroll on a phone. */}
      <header className="sticky top-0 z-20 border-b border-tulivo-line/70 bg-tulivo-canvas/85 backdrop-blur-md">
        <div className="mx-auto w-full max-w-[720px] px-5 pt-4 sm:px-8">
          <div className="flex items-center justify-between">
            <Wordmark />
            <span className="tabular text-[12px] font-medium text-tulivo-muted">
              Stage {index + 1} of {SECTIONS.length}
            </span>
          </div>
          <div className="mt-3 h-[3px] w-full overflow-hidden rounded-full bg-tulivo-line">
            <motion.div
              className="h-full rounded-full bg-tulivo-clay"
              initial={false}
              animate={{ width: `${Math.round(progress * 100)}%` }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            />
          </div>
          <div className="flex gap-1 pb-3 pt-2">
            {SECTIONS.map((s, i) => (
              <span
                key={s.id}
                className={cn(
                  "h-1 flex-1 rounded-full transition-colors duration-300",
                  i < index ? "bg-tulivo-clay/45" : i === index ? "bg-tulivo-clay" : "bg-tulivo-line",
                )}
              />
            ))}
          </div>
        </div>
      </header>

      <motion.div
        key={section.id}
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="mx-auto w-full max-w-[720px] px-5 pt-10 sm:px-8 sm:pt-14"
      >
        <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-tulivo-clay">
          Stage {index + 1}
        </p>
        <h1 className="mt-3 text-[30px] font-semibold leading-[1.1] tracking-[-0.03em] text-tulivo-ink sm:text-[36px]">
          {section.title}
        </h1>
        <p className="mt-3 text-[16px] leading-relaxed text-tulivo-muted sm:text-[17px]">{section.context}</p>

        <div className="mt-9 space-y-4">
          {section.questions.map((question, qi) => {
            const key = questionKey(section, question);
            const answered = hasAnswer(question, answers[key]);
            return (
              <Card key={question.id} className="p-5 sm:p-7">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2.5">
                      <span className="tabular text-[11px] font-semibold text-tulivo-faint">
                        {String(qi + 1).padStart(2, "0")}
                      </span>
                      {question.kind === "multi" && (
                        <span className="rounded-full bg-tulivo-veil px-2 py-[3px] text-[10px] font-medium uppercase tracking-[0.12em] text-tulivo-muted">
                          Select all that apply
                        </span>
                      )}
                      {question.kind === "text" && (
                        <span className="rounded-full bg-tulivo-veil px-2 py-[3px] text-[10px] font-medium uppercase tracking-[0.12em] text-tulivo-muted">
                          Optional
                        </span>
                      )}
                    </div>
                    <h2 className="mt-2 text-[17px] font-medium leading-snug tracking-[-0.015em] text-tulivo-ink sm:text-[18px]">
                      {question.prompt}
                    </h2>
                    {question.hint && (
                      <p className="mt-1.5 text-[13px] leading-relaxed text-tulivo-faint">{question.hint}</p>
                    )}
                  </div>
                  <motion.span
                    initial={false}
                    animate={{ opacity: answered ? 1 : 0, scale: answered ? 1 : 0.7 }}
                    transition={{ duration: 0.25 }}
                    className="mt-1 flex h-6 w-6 flex-none items-center justify-center rounded-full bg-tulivo-green/12"
                    aria-hidden
                  >
                    <svg viewBox="0 0 16 16" className="h-3.5 w-3.5">
                      <path
                        d="M3.5 8.4l3 3 6-6.8"
                        fill="none"
                        stroke="rgb(var(--t-green))"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </motion.span>
                </div>

                <div className="mt-5">
                  <QuestionControl
                    question={question}
                    value={answers[key]}
                    onChange={(value) => onAnswer(key, value)}
                    detail={answers[`${key}.detail`]}
                    onDetail={(value) => onAnswer(`${key}.detail`, value)}
                  />
                </div>
              </Card>
            );
          })}
        </div>

        {/* Desktop navigation. */}
        <div className="mt-10 hidden items-center justify-between sm:flex">
          <Button variant="quiet" onClick={onBack} type="button">
            ← Back
          </Button>
          <div className="flex items-center gap-4">
            {!complete && (
              <span className="text-[13px] text-tulivo-faint">Answer every question to continue</span>
            )}
            <Button onClick={onNext} disabled={!complete} type="button">
              {isLast ? "See your results" : "Continue"} →
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Mobile navigation, thumb-height and always reachable. */}
      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-tulivo-line/70 bg-tulivo-canvas/92 px-5 pb-[max(14px,env(safe-area-inset-bottom))] pt-3 backdrop-blur-md sm:hidden">
        <div className="flex items-center gap-3">
          <Button variant="ghost" onClick={onBack} type="button" className="min-w-[92px] px-5">
            Back
          </Button>
          <Button onClick={onNext} disabled={!complete} type="button" full>
            {complete ? (isLast ? "See your results" : "Continue") : "Answer all to continue"}
          </Button>
        </div>
      </div>
    </div>
  );
}
