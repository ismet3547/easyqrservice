"use client";

import { Check } from "lucide-react";
import type { ReactNode } from "react";
import { useAppLocale } from "@/components/LocaleProvider";

const activationSteps = [
  { en: "Account", tr: "Hesap" },
  { en: "Menu", tr: "Menü" },
  { en: "Publish", tr: "Yayınla" },
  { en: "Test", tr: "Test et" },
] as const;

export function ActivationGuide({
  action,
  currentStep,
  description,
  title,
}: {
  action: ReactNode;
  currentStep: 3 | 4;
  description: string;
  title: string;
}) {
  const { locale } = useAppLocale();

  return (
    <section className="activation-guide" aria-label={locale === "tr" ? "İlk menü kurulum rehberi" : "First menu setup guide"}>
      <div className="activation-guide-copy">
        <span>{locale === "tr" ? `Adım ${currentStep}/4` : `Step ${currentStep} of 4`}</span>
        <strong>{title}</strong>
        <p>{description}</p>
      </div>

      <ol className="activation-guide-steps">
        {activationSteps.map((step, index) => {
          const stepNumber = index + 1;
          const complete = stepNumber < currentStep;
          const current = stepNumber === currentStep;
          return (
            <li className={`${complete ? "complete" : ""} ${current ? "current" : ""}`} key={step.en} aria-current={current ? "step" : undefined}>
              <i>{complete ? <Check size={12} /> : stepNumber}</i>
              <span>{locale === "tr" ? step.tr : step.en}</span>
            </li>
          );
        })}
      </ol>

      <div className="activation-guide-action">{action}</div>
    </section>
  );
}
