"use client";

import type { TokenEntry } from "@/lib/data";

interface TokenChartProps {
  entries: TokenEntry[];
  budget: number;
}

export function TokenChart({ entries, budget }: TokenChartProps) {
  // Group by date and sum costs
  const byDate = entries.reduce<Record<string, number>>((acc, entry) => {
    acc[entry.date] = (acc[entry.date] ?? 0) + entry.cost;
    return acc;
  }, {});

  const dates = Object.keys(byDate).sort();
  const maxCost = Math.max(...Object.values(byDate), 1);
  const totalSpent = entries.reduce((sum, e) => sum + e.cost, 0);
  const budgetPercent = Math.round((totalSpent / budget) * 100);
  const budgetStatus = budgetPercent > 80 ? 'text-red-400' : budgetPercent > 60 ? 'text-yellow-400' : 'text-green-400';

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-lg font-bold text-white uppercase tracking-wide font-[family-name:var(--font-space)] mb-2">
          Token Consumption - January 2026
        </h3>
        <p className="text-sm font-mono">
          <span className={budgetStatus}>
            ${totalSpent.toFixed(2)} / ${budget} USD
          </span>
          <span className="text-gray-500 ml-2">
            ({budgetPercent}% of budget)
          </span>
        </p>
      </div>

      {/* Chart */}
      <div className="bg-black border-2 border-gray-800 p-4">
        <div className="flex items-end gap-1 h-48">
          {dates.map((date) => {
            const cost = byDate[date];
            const heightPercent = (cost / maxCost) * 100;
            const isHigh = cost > budget * 0.1;
            const barColor = isHigh ? 'bg-gradient-to-t from-red-400 to-yellow-400' : 'bg-gradient-to-t from-cyan-400 to-green-400';

            return (
              <div key={date} className="flex-1 flex flex-col items-center gap-1 group">
                {/* Cost label */}
                <span className="text-[10px] text-gray-500 font-mono font-medium group-hover:text-white transition-colors">
                  ${cost.toFixed(0)}
                </span>

                {/* Bar */}
                <div
                  className={`w-full ${barColor} relative overflow-hidden transition-all hover:opacity-80`}
                  style={{ height: `${heightPercent}%`, minHeight: "6px" }}
                >
                  {/* Shimmer effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse" />
                </div>

                {/* Date label */}
                <span className="text-[9px] text-gray-400 font-mono group-hover:text-gray-300 transition-colors">
                  {date.slice(5)}
                </span>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="mt-6 flex items-center gap-4 text-xs uppercase tracking-wide font-[family-name:var(--font-jetbrains)]">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gradient-to-t from-red-400 to-yellow-400" />
            <span className="text-gray-400">&gt;10% Budget</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gradient-to-t from-cyan-400 to-green-400" />
            <span className="text-gray-400">Normal</span>
          </div>
        </div>
      </div>
    </div>
  );
}
