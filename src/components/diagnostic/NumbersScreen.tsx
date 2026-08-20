"use client";

import { motion } from "framer-motion";
import { NUMBERS_QUESTIONS, NUMBERS_KEYS } from "@/lib/diagnostic/sections";
import { hasAnswer } from "@/lib/diagnostic/scoring";
import type { Answers, AnswerValue } from "@/lib/diagnostic/types";
import { QuestionControl } from "./questions";
import { Button, Card, Eyebrow, Wordmark } from "./ui";

/*
  The last screen before results. Two unscored numbers, asked once they're
  invested — they're what lets the results talk in pounds rather than points.
*/
export function NumbersScreen({
  answers,
  onAnswer,
  onBack,
  onFinish,
}: {
  answers: Answers;
  onAnswer: (key: string, value: AnswerValue) => void;
  onBack: () => void;
  onFinish: () => void;
}) {
  const keys = [NUMBERS_KEYS.appointments, NUMBERS_KEYS.value];
  const complete = keys.every((key, i) => hasAnswer(NUMBERS_QUESTIONS[i], answers[key]));

  return (
    <div className="min-h-screen pb-32 sm:pb-16">
      <header className="border-b border-tulivo-line/70 bg-tulivo-canvas/85">
        <div className="mx-auto w-full max-w-[720px] px-5 py-4 sm:px-8">
          <div className="flex items-center justify-between">
            <Wordmark />
            <span className="text-[12px] font-medium text-tulivo-muted">Last step</span>
          </div>
          <div className="mt-3 h-[3px] w-full overflow-hidden rounded-full bg-tulivo-line">
            <div className="h-full w-full rounded-full bg-tulivo-clay" />
          </div>
        </div>
      </header>

      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="mx-auto w-full max-w-[720px] px-5 pt-10 sm:px-8 sm:pt-14"
      >
        <Eyebrow>Two last numbers</Eyebrow>
        <h1 className="mt-3 text-[30px] font-semibold leading-[1.1] tracking-[-0.03em] text-tulivo-ink sm:text-[36px]">
          What are the gaps costing you?
        </h1>
        <p className="mt-3 text-[16px] leading-relaxed text-tulivo-muted sm:text-[17px]">
          Rough figures are fine. They let us put a pound value on what you&apos;re losing, instead of
          leaving it as a score.
        </p>

        <div className="mt-9 space-y-4">
          {NUMBERS_QUESTIONS.map((question, i) => (
            <Card key={question.id} className="p-5 sm:p-7">
              <h2 className="text-[17px] font-medium leading-snug tracking-[-0.015em] text-tulivo-ink sm:text-[18px]">
                {question.prompt}
              </h2>
              {question.hint && (
                <p className="mt-1.5 text-[13px] leading-relaxed text-tulivo-faint">{question.hint}</p>
              )}
              <div className="mt-5">
                <QuestionControl
                  question={question}
                  value={answers[keys[i]]}
                  onChange={(value) => onAnswer(keys[i], value)}
                />
              </div>
            </Card>
          ))}
        </div>

        <p className="mt-5 text-[13px] leading-relaxed text-tulivo-faint">
          Nothing here is shared or published — it&apos;s used to work out what your gaps are worth, and
          it appears in your own report.
        </p>

        <div className="mt-10 hidden items-center justify-between sm:flex">
          <Button variant="quiet" onClick={onBack} type="button">
            ← Back
          </Button>
          <Button onClick={onFinish} disabled={!complete} type="button">
            See your results →
          </Button>
        </div>
      </motion.div>

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-tulivo-line/70 bg-tulivo-canvas/92 px-5 pb-[max(14px,env(safe-area-inset-bottom))] pt-3 backdrop-blur-md sm:hidden">
        <div className="flex items-center gap-3">
          <Button variant="ghost" onClick={onBack} type="button" className="min-w-[92px] px-5">
            Back
          </Button>
          <Button onClick={onFinish} disabled={!complete} type="button" full>
            See your results
          </Button>
        </div>
      </div>
    </div>
  );
}
