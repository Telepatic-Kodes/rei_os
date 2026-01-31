import { getAnalytics, getDailySpendByModel, getBudgetConfig } from "@/lib/data";
import { SpendTrendChart } from "@/components/analytics/spend-trend-chart";
import { ModelBreakdownChart } from "@/components/analytics/model-breakdown-chart";
import { BurnRateCard } from "@/components/analytics/burn-rate-card";
import { StatCard } from "@/components/stat-card";

export default function AnalyticsPage() {
  const analytics = getAnalytics();
  const budget = getBudgetConfig();
  const data7d = getDailySpendByModel(7);
  const data30d = getDailySpendByModel(30);

  // Extract model keys from the first data point (if data exists)
  const modelKeys =
    data7d.length > 0
      ? Object.keys(data7d[0]).filter((key) => key !== "date")
      : [];

  const window30d = analytics.windows["30d"];

  // Format tokens in millions
  const totalTokensM = (
    (window30d.tokensIn + window30d.tokensOut) /
    1000000
  ).toFixed(1);

  // Count active models
  const activeModels = Object.keys(window30d.byModel).length;

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Analytics</h1>

      {/* Summary stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="30-Day Spend"
          value={`$${window30d.totalCost.toFixed(2)}`}
        />
        <StatCard
          title="Daily Burn Rate"
          value={`$${window30d.burnRate.toFixed(2)}/day`}
        />
        <StatCard title="Tokens (30d)" value={`${totalTokensM}M`} />
        <StatCard title="Active Models" value={activeModels.toString()} />
      </div>

      {/* Spend trend and burn rate cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <SpendTrendChart data7d={data7d} data30d={data30d} modelKeys={modelKeys} />
        <BurnRateCard analytics={analytics} budget={budget.monthly} />
      </div>

      {/* Model breakdown chart */}
      <ModelBreakdownChart data7d={analytics.windows["7d"]} data30d={analytics.windows["30d"]} />
    </div>
  );
}
