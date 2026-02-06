import { streamText, generateText, Output } from "ai";
import { z } from "zod";
import type { QuizAnswers } from "@/lib/dermal-types";

const reportSchema = z.object({
  profileId: z.string(),
  headline: z.enum(["Bio-Age Accelerated", "Bio-Age Aligned", "Bio-Age Optimized"]),
  description: z.string(),
  bioAgeVariance: z.string(),
  metrics: z.object({
    uvDamage: z.object({ value: z.number(), trend: z.enum(["up", "down", "neutral"]) }),
    hydration: z.object({ value: z.number(), trend: z.enum(["up", "down", "neutral"]) }),
    inflammation: z.enum(["High", "Moderate", "Low"]),
    dermalBioAge: z.string(),
  }),
  findings: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      icon: z.enum(["warning", "alert"]),
      description: z.string(),
    })
  ),
});

export type DermalReportOutput = z.infer<typeof reportSchema>;

const DIAGNOSTIC_LOG_PROMPT = `You are a clinical dermal analysis system. Output ONLY a list of diagnostic log lines. Each line must be in this exact format:
HH:MM:SS [TAG] MESSAGE

Use tags: [OK] for success, [..] for in progress, [!!] for notable finding.
Use realistic short technical messages like: AUTHENTICATING_BIOMETRIC_ENCRYPTION, UV_SPECTRUM_MAPPING_INITIALIZED, ANALYZING_NASOLABIAL_VECTORS, DETECTING_SUB_DURMAL_INFLAMMATION, IRREGULAR_COLLAGEN_PATTERN_DETECTED, CROSS_REF_GENETIC_PROFILE_ID_7, BARRIER_INTEGRITY_INDEX_FINALIZED, CALCULATING_BIO_AGE_VARIANCE.
Output exactly 10-12 lines, one per line. Use current time format for HH:MM:SS. No other text.`;

