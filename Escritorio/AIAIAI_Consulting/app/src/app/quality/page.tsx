import { getQuality, getProjects } from "@/lib/data";
import { StatCard } from "@/components/stat-card";
import { QualityCard } from "@/components/quality-badge";
import { getProjectFromUrl } from "@/lib/project-url";
import { filterQualityEntries } from "@/lib/data-filters";

export default function QualityPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const projectId = getProjectFromUrl(searchParams);
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

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Metricas de Calidad</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Coverage Frontend"
          value={`${avgFrontend}%`}
          subtitle={avgFrontend < 80 ? "Bajo meta (80%)" : "En meta"}
        />
        <StatCard
          title="Coverage Backend"
          value={`${avgBackend}%`}
          subtitle={avgBackend < 85 ? "Bajo meta (85%)" : "En meta"}
        />
        <StatCard
          title="Lighthouse promedio"
          value={avgLighthouse}
          subtitle={avgLighthouse >= 90 ? "Excelente" : "Mejorable"}
        />
        <StatCard title="Issues abiertos" value={totalIssues} subtitle="calidad de código" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
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
    </div>
  );
}
