"use client";

import { cn } from "@/lib/utils";
import type {
  AnswerValue,
  ChoiceQuestion,
  MultiQuestion,
  Question,
  ScaleQuestion,
  SliderQuestion,
  TextQuestion,
} from "@/lib/diagnostic/types";
import { inputClass } from "./ui";

/* One control per question kind. Everything is a real, large tap target —
   most people complete this on a phone, between clients. */

function Tick({ checked, round }: { checked: boolean; round?: boolean }) {
  return (
    <span
      className={cn(
        "mt-[2px] flex h-6 w-6 flex-none items-center justify-center border transition-all duration-200",
        round ? "rounded-full" : "rounded-[7px]",
        checked ? "border-tulivo-clay bg-tulivo-clay" : "border-tulivo-line bg-white",
      )}
      aria-hidden
    >
      <svg viewBox="0 0 16 16" className={cn("h-3.5 w-3.5", checked ? "opacity-100" : "opacity-0")}>
        <path
          d="M3.5 8.4l3 3 6-6.8"
          fill="none"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

const optionRow =
  "flex w-full items-start gap-3.5 rounded-[16px] border px-4 py-4 text-left text-[15px] leading-snug transition-all duration-200 min-h-[60px]";

function ChoiceControl({
  question,
  value,
  onChange,
}: {
  question: ChoiceQuestion;
  value: AnswerValue | undefined;
  onChange: (v: AnswerValue) => void;
}) {
  return (
    <div role="radiogroup" aria-label={question.prompt} className="grid gap-2.5">
      {question.options.map((option) => {
        const checked = value === option.value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={checked}
            onClick={() => onChange(option.value)}
            className={cn(
              optionRow,
              checked
                ? "border-tulivo-clay bg-tulivo-clay-soft/70 text-tulivo-ink shadow-[0_8px_20px_-16px_rgba(154,71,47,0.9)]"
                : "border-tulivo-line bg-white/60 text-tulivo-ink hover:border-tulivo-clay/40 hover:bg-tulivo-clay-soft/30",
            )}
          >
            <Tick checked={checked} round />
            <span className={cn(checked && "font-medium")}>{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}

function MultiControl({
  question,
  value,
  onChange,
}: {
  question: MultiQuestion;
  value: AnswerValue | undefined;
  onChange: (v: AnswerValue) => void;
}) {
  const selected = Array.isArray(value) ? value : [];
  function toggle(option: string) {
    onChange(
      selected.includes(option) ? selected.filter((v) => v !== option) : [...selected, option],
    );
  }
  return (
    <div className="grid gap-2.5 sm:grid-cols-2">
      {question.options.map((option) => {
        const checked = selected.includes(option.value);
        return (
          <button
            key={option.value}
            type="button"
            role="checkbox"
            aria-checked={checked}
            onClick={() => toggle(option.value)}
            className={cn(
              optionRow,
              checked
                ? "border-tulivo-clay bg-tulivo-clay-soft/70 text-tulivo-ink shadow-[0_8px_20px_-16px_rgba(154,71,47,0.9)]"
                : "border-tulivo-line bg-white/60 text-tulivo-ink hover:border-tulivo-clay/40 hover:bg-tulivo-clay-soft/30",
            )}
          >
            <Tick checked={checked} />
            <span className={cn(checked && "font-medium")}>{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}

function SliderControl({
  question,
  value,
  onChange,
}: {
  question: SliderQuestion;
  value: AnswerValue | undefined;
  onChange: (v: AnswerValue) => void;
}) {
  const current = typeof value === "number" ? value : question.defaultValue;
  const fill = ((current - question.min) / (question.max - question.min)) * 100;
  const display = question.format ? question.format(current) : `${current}${question.unit ?? ""}`;

  return (
    <div>
      <div className="flex items-end justify-between">
        <span className="tabular text-[34px] font-semibold leading-none tracking-[-0.03em] text-tulivo-clay">
          {display}
        </span>
        {typeof value !== "number" && (
          <span className="text-[12px] text-tulivo-faint">Drag to set your answer</span>
        )}
      </div>
      <input
        type="range"
        className="t-range mt-3"
        style={{ ["--fill" as string]: `${fill}%` }}
        min={question.min}
        max={question.max}
        step={question.step}
        value={current}
        aria-label={question.prompt}
        aria-valuetext={display}
        onChange={(e) => onChange(Number(e.target.value))}
      />
      {question.endLabels && (
        <div className="flex justify-between text-[12px] text-tulivo-faint">
          <span>{question.endLabels[0]}</span>
          <span>{question.endLabels[1]}</span>
        </div>
      )}
    </div>
  );
}

function ScaleControl({
  question,
  value,
  onChange,
}: {
  question: ScaleQuestion;
  value: AnswerValue | undefined;
  onChange: (v: AnswerValue) => void;
}) {
  return (
    <div>
      <div role="radiogroup" aria-label={question.prompt} className="grid grid-cols-5 gap-2">
        {[1, 2, 3, 4, 5].map((n) => {
          const checked = value === n;
          return (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={checked}
              onClick={() => onChange(n)}
              className={cn(
                "tabular flex h-[62px] items-center justify-center rounded-[16px] border text-[18px] font-medium transition-all duration-200",
                checked
                  ? "border-tulivo-clay bg-tulivo-clay text-white shadow-[0_10px_22px_-14px_rgba(154,71,47,0.9)]"
                  : "border-tulivo-line bg-white/60 text-tulivo-muted hover:border-tulivo-clay/40 hover:bg-tulivo-clay-soft/30",
              )}
            >
              {n}
            </button>
          );
        })}
      </div>
      <div className="mt-2 flex justify-between text-[12px] text-tulivo-faint">
        <span>{question.lowLabel}</span>
        <span>{question.highLabel}</span>
      </div>
    </div>
  );
}

function TextControl({
  question,
  value,
  onChange,
}: {
  question: TextQuestion;
  value: AnswerValue | undefined;
  onChange: (v: AnswerValue) => void;
}) {
  return (
    <textarea
      className={`${inputClass} min-h-[112px] resize-y py-3.5 leading-relaxed`}
      placeholder={question.placeholder}
      aria-label={question.prompt}
      value={typeof value === "string" ? value : ""}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

export function QuestionControl({
  question,
  value,
  onChange,
}: {
  question: Question;
  value: AnswerValue | undefined;
  onChange: (v: AnswerValue) => void;
}) {
  switch (question.kind) {
    case "choice":
      return <ChoiceControl question={question} value={value} onChange={onChange} />;
    case "multi":
      return <MultiControl question={question} value={value} onChange={onChange} />;
    case "slider":
      return <SliderControl question={question} value={value} onChange={onChange} />;
    case "scale":
      return <ScaleControl question={question} value={value} onChange={onChange} />;
    case "text":
      return <TextControl question={question} value={value} onChange={onChange} />;
  }
}
