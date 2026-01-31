"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { Analytics } from "@/lib/schemas";

interface BurnRateCardProps {
  analytics: Analytics;
  budget: number;
}

export function BurnRateCard({ analytics, budget }: BurnRateCardProps) {
  const window30d = analytics.windows["30d"];

  // Calculate burn rate projection
  const burnRate = window30d.burnRate;
  const spent = window30d.totalCost;
  const remaining = Math.max(0, budget - spent);
  const daysUntilExhaustion = remaining > 0 ? Math.floor(remaining / burnRate) : 0;

  // Calculate exhaustion date
  const exhaustionDate = new Date();
  exhaustionDate.setDate(exhaustionDate.getDate() + daysUntilExhaustion);
  const formattedExhaustionDate = exhaustionDate.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  // Determine severity
  const severity = daysUntilExhaustion < 7
    ? "critical"
    : daysUntilExhaustion < 15
    ? "warning"
    : "normal";

  const severityColors = {
    critical: "text-red-600 dark:text-red-500",
    warning: "text-orange-600 dark:text-orange-500",
    normal: "text-green-600 dark:text-green-500",
  };

  const progressValue = (spent / budget) * 100;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Budget Burn Rate</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Daily burn rate */}
        <div>
          <div className="text-sm text-muted-foreground">Daily Average (30d)</div>
          <div className="text-2xl font-bold">${burnRate.toFixed(2)}/day</div>
        </div>

        {/* Exhaustion date */}
        <div>
          <div className="text-sm text-muted-foreground">Budget Exhaustion</div>
          <div className={`text-lg font-semibold ${severityColors[severity]}`}>
            {daysUntilExhaustion > 0 ? (
              <>
                {formattedExhaustionDate}
                <span className="ml-2 text-sm font-normal">
                  ({daysUntilExhaustion} days)
                </span>
              </>
            ) : (
              "Budget exceeded"
            )}
          </div>
        </div>

        {/* Budget progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Spent (30d)</span>
            <span className="font-medium">${spent.toFixed(2)}</span>
          </div>
          <Progress value={Math.min(100, progressValue)} />
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Remaining</span>
            <span className="font-medium">${remaining.toFixed(2)}</span>
          </div>
        </div>

        {/* Budget total */}
        <div className="pt-2 border-t border-border">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Monthly Budget</span>
            <span className="font-semibold">${budget.toFixed(2)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
