"use client";

import { useState } from "react";

export default function GenerateButton() {
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");

  const handleGenerate = async () => {
    setStatus("loading");
    try {
      const res = await fetch("/api/blog/generate", { method: "POST" });
      if (!res.ok) throw new Error();
      setStatus("done");
    } catch {
      setStatus("error");
    }
  };

  return (
    <div className="flex items-center gap-4">
      <button
        onClick={handleGenerate}
        disabled={status === "loading"}
        className="px-4 py-2 bg-yellow-400 text-black font-semibold rounded hover:bg-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed transition"
      >
        {status === "loading" ? "Generating…" : "Generate Articles"}
      </button>
      {status === "done" && (
        <p className="text-sm text-green-400">
          Generation started — drafts will appear here in a few minutes.
        </p>
      )}
      {status === "error" && (
        <p className="text-sm text-red-400">Failed to trigger generation. Try again.</p>
      )}
    </div>
  );
}
