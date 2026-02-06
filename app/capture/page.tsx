"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/dermal/Header";
import { Camera } from "lucide-react";
import { cn } from "@/lib/utils";

export default function CapturePage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleFile = useCallback((f: File | null) => {
    if (!f) {
      setFile(null);
      setPreview(null);
      return;
    }
    if (!f.type.startsWith("image/")) return;
    setFile(f);
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result as string);
    reader.readAsDataURL(f);
  }, []);

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const onDragLeave = () => setDragOver(false);

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    handleFile(f ?? null);
  };

  const submit = async () => {
    if (!file) return;
    setUploading(true);
    try {
      if (typeof window !== "undefined") {
        const quizJson = sessionStorage.getItem("dermal_quiz");
        const base64 = preview ?? "";
        sessionStorage.setItem("dermal_image", base64);
        sessionStorage.setItem("dermal_quiz", quizJson ?? "{}");
      }
      router.push("/analyzing");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main className="pt-28 px-6 pb-16 max-w-xl mx-auto text-center">
        <h1 className="text-2xl font-bold text-[#0f172a] mb-2">
          Biometric Capture
        </h1>
        <p className="text-gray-500 text-sm mb-8">
          Ensure face is centered, eyes open, and no glasses.
        </p>

        <div
          onDrop={onDrop}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          className={cn(
            "rounded-2xl border-2 border-dashed transition-colors flex flex-col items-center justify-center min-h-[280px] p-6",
            dragOver ? "border-[#3b82f6] bg-blue-50/30" : "border-[#93c5fd] bg-gray-50/50"
          )}
        >
          <input
            type="file"
            accept="image/*"
            onChange={onInputChange}
            className="absolute w-0 h-0 opacity-0 pointer-events-none"
            id="bio-upload"
          />
          {preview ? (
            <div className="relative w-full max-w-sm mx-auto">
              <img
                src={preview}
                alt="Face preview"
                className="w-full h-auto rounded-xl object-cover max-h-64"
              />
              <button
                type="button"
                onClick={() => handleFile(null)}
                className="mt-3 text-sm text-gray-500 hover:text-[#0f172a]"
              >
                Choose another image
              </button>
            </div>
          ) : (
            <label
              htmlFor="bio-upload"
              className="flex flex-col items-center gap-3 cursor-pointer"
            >
              <div className="rounded-xl bg-[#eff6ff] p-5">
                <Camera className="h-10 w-10 text-[#3b82f6]" />
              </div>
              <span className="font-semibold text-[#0f172a]">Scan Bio-ID</span>
              <span className="text-sm text-gray-500">
                Drag and drop or click to upload.
              </span>
            </label>
          )}
        </div>

        {file && (
          <button
            onClick={submit}
            disabled={uploading}
            className="mt-6 w-full max-w-sm mx-auto flex items-center justify-center rounded-md bg-[#3b82f6] text-white font-medium py-3 hover:bg-[#2563eb] disabled:opacity-60"
          >
            {uploading ? "Starting analysis…" : "Analyze"}
          </button>
        )}
      </main>
    </div>
  );
}
