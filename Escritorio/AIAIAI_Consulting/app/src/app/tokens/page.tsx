import { getTokenData, getProjects } from "@/lib/data";
import { StatCard } from "@/components/stat-card";
import { TokenChart } from "@/components/token-chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getProjectFromUrl } from "@/lib/project-url";
import { filterTokenEntries, calculateTokenTotals } from "@/lib/data-filters";

export default function TokensPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const projectId = getProjectFromUrl(searchParams);
  const tokenData = getTokenData();
  const projects = getProjects();

  // Filter entries by selected project
  const entries = filterTokenEntries(tokenData.entries, projectId);
  const totals = calculateTokenTotals(entries);

  const remaining = tokenData.budget.monthly - totals.totalCost;

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

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Consumo de Tokens</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Gasto total"
          value={`$${totals.totalCost.toFixed(2)}`}
          subtitle={`de $${tokenData.budget.monthly}`}
        />
        <StatCard
          title="Restante"
          value={`$${remaining.toFixed(2)}`}
          subtitle={remaining < 20 ? "Bajo!" : "disponible"}
        />
        <StatCard
          title="Tokens entrada"
          value={`${(totals.totalTokensIn / 1000).toFixed(0)}K`}
          subtitle="total acumulado"
        />
        <StatCard
          title="Tokens salida"
          value={`${(totals.totalTokensOut / 1000).toFixed(0)}K`}
          subtitle="total acumulado"
        />
      </div>

      <TokenChart entries={entries} budget={tokenData.budget.monthly} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Gasto por proyecto</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.entries(costByProject)
              .sort(([, a], [, b]) => b - a)
              .map(([pid, cost]) => {
                const project = projects.find((p) => p.id === pid);
                const percent =
                  totals.totalCost > 0 ? Math.round((cost / totals.totalCost) * 100) : 0;
                return (
                  <div key={pid} className="flex items-center justify-between">
                    <span className="text-sm">{project?.name ?? pid}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">${cost.toFixed(2)}</span>
                      <Badge variant="outline" className="text-xs">
                        {percent}%
                      </Badge>
                    </div>
                  </div>
                );
              })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Gasto por modelo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.entries(costByModel)
              .sort(([, a], [, b]) => b - a)
              .map(([model, cost]) => {
                const percent =
                  totals.totalCost > 0 ? Math.round((cost / totals.totalCost) * 100) : 0;
                return (
                  <div key={model} className="flex items-center justify-between">
                    <span className="text-sm font-mono">{model}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">${cost.toFixed(2)}</span>
                      <Badge variant="outline" className="text-xs">
                        {percent}%
                      </Badge>
                    </div>
                  </div>
                );
              })}
          </CardContent>
        </Card>
      </div>

      {/* Recent entries table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Entradas recientes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="pb-2 pr-4">Fecha</th>
                  <th className="pb-2 pr-4">Proyecto</th>
                  <th className="pb-2 pr-4">Sesion</th>
                  <th className="pb-2 pr-4">Modelo</th>
                  <th className="pb-2 text-right">Costo</th>
                </tr>
              </thead>
              <tbody>
                {[...entries].reverse().map((entry, i) => (
                  <tr key={i} className="border-b border-border/50">
                    <td className="py-2 pr-4">{entry.date}</td>
                    <td className="py-2 pr-4">
                      {projects.find((p) => p.id === entry.project)?.name ?? entry.project}
                    </td>
                    <td className="py-2 pr-4 font-mono text-xs">{entry.session}</td>
                    <td className="py-2 pr-4 font-mono text-xs">{entry.model}</td>
                    <td className="py-2 text-right font-medium">${entry.cost.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
