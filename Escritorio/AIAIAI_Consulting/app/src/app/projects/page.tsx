import { getProjects } from "@/lib/data";
import { ProjectCard } from "@/components/project-card";
import { getProjectFromUrl } from "@/lib/project-url";
import { filterProjects } from "@/lib/data-filters";
import { BrutalistPanel } from "@/components/ui/brutalist-panel";

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const projectId = await getProjectFromUrl(searchParams);
  const allProjects = getProjects();
  const projects = filterProjects(allProjects, projectId);

  const active = projects.filter((p) => p.status === "active");
  const completed = projects.filter((p) => p.status === "completed");
  const paused = projects.filter((p) => p.status === "paused");

  return (
    <main className="max-w-[2000px] mx-auto space-y-6">
      {/* Page Title */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-purple-400 tracking-wider font-[family-name:var(--font-space)] uppercase">
          ▐ PROJECTS ▌
        </h1>
        <div className="flex gap-4 text-xs uppercase tracking-widest font-[family-name:var(--font-jetbrains)]">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-400" />
            <span className="text-gray-400">Active: <span className="text-green-400">{active.length}</span></span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-yellow-400" />
            <span className="text-gray-400">Paused: <span className="text-yellow-400">{paused.length}</span></span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-cyan-400" />
            <span className="text-gray-400">Done: <span className="text-cyan-400">{completed.length}</span></span>
          </div>
        </div>
      </div>

      {/* Active Projects */}
      {active.length > 0 && (
        <BrutalistPanel title={`Active Projects (${active.length})`} borderColor="green">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">
            {active.map((p) => (
              <ProjectCard key={p.id} project={p} highlight={projectId === p.id} />
            ))}
          </div>
        </BrutalistPanel>
      )}

      {/* Paused Projects */}
      {paused.length > 0 && (
        <BrutalistPanel title={`Paused Projects (${paused.length})`} borderColor="yellow">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">
            {paused.map((p) => (
              <ProjectCard key={p.id} project={p} highlight={projectId === p.id} />
            ))}
          </div>
        </BrutalistPanel>
      )}

      {/* Completed Projects */}
      {completed.length > 0 && (
        <BrutalistPanel title={`Completed Projects (${completed.length})`} borderColor="cyan">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">
            {completed.map((p) => (
              <ProjectCard key={p.id} project={p} highlight={projectId === p.id} />
            ))}
          </div>
        </BrutalistPanel>
      )}

      {/* Empty state */}
      {projects.length === 0 && (
        <BrutalistPanel title="No Projects" borderColor="purple">
          <div className="text-center py-12 text-gray-500 uppercase tracking-wider text-sm">
            No projects found
          </div>
        </BrutalistPanel>
      )}
    </main>
  );
}
