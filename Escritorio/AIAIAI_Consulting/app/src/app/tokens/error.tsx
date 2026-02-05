"use client";

import { useEffect } from "react";

export default function TokensError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[tokens-error]", error);
  }, [error]);

  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4 p-8">
      <div className="border-2 border-red-500 bg-black p-6 text-center font-[family-name:var(--font-jetbrains)]">
        <h2 className="mb-3 text-lg font-bold uppercase tracking-widest text-red-500">
          Failed to load token data
        </h2>
        <p className="mb-4 text-sm text-zinc-400">{error.message}</p>
        <button
          onClick={reset}
          className="border-2 border-cyan-400 bg-transparent px-4 py-1.5 text-xs uppercase tracking-widest text-cyan-400 transition-colors hover:bg-cyan-400 hover:text-black"
        >
          Retry
        </button>
      </div>
    </div>
  );
}
