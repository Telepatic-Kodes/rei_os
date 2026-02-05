import { getTokenData, getProjects } from "@/lib/data";
import { StatCard } from "@/components/stat-card";
import { TokenChart } from "@/components/token-chart";
import { BrutalistPanel } from "@/components/ui/brutalist-panel";
import { TerminalTable } from "@/components/ui/terminal-table";
import { Badge } from "@/components/ui/badge";
import { getProjectFromUrl } from "@/lib/project-url";
import { filterTokenEntries, calculateTokenTotals } from "@/lib/data-filters";

export default async function TokensPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const projectId = await getProjectFromUrl(searchParams);
  const tokenData = getTokenData();
  const projects = getProjects();

  // Filter entries by selected project
  const entries = filterTokenEntries(tokenData.entries, projectId);
  const totals = calculateTokenTotals(entries);

  const remaining = tokenData.budget.monthly - totals.totalCost;
  const budgetPercent = (totals.totalCost / tokenData.budget.monthly) * 100;
  const budgetStatus = budgetPercent > 80 ? 'red' : budgetPercent > 60 ? 'yellow' : 'green';

  // Cost per project (from filtered entries)
  const costByProject: Record<string, number> = {};
  for (const entry of entries) {
    costByProject[entry.project] = (costByProject[entry.project] ?? 0) + entry.cost;
  }

  // Cost per model (from filtered entries)
  const costByModel: Record<string, number> = {};
  for (const entry of entries) {
    costByModel[entry.model] = (costByModel[entry.model] ?? 0) + entry.cost;
  }

  const projectBreakdown = Object.entries(costByProject)
    .sort(([, a], [, b]) => b - a)
    .map(([pid, cost]) => {
      const project = projects.find((p) => p.id === pid);
      const percent = totals.totalCost > 0 ? Math.round((cost / totals.totalCost) * 100) : 0;
      return { project: project?.name ?? pid, cost, percent };
    });

  const modelBreakdown = Object.entries(costByModel)
    .sort(([, a], [, b]) => b - a)
    .map(([model, cost]) => {
      const percent = totals.totalCost > 0 ? Math.round((cost / totals.totalCost) * 100) : 0;
      return { model, cost, percent };
    });

  const recentEntries = [...entries].reverse().slice(0, 20).map((entry) => ({
    date: entry.date,
    project: projects.find((p) => p.id === entry.project)?.name ?? entry.project,
    session: entry.session,
    model: entry.model,
    cost: entry.cost
  }));

  return (
    <main className="max-w-[2000px] mx-auto space-y-6">
      {/* Page Title */}
      <h1 className="text-3xl font-bold text-green-400 tracking-wider font-[family-name:var(--font-space)] uppercase">
        ▐ TOKEN USAGE ▌
      </h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Spent"
          value={`$${totals.totalCost.toFixed(2)}`}
          subtitle={`of $${tokenData.budget.monthly}`}
          icon="$"
          color={budgetStatus}
          trend={budgetPercent > 80 ? 'up' : 'neutral'}
          trendValue={`${budgetPercent.toFixed(0)}%`}
        />
        <StatCard
          title="Remaining"
          value={`$${remaining.toFixed(2)}`}
          subtitle={remaining < 20 ? "Critical!" : "available"}
          icon="$"
          color={remaining < 20 ? 'red' : remaining < 50 ? 'yellow' : 'green'}
          trend={remaining < 20 ? 'down' : 'neutral'}
        />
        <StatCard
          title="Input Tokens"
          value={`${(totals.totalTokensIn / 1000).toFixed(0)}K`}
          subtitle="total accumulated"
          icon="→"
          color="cyan"
        />
        <StatCard
          title="Output Tokens"
          value={`${(totals.totalTokensOut / 1000).toFixed(0)}K`}
          subtitle="total accumulated"
          icon="←"
          color="purple"
        />
      </div>

      {/* Token Chart */}
      <BrutalistPanel title="Usage Trend" borderColor="green">
        <TokenChart entries={entries} budget={tokenData.budget.monthly} />
      </BrutalistPanel>

      {/* Breakdown Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cost by Project */}
        <BrutalistPanel title="Cost by Project" borderColor="purple">
          <div className="space-y-3 mt-4">
            {projectBreakdown.map((item) => (
              <div key={item.project} className="flex items-center justify-between p-3 bg-zinc-950 border-l-2 border-purple-400">
                <span className="text-sm uppercase tracking-wide text-white font-[family-name:var(--font-jetbrains)]">
                  {item.project}
                </span>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-mono text-green-400">${item.cost.toFixed(2)}</span>
                  <Badge variant="outline" className="text-xs border-gray-700 text-gray-400 font-mono">
                    {item.percent}%
                  </Badge>
                </div>
              </div>
            ))}
            {projectBreakdown.length === 0 && (
              <div className="text-center py-8 text-gray-500 uppercase tracking-wider text-xs">
                No data available
              </div>
            )}
          </div>
        </BrutalistPanel>

        {/* Cost by Model */}
        <BrutalistPanel title="Cost by Model" borderColor="cyan">
          <div className="space-y-3 mt-4">
            {modelBreakdown.map((item) => (
              <div key={item.model} className="flex items-center justify-between p-3 bg-zinc-950 border-l-2 border-cyan-400">
                <span className="text-sm font-mono text-white">
                  {item.model}
                </span>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-mono text-green-400">${item.cost.toFixed(2)}</span>
                  <Badge variant="outline" className="text-xs border-gray-700 text-gray-400 font-mono">
                    {item.percent}%
                  </Badge>
                </div>
              </div>
            ))}
            {modelBreakdown.length === 0 && (
              <div className="text-center py-8 text-gray-500 uppercase tracking-wider text-xs">
                No data available
              </div>
            )}
          </div>
        </BrutalistPanel>
      </div>

      {/* Recent Entries Table */}
      <TerminalTable
        title="Recent Entries"
        borderColor="green"
        columns={[
          { key: 'date', header: 'DATE' },
          { key: 'project', header: 'PROJECT' },
          {
            key: 'session',
            header: 'SESSION',
            render: (value) => (
              <span className="font-mono text-xs text-gray-400">{String(value)}</span>
            )
          },
          {
            key: 'model',
            header: 'MODEL',
            render: (value) => (
              <span className="font-mono text-xs text-cyan-400">{String(value)}</span>
            )
          },
          {
            key: 'cost',
            header: 'COST',
            render: (value) => (
              <span className="text-green-400 font-mono">${Number(value).toFixed(2)}</span>
            )
          }
        ]}
        data={recentEntries}
      />
    </main>
  );
}
