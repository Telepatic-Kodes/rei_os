"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[error-boundary]", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 p-8">
      <div className="border-2 border-red-500 bg-black p-8 text-center font-[family-name:var(--font-jetbrains)]">
        <h2 className="mb-4 text-2xl font-bold uppercase tracking-widest text-red-500">
          System Error
        </h2>
        <p className="mb-6 text-sm text-zinc-400">
          {error.message || "An unexpected error occurred"}
        </p>
        <button
          onClick={reset}
          className="border-2 border-cyan-400 bg-transparent px-6 py-2 text-sm uppercase tracking-widest text-cyan-400 transition-colors hover:bg-cyan-400 hover:text-black"
        >
          Retry
        </button>
      </div>
    </div>
  );
}