export async function POST(req: Request) {
  let quiz: QuizAnswers = {
    geneticAgingPattern: null,
    environmentalExposure: null,
    skinStateOnWaking: null,
  };
  let image: string | undefined;
  try {
    const body = await req.json();
    if (body?.quiz && typeof body.quiz === "object") {
      quiz = { ...quiz, ...body.quiz };
    }
    if (typeof body?.image === "string" && body.image.startsWith("data:image")) {
      image = body.image;
    }
  } catch {
    // use defaults
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: string) => {
        controller.enqueue(encoder.encode(`event: ${event}\ndata: ${data}\n\n`));
      };

      try {
        // Phase 1: Stream diagnostic log lines from AI (with image when provided)
        const logPrompt = image
          ? `You are a clinical dermal analysis system. Analyze the attached face image and output ONLY a list of diagnostic log lines that reflect what you observe: skin texture, tone, visible concerns (e.g. under-eye, nasolabial, forehead), and any signs of sun damage or aging. Each line must be in this exact format:
HH:MM:SS [TAG] MESSAGE
Use tags: [OK] for success/completed step, [..] for in progress, [!!] for notable finding. Use realistic short technical messages like: AUTHENTICATING_BIOMETRIC_ENCRYPTION, UV_SPECTRUM_MAPPING_INITIALIZED, ANALYZING_NASOLABIAL_VECTORS, DETECTING_SUB_DURMAL_INFLAMMATION, IRREGULAR_COLLAGEN_PATTERN_DETECTED, CROSS_REF_GENETIC_PROFILE_ID_7, BARRIER_INTEGRITY_INDEX_FINALIZED, CALCULATING_BIO_AGE_VARIANCE. Output exactly 10-12 lines, one per line. Use current time format for HH:MM:SS. No other text.`
          : DIAGNOSTIC_LOG_PROMPT;

        const logInput = image
          ? {
              model: "anthropic/claude-sonnet-4.5" as const,
              messages: [
                {
                  role: "user" as const,
                  content: [
                    { type: "text" as const, text: logPrompt },
                    { type: "image" as const, image },
                  ],
                },
              ],
            }
          : {
              model: "anthropic/claude-sonnet-4.5" as const,
              prompt: logPrompt,
            };

        const logResult = streamText(logInput);

        let fullLog = "";
        for await (const chunk of logResult.textStream) {
          fullLog += chunk;
          const lines = fullLog.split("\n").filter(Boolean);
          fullLog = fullLog.includes("\n") ? lines.pop() ?? "" : fullLog;
          for (const line of lines) {
            if (line.match(/^\d{2}:\d{2}:\d{2}\s+\[/) || line.trim().length > 5) {
              send("log", JSON.stringify({ line: line.trim() }));
            }
          }
        }
        if (fullLog.trim()) {
          send("log", JSON.stringify({ line: fullLog.trim() }));
        }

        // Phase 2: Generate report from image + quiz using AI (vision when image provided)
        const reportPrompt = `You are a clinical dermal AI. ${image ? "Based on the attached face image and" : "Based on"} these intake answers, generate a believable, personalized skin analysis report.
Quiz answers:
- Genetic aging pattern: ${quiz.geneticAgingPattern ?? "Not specified"}
- Environmental exposure: ${quiz.environmentalExposure ?? "Not specified"}
- Skin state on waking: ${quiz.skinStateOnWaking ?? "Not specified"}
${image ? "Use what you see in the face image (skin tone, texture, visible concerns, areas of aging or damage) to inform the report. Be specific to what you observe." : ""}

Return a report with:
- profileId: "SK-" followed by 5 digits (e.g. SK-77202)
- headline: one of "Bio-Age Accelerated", "Bio-Age Aligned", "Bio-Age Optimized"
- description: 1-2 sentences about structural/cellular findings; mention biological vs chronological age if headline is Accelerated
- bioAgeVariance: e.g. "+4.2y" or "0y" or "-1.2y"
- metrics: uvDamage (0-100 value, trend up/down/neutral), hydration (0-100), inflammation (High/Moderate/Low), dermalBioAge (same as bioAgeVariance)
- findings: array of 2 objects with id (short slug), title (e.g. "Dermal Thinning", "Lipid Loss", "UV Damage"), icon ("warning" or "alert"), description (1-2 sentences, clinical tone, can mention projected % or timeline)
Keep descriptions objective and scientific. No product recommendations.`;

        const reportInput = image
          ? {
              model: "anthropic/claude-sonnet-4.5" as const,
              messages: [
                {
                  role: "user" as const,
                  content: [
                    { type: "text" as const, text: reportPrompt },
                    { type: "image" as const, image },
                  ],
                },
              ],
              output: Output.object({
                schema: reportSchema,
                name: "DermalReport",
                description: "Structured dermal analysis report",
              }),
            }
          : {
              model: "anthropic/claude-sonnet-4.5" as const,
              prompt: reportPrompt,
              output: Output.object({
                schema: reportSchema,
                name: "DermalReport",
                description: "Structured dermal analysis report",
              }),
            };

        const reportResult = await generateText(reportInput);

        const output = await reportResult.output;
        const report =
          output && typeof output === "object" && "profileId" in output
            ? (output as DermalReportOutput)
            : null;
        if (report) {
          send("report", JSON.stringify(report));
        } else {
          send("report", JSON.stringify(getFallbackReport(quiz)));
        }
      } catch (err) {
        console.error("Analyze error:", err);
        const fallbackLogs = [
          "08:34:51 [OK] AUTHENTICATING_BIOMETRIC_ENCRYPTION",
          "08:34:51 [OK] UV_SPECTRUM_MAPPING_INITIALIZED",
          "08:34:51 [..] ANALYZING_NASOLABIAL_VECTORS",
          "08:34:52 [..] DETECTING_SUB_DURMAL_INFLAMMATION",
          "08:34:52 [!!] IRREGULAR_COLLAGEN_PATTERN_DETECTED",
          "08:34:52 [OK] CROSS_REF_GENETIC_PROFILE_ID_7",
          "08:34:53 [OK] BARRIER_INTEGRITY_INDEX_FINALIZED",
          "08:34:53 [..] CALCULATING_BIO_AGE_VARIANCE",
        ];
        for (const line of fallbackLogs) {
          send("log", JSON.stringify({ line }));
        }
        send("report", JSON.stringify(getFallbackReport(quiz)));
      }
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}

function getFallbackReport(quiz: QuizAnswers): DermalReportOutput {
  return {
    profileId: "SK-" + Math.floor(10000 + Math.random() * 90000),
    headline: "Bio-Age Accelerated",
    description:
      "Structural fragmentation detected in the deep dermal layer. Your skin's biological age is currently outpacing your chronological age by 4.2 years.",
    bioAgeVariance: "+4.2y",
    metrics: {
      uvDamage: { value: 62, trend: "up" },
      hydration: { value: 38, trend: "down" },
      inflammation: "High",
      dermalBioAge: "+4.2y",
    },
    findings: [
      {
        id: "dermal-thinning",
        title: "Dermal Thinning",
        icon: "warning",
        description:
          "The AI detected early-stage collagen breakdown in the periocular region. Without intervention, surface creasing will increase by 22% in the next 14 months.",
      },
      {
        id: "lipid-loss",
        title: "Lipid Loss",
        icon: "alert",
        description:
          "Your hydration retention markers are at critical lows. This indicates a 'leaky' skin barrier, allowing environmental toxins to penetrate deeper than normal.",
      },
    ],
  };
}
