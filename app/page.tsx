"use client";

import Link from "next/link";
import { Header } from "@/components/dermal/Header";
import { Button } from "@/components/ui/button";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main className="pt-28 px-6 pb-16 max-w-2xl mx-auto text-center">
        <h1 className="text-3xl sm:text-4xl font-bold text-[#0f172a] tracking-tight leading-tight">
          Dermal Longevity Starts with{" "}
          <span className="text-[#3b82f6]">Data.</span>
        </h1>
        <p className="mt-4 text-base text-gray-600 leading-relaxed">
          Quantify your cellular degradation. Our Dermal-AI maps sub-surface
          markers invisible to the human eye.
        </p>
        <div className="mt-10">
          <Button
            asChild
            size="lg"
            className="w-full sm:w-auto min-w-[240px] rounded-md border border-gray-200 bg-white text-[#0f172a] hover:bg-gray-50 hover:border-gray-300 font-medium text-base"
          >
            <Link href="/intake">
              Begin Clinical Intake →
            </Link>
          </Button>
        </div>
        <footer className="mt-24 grid grid-cols-1 sm:grid-cols-3 gap-8 text-left">
          <div>
            <p className="text-2xl font-bold text-[#0f172a]">12.4k</p>
            <p className="text-sm text-gray-500 mt-1">MARKERS TRACKED</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-[#0f172a]">99.2%</p>
            <p className="text-sm text-gray-500 mt-1">CLINICAL CORREL.</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-[#0f172a]">SECURE</p>
            <p className="text-sm text-gray-500 mt-1">AES-256 ENCRYPT</p>
          </div>
        </footer>
      </main>
    </div>
  );
}
