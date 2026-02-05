"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { StatusIndicator } from "./ui/status-indicator";

interface Execution {
  id: string;
  agent: string;
  status: "running" | "completed" | "failed";
  startedAt: string;
  project?: string;
}

export function MiniAgentMonitor() {
  const [executions, setExecutions] = useState<Execution[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    // Load executions
    const loadExecutions = async () => {
      try {
        const res = await fetch("/api/command/executions?filter=active&limit=5");
        const data = await res.json();
        setExecutions(data.executions || []);
      } catch {
        // Silently fail
      }
    };

    loadExecutions();
    const interval = setInterval(loadExecutions, 5000); // Refresh every 5s

    return () => clearInterval(interval);
  }, []);

  const activeCount = executions.filter((e) => e.status === "running").length;

  if (executions.length === 0) return null;

  return (
    <div className="border-t-2 border-gray-800 mt-2">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-3 hover:bg-zinc-950 transition-colors"
      >
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${activeCount > 0 ? "bg-green-400 animate-pulse" : "bg-gray-600"}`} />
          <span className="text-xs text-gray-400 uppercase tracking-wider font-[family-name:var(--font-jetbrains)]">
            Agents ({activeCount})
          </span>
        </div>
        <span className="text-xs text-gray-400">{isExpanded ? "▼" : "▶"}</span>
      </button>

      {/* Expanded List */}
      {isExpanded && (
        <div className="space-y-1 px-2 pb-2">
          {executions.slice(0, 3).map((exec) => (
            <Link
              key={exec.id}
              href="/command"
              className="block p-2 bg-zinc-950 border-l-2 border-green-400 hover:bg-zinc-900 transition-colors"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-white truncate font-mono">
                    {exec.agent}
                  </div>
                  {exec.project && (
                    <div className="text-[10px] text-gray-500 truncate">
                      {exec.project}
                    </div>
                  )}
                </div>
                <StatusIndicator
                  status={exec.status === "running" ? "RUN" : exec.status === "completed" ? "OK" : "ERR"}
                  active={exec.status === "running"}
                  color={exec.status === "running" ? "green" : exec.status === "completed" ? "cyan" : "red"}
                  pulse={exec.status === "running"}
                  size="sm"
                />
              </div>
            </Link>
          ))}

          {/* View All Link */}
          {executions.length > 3 && (
            <Link
              href="/command"
              className="block text-center text-xs text-cyan-400 hover:text-cyan-300 py-2 uppercase tracking-wide"
            >
              View All →
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
