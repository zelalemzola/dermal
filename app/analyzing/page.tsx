"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/dermal/Header";
import { cn } from "@/lib/utils";

interface LogLine {
  time: string;
  tag: string;
  message: string;
}

function parseLogLine(line: string): LogLine | null {
  const match = line.match(/^(\d{2}:\d{2}:\d{2})\s+(\[[^\]]+\])\s+(.+)$/);
  if (!match) return null;
  return { time: match[1], tag: match[2], message: match[3] };
}

export default function AnalyzingPage() {
  const router = useRouter();
  const [logLines, setLogLines] = useState<LogLine[]>([]);
  const [progress, setProgress] = useState(0);
  const [preview, setPreview] = useState<string | null>(null);
  const logEndRef = useRef<HTMLDivElement>(null);
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    const quizJson =
      typeof window !== "undefined" ? sessionStorage.getItem("dermal_quiz") : null;
    const image =
      typeof window !== "undefined" ? sessionStorage.getItem("dermal_image") : null;
    if (image) setPreview(image);

    const quiz = quizJson ? JSON.parse(quizJson) : {};

    const run = async () => {
      const t = setInterval(() => {
        setProgress((p) => Math.min(p + 2, 82));
      }, 200);
      try {
        const res = await fetch("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ quiz, image: image ?? undefined }),
        });
        if (!res.body) return;
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const parts = buffer.split("\n\n");
          buffer = parts.pop() ?? "";
          for (const part of parts) {
            const lines = part.split("\n");
            const eventMatch = lines[0]?.match(/^event:\s*(\w+)/);
            const data = lines
              .slice(1)
              .map((l) => l.replace(/^data:\s*/, ""))
              .join("\n")
              .trim();
            if (eventMatch) {
              const [, event] = eventMatch;
              if (event === "log") {
                try {
                  const { line } = JSON.parse((data ?? "").trim());
                  const parsed = parseLogLine(line);
                  if (parsed) setLogLines((prev) => [...prev, parsed]);
                  else setLogLines((prev) => [...prev, { time: "", tag: "", message: line }]);
                } catch {
                  setLogLines((prev) => [...prev, { time: "", tag: "", message: data }]);
                }
              } else if (event === "report") {
                try {
                  const report = JSON.parse((data ?? "").trim());
                  if (typeof window !== "undefined") {
                    sessionStorage.setItem("dermal_report", JSON.stringify(report));
                  }
                  clearInterval(t);
                  setProgress(100);
                  setTimeout(() => router.push("/report"), 600);
                  return;
                } catch (e) {
                  console.error(e);
                }
              }
            }
          }
        }
      } catch (err) {
        console.error(err);
        setLogLines((prev) => [
          ...prev,
          { time: "08:34:53", tag: "[!!]", message: "FALLBACK_ANALYSIS_COMPLETE" },
        ]);
        if (typeof window !== "undefined") {
          sessionStorage.setItem(
            "dermal_report",
            JSON.stringify({
              profileId: "SK-77202",
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
            })
          );
        }
        setTimeout(() => router.push("/report"), 800);
      } finally {
        clearInterval(t);
      }
    };
    run();
  }, [router]);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logLines]);

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main className="pt-24 px-4 pb-8 max-w-5xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Face + overlay */}
          <div className="rounded-2xl overflow-hidden border border-gray-200 bg-gray-100 aspect-[4/5] max-h-[420px] relative">
            {preview ? (
              <>
                <img
                  src={preview}
                  alt="Analysis view"
                  className="w-full h-full object-cover object-top"
                />
                <div className="absolute top-3 left-3 bg-[#0f172a] text-white text-xs px-2 py-1 rounded">
                  VIEW: STRUCTURAL_DECON
                </div>
                <div className="absolute top-1/4 left-1/4 w-3 h-3 rounded-full border-2 border-[#3b82f6] bg-[#3b82f6]/30 animate-pulse" title="UV_STR" />
                <div className="absolute top-1/2 left-1/2 -translate-x-4 w-3 h-3 rounded-full border-2 border-[#3b82f6] bg-[#3b82f6]/30 animate-pulse" title="ELAS_FAIL" />
                <div className="absolute top-1/2 left-1/2 -translate-x-8 translate-y-2 w-3 h-3 rounded-full border-2 border-[#3b82f6] bg-[#3b82f6]/30 animate-pulse" title="UV_STR" />
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                Loading capture…
              </div>
            )}
          </div>

          {/* Right: Medical analysis unit — fixed height, scrollable findings */}
          <div
            className="relative rounded-2xl overflow-hidden flex flex-col h-[420px] border border-slate-200 bg-slate-50/80 shadow-sm"
            style={{ boxShadow: "inset 0 0 0 1px rgba(148,163,184,0.08)" }}
          >
            {/* Bezel / device border */}
            <div className="absolute inset-0 pointer-events-none rounded-2xl border border-slate-200/60" aria-hidden />

            {/* Header: device title + status */}
            <div className="shrink-0 flex items-center justify-between px-5 py-3.5 border-b border-slate-200/80 bg-white">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 border border-teal-100">
                  <svg className="h-5 w-5 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800 tracking-tight">
                    Dermal Scan Analyzer
                  </p>
                  <p className="text-xs text-slate-500">Skintelligence Clinical · v8.1</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-teal-50 px-2.5 py-1 text-xs font-medium text-teal-700 border border-teal-100">
                  <span className="h-1.5 w-1.5 rounded-full bg-teal-500 animate-pulse" />
                  Analyzing
                </span>
                <div className="text-right">
                  <p className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">Progress</p>
                  <p className="text-sm font-semibold tabular-nums text-slate-800">{progress}%</p>
                </div>
                <div className="h-2 w-20 rounded-full bg-slate-200 overflow-hidden">
                  <div
                    className="h-full bg-teal-500 transition-all duration-300 ease-out rounded-full"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Vital / signal strip — ECG-style */}
            <div className="shrink-0 flex items-center gap-0.5 h-9 px-4 py-2 border-b border-slate-200/60 bg-white/60">
              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-medium mr-2">Signal</span>
              {Array.from({ length: 32 }).map((_, i) => (
                <div
                  key={i}
                  className="flex-1 min-w-0 rounded-sm bg-teal-400/30 min-h-[6px] transition-all duration-300"
                  style={{
                    height: `${12 + Math.sin(i * 0.6) * 8 + (progress / 100) * 6}px`,
                    opacity: 0.4 + (progress / 100) * 0.4,
                  }}
                />
              ))}
            </div>

            {/* Section label */}
            <div className="shrink-0 px-5 py-2 border-b border-slate-200/60 bg-slate-50/50">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                Live findings
              </p>
            </div>

            {/* Scrollable findings — fixed height, content scrolls inside */}
            <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden bg-white/50">
              <div className="p-4 space-y-2.5">
                {logLines.map((l, i) => (
                  <div
                    key={i}
                    className="flex gap-3 animate-in fade-in duration-200 rounded-lg px-3 py-2.5 bg-white border border-slate-100 shadow-sm"
                  >
                    <span className="shrink-0 text-[11px] text-slate-400 tabular-nums pt-0.5">
                      {l.time || "—"}
                    </span>
                    <span
                      className={cn(
                        "shrink-0 inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide",
                        l.tag === "[!!]"
                          ? "bg-amber-50 text-amber-700 border border-amber-100"
                          : l.tag === "[OK]"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                            : "bg-sky-50 text-sky-700 border border-sky-100"
                      )}
                    >
                      {l.tag.replace(/^\[|\]$/g, "")}
                    </span>
                    <span className="text-sm text-slate-700 leading-snug break-words">
                      {l.message}
                    </span>
                  </div>
                ))}
                {logLines.length === 0 && (
                  <div className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-slate-400 text-sm">
                    <span className="h-2 w-2 rounded-full bg-slate-300 animate-pulse" />
                    Waiting for analysis…
                  </div>
                )}
                <div ref={logEndRef} />
              </div>
            </div>

            {/* Footer */}
            <div className="shrink-0 px-5 py-2 border-t border-slate-200/60 bg-slate-50/80 flex items-center justify-between">
              <span className="text-[10px] text-slate-400 font-medium">
                Skintelligence Clinical Suite
              </span>
              <span className="text-[10px] text-slate-400">Secure session</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
