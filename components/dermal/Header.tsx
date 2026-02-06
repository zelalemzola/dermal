"use client";

export function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 bg-white border-b border-gray-100">
      <div className="flex items-center gap-3">
        {/* Logo: dark blue with light blue ring */}
        <div className="relative flex h-10 w-10 shrink-0 items-center justify-center">
          <div className="absolute h-10 w-10 rounded-full bg-[#0f172a]" />
          <div className="absolute h-6 w-6 rounded-full bg-[#3b82f6]" />
          <div className="absolute h-3 w-3 rounded-full border-2 border-white bg-[#3b82f6]" />
        </div>
        <div>
          <p className="text-sm font-semibold tracking-tight text-[#0f172a]">
            SKINTELLIGENCE <span className="font-bold text-[#0f172a]">DERMAL-AI</span>
          </p>
          <p className="text-xs text-gray-500">V 8.1.0 // CLINICAL_SUITE</p>
        </div>
      </div>
      <div className="flex items-center gap-2 text-gray-500 text-sm">
        <span
          className="relative flex h-2 w-2 rounded-full bg-[#3b82f6]"
          aria-hidden
        >
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#3b82f6] opacity-75" />
        </span>
        <span>ANALYZING SYSTEM ACTIVE</span>
      </div>
    </header>
  );
}
