"use client";

import { useState, useEffect, useRef } from "react";

type Phase = "idle" | "running" | "done" | "failed";

export default function GenerateButton() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState("");
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startCountRef = useRef(0);

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
    setError("");

    // Snapshot current draft count before triggering
    const snap = await fetch("/api/blog/draft-count").then(r => r.ok ? r.json() : { count: 0 });
    startCountRef.current = snap.count ?? 0;

    // Trigger GitHub Actions workflow
    try {
      const res = await fetch("/api/blog/generate", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      setPhase("failed");
      return;
    }

    // Start elapsed timer
    const startTime = Date.now();
    timerRef.current = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);

    // Poll every 5s for new drafts (workflow takes ~2 min)
    pollRef.current = setInterval(async () => {
      const r = await fetch("/api/blog/draft-count");
      if (!r.ok) return;
      const { count } = await r.json();
      if (count > startCountRef.current) {
        stopAll();
        setPhase("done");
        setTimeout(() => window.location.reload(), 800);
      }
    }, 5000);

    // Timeout after 5 minutes
    setTimeout(() => {
      if (pollRef.current) {
        stopAll();
        setPhase("done");
        window.location.reload();
      }
    }, 300000);
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
      {phase === "done" && <p className="text-xs text-green-400">Done! Reloading…</p>}
      {phase === "failed" && <p className="text-xs text-red-400 max-w-xs text-right">Error: {error || "Unknown"}</p>}
    </div>
  );
}
