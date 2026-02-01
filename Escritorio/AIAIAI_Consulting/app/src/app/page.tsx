import { getProjects, getTokenData, getQuality } from "@/lib/data";
import { StatCard } from "@/components/stat-card";
import { ProjectCard } from "@/components/project-card";
import { TokenChart } from "@/components/token-chart";
import { getProjectFromUrl } from "@/lib/project-url";
import {
  filterProjects,
  filterTokenEntries,
  filterQualityEntries,
  calculateProjectStats,
  calculateTokenTotals,
} from "@/lib/data-filters";

export default function Home({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const projectId = getProjectFromUrl(searchParams);

  // Load all data
  const allProjects = getProjects();
  const tokenData = getTokenData();
  const allQuality = getQuality();

  // Filter by selected project
  const projects = filterProjects(allProjects, projectId);
  const tokenEntries = filterTokenEntries(tokenData.entries, projectId);
  const quality = filterQualityEntries(allQuality, projectId);

  // Calculate stats
  const projectStats = calculateProjectStats(projects);
  const tokenTotals = calculateTokenTotals(tokenEntries);

  const avgCoverage =
    quality.length > 0
      ? Math.round(
          quality.reduce(
            (sum, q) => sum + (q.testCoverage.frontend + q.testCoverage.backend) / 2,
            0
          ) / quality.length
        )
      : 0;

  const totalIssues = quality.reduce((sum, q) => sum + q.openIssues, 0);

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Proyectos totales"
          value={projectStats.total}
          subtitle={`${projectStats.active} activos`}
        />
        <StatCard
          title="Gasto mensual"
          value={`$${tokenTotals.totalCost.toFixed(2)}`}
          subtitle={`de $${tokenData.budget.monthly} presupuesto`}
        />
        <StatCard
          title="Cobertura promedio"
          value={`${avgCoverage}%`}
          subtitle="frontend + backend"
        />
        <StatCard title="Issues abiertos" value={totalIssues} subtitle="calidad de código" />
      </div>

      <TokenChart entries={tokenEntries} budget={tokenData.budget.monthly} />

      <div>
        <h2 className="text-xl font-semibold mb-4">Proyectos</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      </div>
    </div>
  );
}
