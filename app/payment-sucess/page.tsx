"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Header } from "@/components/dermal/Header";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { DermalReportOutput } from "@/app/api/analyze/route";
import { CheckCircle, Download, Loader2, Zap, AlertTriangle } from "lucide-react";
import Link from "next/link";

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const amount = searchParams.get("amount") ?? "";
  const plan = searchParams.get("plan") ?? "";
  const [open, setOpen] = useState(false);
  const [report, setReport] = useState<DermalReportOutput | null>(null);
  const reportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setOpen(true);
  }, []);

  useEffect(() => {
    const raw =
      typeof window !== "undefined"
        ? sessionStorage.getItem("dermal_report")
        : null;
    if (raw) {
      try {
        setReport(JSON.parse(raw));
      } catch {
        setReport(null);
      }
    }
  }, []);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="print:hidden">
        <Header />
      </div>
      <main className="pt-24 px-4 pb-16 max-w-4xl mx-auto">
        <div className="text-center mb-10 print:hidden" aria-hidden="true">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#eff6ff] text-[#3b82f6] mb-6">
            <CheckCircle className="h-9 w-9" />
          </div>
          <h1 className="text-2xl font-bold text-[#0f172a] mb-2">
            Payment successful
          </h1>
          {(amount || plan) && (
            <p className="text-gray-600 mb-4">
              {plan && (
                <span className="font-medium text-[#3b82f6]">{plan}</span>
              )}
              {plan && amount && " — "}
              {amount && `$${amount} paid successfully.`}
            </p>
          )}
        </div>

        {report ? (
          <div ref={reportRef} className="space-y-6 print:space-y-4">
            <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden print:shadow-none">
              <div className="h-1 w-full bg-gradient-to-r from-[#3b82f6] to-orange-400" />
              <div className="p-6 sm:p-8">
                <p className="text-xs text-gray-500 mb-2">
                  CLINICAL PROFILE ID: {report.profileId}
                </p>
                <p className="text-lg font-semibold text-[#0f172a] mb-1">
                  Your Full Report
                </p>
                <p className="text-2xl font-bold text-[#3b82f6] mb-4">
                  {report.headline}
                </p>
                <p className="text-[#0f172a] leading-relaxed mb-6">
                  {report.description}
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">
                      UV DAMAGE
                    </p>
                    <p className="text-xl font-bold text-[#0f172a]">
                      {report.metrics.uvDamage.value}%
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">
                      HYDRATION
                    </p>
                    <p className="text-xl font-bold text-[#0f172a]">
                      {report.metrics.hydration.value}%
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">
                      INFLAMMATION
                    </p>
                    <p className="text-xl font-bold text-[#0f172a]">
                      {report.metrics.inflammation}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">
                      DERMAL BIO-AGE
                    </p>
                    <p className="text-xl font-bold text-[#3b82f6]">
                      {report.metrics.dermalBioAge}
                    </p>
                  </div>
                </div>
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-[#0f172a] uppercase tracking-wide">
                    Findings
                  </h3>
                  {report.findings.map((f) => (
                    <div
                      key={f.id}
                      className="rounded-xl border border-gray-100 p-4"
                    >
                      <div className="flex items-start gap-3">
                        {f.icon === "warning" ? (
                          <Zap className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                        ) : (
                          <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                        )}
                        <div>
                          <h4 className="font-bold text-[#0f172a] mb-1">
                            {f.title}
                          </h4>
                          <p className="text-sm text-gray-600 leading-relaxed">
                            {f.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 print:hidden">
              <Button
                onClick={handlePrint}
                className="bg-[#3b82f6] hover:bg-[#2563eb] text-white rounded-lg"
              >
                <Download className="h-4 w-4 mr-2" />
                Download / Print report
              </Button>
              <Button variant="outline" asChild className="rounded-lg">
                <Link href="/">Back to home</Link>
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center py-12 print:hidden">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">
              Loading your report…
            </p>
            <p className="text-sm text-gray-500 max-w-md mx-auto">
              If you completed the analysis and payment, your report should
              appear here. If it doesn’t, please do not reload — go back to
              your report from the home flow.
            </p>
            <Button asChild className="mt-6 rounded-lg">
              <Link href="/">Go to home</Link>
            </Button>
          </div>
        )}
      </main>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          showCloseButton={true}
          className="sm:max-w-md border-gray-200 bg-white print:hidden"
        >
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="rounded-full bg-[#eff6ff] p-2">
                <CheckCircle className="h-5 w-5 text-[#3b82f6]" />
              </div>
              <DialogTitle className="text-lg text-[#0f172a]">
                Payment successful
              </DialogTitle>
            </div>
            <DialogDescription className="text-left text-gray-700 pt-2">
              Please do not reload before finishing reading your report or
              before you download your report. If you reload, you may lose
              access to your report and be prompted back to the pricing page.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-6">
            <Button
              onClick={() => setOpen(false)}
              className="w-full sm:w-auto bg-[#3b82f6] hover:bg-[#2563eb] text-white rounded-lg"
            >
              I understand
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function PaymentSuccessFallback() {
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center">
      <Header />
      <div className="flex items-center gap-2 text-gray-500 mt-24">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span>Loading…</span>
      </div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={<PaymentSuccessFallback />}>
      <PaymentSuccessContent />
    </Suspense>
  );
}
