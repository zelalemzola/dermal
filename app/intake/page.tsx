"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/dermal/Header";
import { Button } from "@/components/ui/button";
import {
  QUIZ_METRICS,
  type QuizStep,
  type QuizAnswers,
} from "@/lib/dermal-types";
import { cn } from "@/lib/utils";

const TOTAL_STEPS = 3;

export default function IntakePage() {
  const router = useRouter();
  const [step, setStep] = useState<QuizStep>(1);
  const [answers, setAnswers] = useState<QuizAnswers>({
    geneticAgingPattern: null,
    environmentalExposure: null,
    skinStateOnWaking: null,
  });

  const metric = QUIZ_METRICS[step - 1];
  const currentAnswer =
    step === 1
      ? answers.geneticAgingPattern
      : step === 2
        ? answers.environmentalExposure
        : answers.skinStateOnWaking;

  const setAnswer = useCallback(
    (value: string) => {
      setAnswers((prev) => {
        const next = { ...prev };
        if (step === 1) next.geneticAgingPattern = value;
        else if (step === 2) next.environmentalExposure = value;
        else next.skinStateOnWaking = value;
        return next;
      });
    },
    [step]
  );

  const goNext = () => {
    if (step < TOTAL_STEPS) setStep((s) => (s + 1) as QuizStep);
    else {
      // Persist for capture/analyze
      if (typeof window !== "undefined") {
        sessionStorage.setItem("dermal_quiz", JSON.stringify(answers));
      }
      router.push("/capture");
    }
  };

  const goBack = () => {
    if (step > 1) setStep((s) => (s - 1) as QuizStep);
    else router.push("/");
  };

  const progressPercent = (step / TOTAL_STEPS) * 100;

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main className="pt-28 px-6 pb-16 max-w-xl mx-auto">
        <div className="mb-8">
          <p className="text-sm font-semibold text-[#3b82f6] mb-2">
            {metric.label}
          </p>
          <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#3b82f6] rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <p className="text-right text-sm text-gray-500 mt-1">
            {step}/{TOTAL_STEPS}
          </p>
        </div>

        <h2 className="text-2xl font-bold text-[#0f172a] mb-2">
          {metric.title}
        </h2>
        <p className="text-gray-600 mb-8">{metric.question}</p>

        <ul className="space-y-3">
          {metric.options.map((option) => (
            <li key={option}>
              <button
                type="button"
                onClick={() => setAnswer(option)}
                className={cn(
                  "w-full flex items-center justify-between rounded-xl border-2 px-4 py-3.5 text-left transition-all duration-200",
                  currentAnswer === option
                    ? "border-[#3b82f6] bg-blue-50/50"
                    : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50/50"
                )}
              >
                <span className="font-medium text-[#0f172a]">{option}</span>
                <span
                  className={cn(
                    "flex h-5 w-5 shrink-0 rounded-full border-2 flex items-center justify-center",
                    currentAnswer === option
                      ? "border-[#3b82f6] bg-[#3b82f6]"
                      : "border-gray-300"
                  )}
                >
                  {currentAnswer === option && (
                    <span className="h-1.5 w-1.5 rounded-full bg-white" />
                  )}
                </span>
              </button>
            </li>
          ))}
        </ul>

        <div className="flex gap-3 mt-10">
          <Button
            variant="outline"
            onClick={goBack}
            className="flex-1 rounded-md border-gray-200 text-[#0f172a]"
          >
            Back
          </Button>
          <Button
            onClick={goNext}
            disabled={!currentAnswer}
            className="flex-1 rounded-md bg-[#3b82f6] text-white hover:bg-[#2563eb]"
          >
            {step < TOTAL_STEPS ? "Next" : "Continue"}
          </Button>
        </div>
      </main>
    </div>
  );
}
