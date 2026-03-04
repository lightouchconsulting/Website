"use client";

import { useState } from "react";

type Phase = "idle" | "running" | "done" | "failed";

export default function GenerateButton() {
  const [phase, setPhase] = useState<Phase>("idle");

  const handleGenerate = async () => {
    setPhase("running");
    try {
      const res = await fetch("/api/blog/generate", { method: "POST" });
      if (!res.ok) throw new Error();
      setPhase("done");
      setTimeout(() => window.location.reload(), 800);
    } catch {
      setPhase("failed");
    }
  };

  const busy = phase === "running";

  return (
    <div className="flex flex-col items-end gap-2">
      <button
        onClick={handleGenerate}
        disabled={busy || phase === "done"}
        className="flex items-center gap-2 px-4 py-2 bg-yellow-400 text-black font-semibold rounded hover:bg-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed transition"
      >
        {busy && (
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
          </svg>
        )}
        {busy ? "Generating…" : "Generate Articles"}
      </button>
      {phase === "done" && <p className="text-xs text-green-400">Done! Reloading…</p>}
      {phase === "failed" && <p className="text-xs text-red-400">Failed. Check Vercel logs.</p>}
    </div>
  );
}
