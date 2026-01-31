"use client";

import { useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface SpendTrendChartProps {
  data7d: Array<Record<string, string | number>>;
  data30d: Array<Record<string, string | number>>;
  modelKeys: string[];
}

// Colors for different models using CSS variables
const MODEL_COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

export function SpendTrendChart({
  data7d,
  data30d,
  modelKeys,
}: SpendTrendChartProps) {
  const [window, setWindow] = useState<"7d" | "30d">("7d");
  const activeData = window === "7d" ? data7d : data30d;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Daily Spend Trend</CardTitle>
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
        <ResponsiveContainer width="100%" height={300}>
          <LineChart
            data={activeData}
            margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="hsl(var(--border))"
            />
            <XAxis
              dataKey="date"
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
              tickFormatter={(val) => val.slice(5)} // Show MM-DD
            />
            <YAxis
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
              tickFormatter={(val) => `$${val}`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--popover))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "6px",
              }}
              formatter={(value) =>
                typeof value === "number" ? `$${value.toFixed(2)}` : value
              }
            />
            <Legend />
            {modelKeys.map((modelKey, index) => (
              <Line
                key={modelKey}
                type="monotone"
                dataKey={modelKey}
                name={modelKey}
                stroke={MODEL_COLORS[index % MODEL_COLORS.length]}
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
