"use client";

import { useState, useEffect, useRef } from "react";

type Phase = "idle" | "triggering" | "queued" | "in_progress" | "done" | "failed";

function elapsed(startedAt: string | null): string {
  if (!startedAt) return "";
  const secs = Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000);
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

export default function GenerateButton() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [startedAt, setStartedAt] = useState<string | null>(null);
  const [tick, setTick] = useState(0);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = () => {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = null;
  };

  const poll = async () => {
    try {
      const res = await fetch("/api/blog/generate/status");
      const data = await res.json();
      if (data.status === "queued") {
        setPhase("queued");
      } else if (data.status === "in_progress") {
        setPhase("in_progress");
        setStartedAt(data.started_at ?? null);
      } else if (data.status === "completed") {
        stopPolling();
        setPhase(data.conclusion === "success" ? "done" : "failed");
        if (data.conclusion === "success") {
          setTimeout(() => window.location.reload(), 2000);
        }
      }
    } catch {
      // keep polling
    }
  };

  useEffect(() => {
    if (tick > 0) poll();
  }, [tick]);

  const startPolling = () => {
    stopPolling();
    pollRef.current = setInterval(() => setTick((t) => t + 1), 5000);
  };

  useEffect(() => () => stopPolling(), []);

  const handleGenerate = async () => {
    setPhase("triggering");
    try {
      const res = await fetch("/api/blog/generate", { method: "POST" });
      if (!res.ok) throw new Error();
      setPhase("queued");
      startPolling();
    } catch {
      setPhase("failed");
    }
  };

  const messages: Record<Phase, string> = {
    idle: "",
    triggering: "Starting workflow…",
    queued: "Queued — waiting for runner…",
    in_progress: `Running — fetching feeds and writing posts… ${elapsed(startedAt)}`,
    done: "Done! Loading drafts…",
    failed: "Generation failed. Check GitHub Actions for details.",
  };

  const busy = phase === "triggering" || phase === "queued" || phase === "in_progress";

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
      {phase !== "idle" && (
        <p className={`text-xs ${phase === "failed" ? "text-red-400" : phase === "done" ? "text-green-400" : "text-gray-400"}`}>
          {messages[phase]}
        </p>
      )}
    </div>
  );
}
