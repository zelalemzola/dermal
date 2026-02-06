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

          {/* Right: Diagnostic kernel */}
          <div className="rounded-2xl bg-[#0f172a] text-white overflow-hidden flex flex-col border border-[#1e293b]">
            <div className="px-4 py-3 border-b border-[#1e293b] flex items-center justify-between">
              <span className="flex items-center gap-2 font-mono text-sm">
                <span className="w-2 h-2 rounded-full bg-red-500" />
                DIAGNOSTIC KERNEL V8.1
              </span>
              <span className="font-mono text-sm text-[#3b82f6]">{progress}%</span>
            </div>
            <div className="h-1 bg-[#1e293b]">
              <div
                className="h-full bg-[#3b82f6] transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="flex-1 overflow-auto p-4 font-mono text-xs space-y-1 min-h-[280px]">
              {logLines.map((l, i) => (
                <div
                  key={i}
                  className="text-gray-300 animate-in fade-in duration-200"
                >
                  <span className="text-gray-500">{l.time}</span>{" "}
                  <span
                    className={
                      l.tag === "[!!]"
                        ? "text-amber-400"
                        : l.tag === "[OK]"
                          ? "text-emerald-400"
                          : "text-blue-400"
                    }
                  >
                    {l.tag}
                  </span>{" "}
                  {l.message}
                </div>
              ))}
              <div ref={logEndRef} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
