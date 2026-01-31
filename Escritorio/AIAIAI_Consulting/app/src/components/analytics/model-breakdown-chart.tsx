"use client";

import { useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { AnalyticsWindow } from "@/lib/schemas";

interface ModelBreakdownChartProps {
  data7d: AnalyticsWindow;
  data30d: AnalyticsWindow;
}

// Colors for different models
const MODEL_COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

export function ModelBreakdownChart({ data7d, data30d }: ModelBreakdownChartProps) {
  const [window, setWindow] = useState<"7d" | "30d">("30d");
  const activeData = window === "7d" ? data7d : data30d;

  // Transform byModel data into chart array
  const chartData = Object.entries(activeData.byModel).map(([model, stats]) => ({
    model: model
      .replace("claude-", "")
      .replace(/-/g, " ")
      .replace("opus 4 5", "Opus 4.5")
      .replace("sonnet 4 5", "Sonnet 4.5"),
    cost: stats.cost,
    tokensIn: stats.tokensIn,
    tokensOut: stats.tokensOut,
  }))
  .sort((a, b) => b.cost - a.cost); // Sort by cost descending

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Cost by Model</CardTitle>
          <div className="flex gap-2">
            <button
              onClick={() => setWindow("7d")}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                window === "7d"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              7D
            </button>
            <button
              onClick={() => setWindow("30d")}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                window === "30d"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              30D
            </button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="hsl(var(--border))"
              horizontal={false}
            />
            <XAxis
              type="number"
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
              tickFormatter={(val) => `$${val}`}
            />
            <YAxis
              dataKey="model"
              type="category"
              width={100}
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--popover))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "6px",
              }}
              formatter={(value, name) => {
                if (name === "cost") {
                  return [`$${(value as number).toFixed(2)}`, "Cost"];
                }
                return [value, name];
              }}
            />
            <Bar dataKey="cost" radius={[0, 4, 4, 0]}>
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${entry.model}`}
                  fill={MODEL_COLORS[index % MODEL_COLORS.length]}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
