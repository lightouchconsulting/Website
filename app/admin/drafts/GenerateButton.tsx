"use client";

import { useState } from "react";

type Phase = "idle" | "running" | "done" | "failed";

export default function GenerateButton() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState<string>("");

  const handleGenerate = async () => {
    setPhase("running");
    setError("");
    try {
      const res = await fetch("/api/blog/generate", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
      setPhase("done");
      setTimeout(() => window.location.reload(), 800);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
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
      {phase === "failed" && <p className="text-xs text-red-400 max-w-xs text-right">Error: {error || "Unknown"}</p>}
    </div>
  );
}
