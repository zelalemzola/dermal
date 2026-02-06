"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Header } from "@/components/dermal/Header";
import { Button } from "@/components/ui/button";
import type { DermalReportOutput } from "@/app/api/analyze/route";
import { Zap, AlertTriangle } from "lucide-react";

const FULL_REPORT_PLAN = "Full Report";
const FULL_REPORT_AMOUNT = 29;

export default function ReportPage() {
  const [report, setReport] = useState<DermalReportOutput | null>(null);

  useEffect(() => {
    const raw =
      typeof window !== "undefined" ? sessionStorage.getItem("dermal_report") : null;
    if (raw) {
      try {
        setReport(JSON.parse(raw));
      } catch {
        setReport(null);
      }
    }
  }, []);

  if (!report) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Header />
        <p className="text-gray-500">Loading report…</p>
      </div>
    );
  }

  const { profileId, headline, description, bioAgeVariance, metrics, findings } =
    report;

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main className="pt-24 px-4 pb-16 max-w-4xl mx-auto">
        {/* Main report card */}
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden mb-8">
          <div className="h-1 w-full bg-gradient-to-r from-[#3b82f6] to-orange-400" />
          <div className="p-6 sm:p-8">
            <p className="text-xs text-gray-500 mb-2">
              CLINICAL PROFILE ID: {profileId}
            </p>
            <p className="text-lg font-semibold text-[#0f172a] mb-1">Report:</p>
            <p className="text-2xl sm:text-3xl font-bold text-[#3b82f6] mb-4">
              {headline}
            </p>
            <p className="text-[#0f172a] leading-relaxed mb-6">{description}</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">
                  UV DAMAGE
                </p>
                <p className="text-xl font-bold text-[#0f172a] flex items-center gap-1">
                  {metrics.uvDamage.value}%
                  {metrics.uvDamage.trend === "up" && (
                    <span className="text-red-500 text-sm">▲</span>
                  )}
                  {metrics.uvDamage.trend === "down" && (
                    <span className="text-emerald-500 text-sm">▼</span>
                  )}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">
                  HYDRATION
                </p>
                <p className="text-xl font-bold text-[#0f172a] flex items-center gap-1">
                  {metrics.hydration.value}%
                  {metrics.hydration.trend === "down" && (
                    <span className="text-red-500 text-sm">▼</span>
                  )}
                  {metrics.hydration.trend === "up" && (
                    <span className="text-emerald-500 text-sm">▲</span>
                  )}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">
                  INFLAMMATION
                </p>
                <p className="text-xl font-bold text-[#0f172a]">
                  {metrics.inflammation}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">
                  DERMAL BIO-AGE
                </p>
                <p className="text-xl font-bold text-[#3b82f6]">
                  {metrics.dermalBioAge}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Findings + Intervention Protocol */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            {findings.map((f) => (
              <div
                key={f.id}
                className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
              >
                <div className="flex items-start gap-3">
                  {f.icon === "warning" ? (
                    <Zap className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                  ) : (
                    <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <h3 className="font-bold text-[#0f172a] mb-1">{f.title}</h3>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      {f.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="rounded-2xl bg-[#3b82f6] text-white p-6 flex flex-col">
            <h3 className="font-bold text-lg uppercase tracking-wide mb-4">
              Intervention Protocol
            </h3>
            <ul className="space-y-2 text-sm mb-6">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-white" />
                Customized Actives
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-white" />
                AM/PM Layering Guide
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-white" />
                90-Day Outcome Model
              </li>
            </ul>
            <Button
              className="mt-auto w-full rounded-lg bg-white text-[#3b82f6] font-semibold hover:bg-gray-100"
              size="lg"
              asChild
            >
              <Link
                href={`/payment?plan=${encodeURIComponent(FULL_REPORT_PLAN)}&amount=${FULL_REPORT_AMOUNT}`}
              >
                Get Full Report — ${FULL_REPORT_AMOUNT}
              </Link>
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
