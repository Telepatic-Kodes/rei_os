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
import { BrutalistPanel } from "@/components/ui/brutalist-panel";
import { CommandCenterWidget } from "@/components/command-center-widget";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const projectId = await getProjectFromUrl(searchParams);

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

  const budgetPercent = (tokenTotals.totalCost / tokenData.budget.monthly) * 100;
  const coverageStatus = avgCoverage >= 80 ? 'green' : avgCoverage >= 60 ? 'yellow' : 'red';

  return (
    <main className="max-w-[2000px] mx-auto space-y-6">
      {/* Page Title */}
      <h1 className="text-3xl font-bold text-cyan-400 tracking-wider font-[family-name:var(--font-space)] uppercase">
        ▐ DASHBOARD ▌
      </h1>

      {/* Stats Grid - 4 columns */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Projects"
          value={projectStats.total}
          subtitle={`${projectStats.active} active`}
          icon="~"
          color="cyan"
        />
        <StatCard
          title="Monthly Budget"
          value={`$${tokenTotals.totalCost.toFixed(2)}`}
          subtitle={`of $${tokenData.budget.monthly}`}
          icon="$"
          color={budgetPercent > 80 ? 'red' : budgetPercent > 60 ? 'yellow' : 'green'}
          trend={budgetPercent > 80 ? 'up' : 'neutral'}
          trendValue={`${budgetPercent.toFixed(0)}%`}
        />
        <StatCard
          title="Test Coverage"
          value={`${avgCoverage}%`}
          subtitle="avg frontend + backend"
          icon="%"
          color={coverageStatus}
          trend={avgCoverage >= 80 ? 'up' : avgCoverage >= 60 ? 'neutral' : 'down'}
        />
        <StatCard
          title="Open Issues"
          value={totalIssues}
          subtitle="code quality"
          icon="!"
          color={totalIssues > 10 ? 'red' : totalIssues > 5 ? 'yellow' : 'green'}
        />
      </div>

      {/* Token Chart and Agent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <BrutalistPanel title="Token Usage Monitor" borderColor="green">
            <TokenChart entries={tokenEntries} budget={tokenData.budget.monthly} />
          </BrutalistPanel>
        </div>
        <div className="lg:col-span-1">
          <CommandCenterWidget />
        </div>
      </div>

      {/* Projects Grid */}
      <BrutalistPanel title="Active Projects" borderColor="purple">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
        {projects.length === 0 && (
          <div className="text-center py-12 text-gray-500 uppercase tracking-wider text-sm">
            No projects found
          </div>
        )}
      </BrutalistPanel>
    </main>
  );
}
