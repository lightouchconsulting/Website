"use client";

import { useState, useEffect, useRef } from "react";

type Phase = "idle" | "running" | "done" | "failed";

export default function GenerateButton() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [elapsed, setElapsed] = useState(0);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startCountRef = useRef<number>(0);
  const startLastGeneratedRef = useRef<string | null>(null);

  const stopAll = () => {
    if (pollRef.current) clearInterval(pollRef.current);
    if (timerRef.current) clearInterval(timerRef.current);
    pollRef.current = null;
    timerRef.current = null;
  };

  useEffect(() => () => stopAll(), []);

  const handleGenerate = async () => {
    setPhase("running");
    setElapsed(0);

    // Start elapsed timer
    const startTime = Date.now();
    timerRef.current = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);

    try {
      const res = await fetch("/api/blog/generate", { method: "POST" });
      if (!res.ok) throw new Error();
    } catch {
      stopAll();
      setPhase("failed");
      return;
    }

    // Snapshot current state so we can detect when generation completes
    const countRes = await fetch("/api/blog/draft-count");
    if (countRes.ok) {
      const data = await countRes.json();
      startCountRef.current = data.count ?? 0;
      startLastGeneratedRef.current = data.lastGenerated ?? null;
    }

    // Poll every 3 seconds — done when count increases OR lastGenerated changes
    pollRef.current = setInterval(async () => {
      const r = await fetch("/api/blog/draft-count");
      if (!r.ok) return;
      const { count, lastGenerated } = await r.json();
      const newDrafts = count > startCountRef.current;
      const regenerated = lastGenerated && lastGenerated !== startLastGeneratedRef.current;
      if (newDrafts || regenerated) {
        stopAll();
        setPhase("done");
        setTimeout(() => window.location.reload(), 1000);
      }
    }, 3000);

    // Timeout after 2 minutes
    setTimeout(() => {
      if (pollRef.current) {
        stopAll();
        setPhase("done");
        window.location.reload();
      }
    }, 120000);
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
        {busy ? `Generating… ${elapsed}s` : "Generate Articles"}
      </button>
      {phase === "done" && <p className="text-xs text-green-400">Done! Reloading drafts…</p>}
      {phase === "failed" && <p className="text-xs text-red-400">Failed to start generation.</p>}
    </div>
  );
}
