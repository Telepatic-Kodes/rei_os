import { getQuality, getProjects } from "@/lib/data";
import { StatCard } from "@/components/stat-card";
import { QualityCard } from "@/components/quality-badge";
import { getProjectFromUrl } from "@/lib/project-url";
import { filterQualityEntries } from "@/lib/data-filters";
import { BrutalistPanel } from "@/components/ui/brutalist-panel";
import { QuickAgentTrigger } from "@/components/quick-agent-trigger";

export default async function QualityPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const projectId = await getProjectFromUrl(searchParams);
  const allQuality = getQuality();
  const projects = getProjects();

  // Filter by selected project
  const filteredQuality = filterQualityEntries(allQuality, projectId);

  // Get only the latest entry per project
  const qualityByProject = new Map<string, (typeof filteredQuality)[0]>();
  for (const entry of filteredQuality) {
    const existing = qualityByProject.get(entry.project);
    if (!existing || entry.date > existing.date) {
      qualityByProject.set(entry.project, entry);
    }
  }
  const quality = Array.from(qualityByProject.values());

  const avgFrontend =
    quality.length > 0
      ? Math.round(quality.reduce((s, q) => s + q.testCoverage.frontend, 0) / quality.length)
      : 0;
  const avgBackend =
    quality.length > 0
      ? Math.round(quality.reduce((s, q) => s + q.testCoverage.backend, 0) / quality.length)
      : 0;
  const avgLighthouse =
    quality.length > 0
      ? Math.round(quality.reduce((s, q) => s + q.lighthouseScore, 0) / quality.length)
      : 0;
  const totalIssues = quality.reduce((s, q) => s + q.openIssues, 0);

  const frontendStatus = avgFrontend >= 80 ? 'green' : avgFrontend >= 60 ? 'yellow' : 'red';
  const backendStatus = avgBackend >= 85 ? 'green' : avgBackend >= 60 ? 'yellow' : 'red';
  const lighthouseStatus = avgLighthouse >= 90 ? 'green' : avgLighthouse >= 70 ? 'yellow' : 'red';
  const issuesStatus = totalIssues <= 5 ? 'green' : totalIssues <= 15 ? 'yellow' : 'red';

  // Determine if we should show quick fix agents
  const needsTestGeneration = avgFrontend < 80 || avgBackend < 85;
  const needsPerformanceBoost = avgLighthouse < 90;
  const needsCodeReview = totalIssues > 5;

  return (
    <main className="max-w-[2000px] mx-auto space-y-6">
      {/* Page Title */}
      <h1 className="text-3xl font-bold text-yellow-400 tracking-wider font-[family-name:var(--font-space)] uppercase">
        ▐ QUALITY METRICS ▌
      </h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Frontend Coverage"
          value={`${avgFrontend}%`}
          subtitle={avgFrontend < 80 ? "Below target (80%)" : "On target"}
          icon="%"
          color={frontendStatus}
          trend={avgFrontend >= 80 ? 'up' : 'down'}
        />
        <StatCard
          title="Backend Coverage"
          value={`${avgBackend}%`}
          subtitle={avgBackend < 85 ? "Below target (85%)" : "On target"}
          icon="%"
          color={backendStatus}
          trend={avgBackend >= 85 ? 'up' : 'down'}
        />
        <StatCard
          title="Lighthouse Avg"
          value={avgLighthouse}
          subtitle={avgLighthouse >= 90 ? "Excellent" : "Needs work"}
          icon="⚡"
          color={lighthouseStatus}
          trend={avgLighthouse >= 90 ? 'up' : 'neutral'}
        />
        <StatCard
          title="Open Issues"
          value={totalIssues}
          subtitle="code quality"
          icon="!"
          color={issuesStatus}
          trend={totalIssues <= 5 ? 'neutral' : 'up'}
        />
      </div>

      {/* Quick Fix Agents */}
      {(needsTestGeneration || needsPerformanceBoost || needsCodeReview) && (
        <BrutalistPanel title="Quick Fix Agents" borderColor="green">
          <div className="flex flex-wrap gap-3 mt-4">
            {needsTestGeneration && (
              <QuickAgentTrigger
                agentId="test-generator"
                agentName="Generate Tests"
                projectId={projectId}
                icon="🧪"
                variant="secondary"
              />
            )}
            {needsPerformanceBoost && (
              <QuickAgentTrigger
                agentId="performance-analyzer"
                agentName="Boost Performance"
                projectId={projectId}
                icon="⚡"
                variant="secondary"
              />
            )}
            {needsCodeReview && (
              <QuickAgentTrigger
                agentId="code-reviewer"
                agentName="Review Code"
                projectId={projectId}
                icon="🔍"
                variant="secondary"
              />
            )}
            <QuickAgentTrigger
              agentId="quality-boost-playbook"
              agentName="Run Quality Boost"
              projectId={projectId}
              icon="⚡"
              variant="primary"
            />
          </div>
          <div className="mt-4 p-3 bg-zinc-950 border-l-2 border-green-400">
            <div className="text-xs text-gray-400 font-[family-name:var(--font-jetbrains)]">
              ℹ️ Quick fix agents run immediately. Check Command Center for progress.
            </div>
          </div>
        </BrutalistPanel>
      )}

      {/* Quality Cards Grid */}
      <BrutalistPanel title="Project Quality Status" borderColor="yellow">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">
          {quality.map((entry) => {
            const project = projects.find((p) => p.id === entry.project);
            return (
              <QualityCard
                key={entry.project}
                entry={entry}
                projectName={project?.name ?? entry.project}
              />
            );
          })}
        </div>
        {quality.length === 0 && (
          <div className="text-center py-12 text-gray-500 uppercase tracking-wider text-sm">
            No quality data available
          </div>
        )}
      </BrutalistPanel>
    </main>
  );
}
