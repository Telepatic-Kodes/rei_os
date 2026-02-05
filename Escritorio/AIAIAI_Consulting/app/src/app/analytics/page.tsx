import { getAnalytics, getDailySpendByModel, getBudgetConfig } from "@/lib/data";
import { SpendTrendChart } from "@/components/analytics/spend-trend-chart";
import { ModelBreakdownChart } from "@/components/analytics/model-breakdown-chart";
import { BurnRateCard } from "@/components/analytics/burn-rate-card";
import { StatCard } from "@/components/stat-card";
import { BrutalistPanel } from "@/components/ui/brutalist-panel";

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

  // Calculate status
  const budgetPercent = (window30d.totalCost / budget.monthly) * 100;
  const spendStatus = budgetPercent > 80 ? 'red' : budgetPercent > 60 ? 'yellow' : 'green';
  const burnRateStatus = window30d.burnRate > (budget.monthly / 30) * 1.2 ? 'red' : 'yellow';

  return (
    <main className="max-w-[2000px] mx-auto space-y-6">
      {/* Page Title */}
      <h1 className="text-3xl font-bold text-cyan-400 tracking-wider font-[family-name:var(--font-space)] uppercase">
        ▐ ANALYTICS ▌
      </h1>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="30-Day Spend"
          value={`$${window30d.totalCost.toFixed(2)}`}
          subtitle={`of $${budget.monthly} budget`}
          icon="$"
          color={spendStatus}
          trend={budgetPercent > 80 ? 'up' : 'neutral'}
          trendValue={`${budgetPercent.toFixed(0)}%`}
        />
        <StatCard
          title="Daily Burn Rate"
          value={`$${window30d.burnRate.toFixed(2)}/day`}
          subtitle="average spend"
          icon="🔥"
          color={burnRateStatus}
        />
        <StatCard
          title="Tokens (30d)"
          value={`${totalTokensM}M`}
          subtitle="in + out combined"
          icon="⚡"
          color="purple"
        />
        <StatCard
          title="Active Models"
          value={activeModels.toString()}
          subtitle="in use"
          icon="#"
          color="cyan"
        />
      </div>

      {/* Spend Trend and Burn Rate */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <BrutalistPanel title="Spend Trend" borderColor="green">
          <SpendTrendChart data7d={data7d} data30d={data30d} modelKeys={modelKeys} />
        </BrutalistPanel>

        <BrutalistPanel title="Burn Rate Analysis" borderColor="yellow">
          <BurnRateCard analytics={analytics} budget={budget.monthly} />
        </BrutalistPanel>
      </div>

      {/* Model Breakdown */}
      <BrutalistPanel title="Model Usage Breakdown" borderColor="purple">
        <ModelBreakdownChart data7d={analytics.windows["7d"]} data30d={analytics.windows["30d"]} />
      </BrutalistPanel>
    </main>
  );
}
