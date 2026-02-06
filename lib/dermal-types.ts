// Quiz flow & report types for Dermal AI

export type QuizStep = 1 | 2 | 3;

export interface QuizAnswers {
  geneticAgingPattern: string | null;
  environmentalExposure: string | null;
  skinStateOnWaking: string | null;
}

export interface DermalReport {
  profileId: string;
  headline: "Bio-Age Accelerated" | "Bio-Age Aligned" | "Bio-Age Optimized";
  description: string;
  bioAgeVariance: string; // e.g. "+4.2y"
  metrics: {
    uvDamage: { value: number; trend: "up" | "down" | "neutral" };
    hydration: { value: number; trend: "up" | "down" | "neutral" };
    inflammation: "High" | "Moderate" | "Low";
    dermalBioAge: string;
  };
  findings: Array<{
    id: string;
    title: string;
    icon: "warning" | "alert";
    description: string;
  }>;
  diagnosticLogLines?: Array<{ time: string; tag: string; message: string }>;
}

export const QUIZ_METRICS = [
  {
    id: 1 as QuizStep,
    label: "METRIC 01",
    title: "Genetic History & Vulnerability",
    question:
      "Which aging pattern is most prominent in your biological lineage?",
    options: [
      "Sagging/Volume Loss",
      "Deep Static Lines",
      "Hyperpigmentation",
      "Texture/Elasticity",
    ],
  },
  {
    id: 2 as QuizStep,
    label: "METRIC 02",
    title: "Cellular Stress Profile",
    question:
      "Average daily exposure to environmental pollutants and screen radiation?",
    options: [
      "Heavy (Urban/Office)",
      "Moderate",
      "Low (Controlled)",
    ],
  },
  {
    id: 3 as QuizStep,
    label: "METRIC 03",
    title: "Dermal Recovery Cycles",
    question: "Identify your skin's state upon waking from rest.",
    options: [
      "Oily/Congested",
      "Taut/Parched",
      "Dull/Fatigued",
      "Balanced/Refreshed",
    ],
  },
] as const;
