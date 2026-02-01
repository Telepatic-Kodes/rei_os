import { getProjects } from "@/lib/data";
import { ProjectCard } from "@/components/project-card";
import { getProjectFromUrl } from "@/lib/project-url";
import { filterProjects } from "@/lib/data-filters";

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
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Proyectos</h1>

      {active.length > 0 && (
        <section>
          <h2 className="text-xl font-semibold mb-4">Activos ({active.length})</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {active.map((p) => (
              <ProjectCard key={p.id} project={p} highlight={projectId === p.id} />
            ))}
          </div>
        </section>
      )}

      {paused.length > 0 && (
        <section>
          <h2 className="text-xl font-semibold mb-4">Pausados ({paused.length})</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {paused.map((p) => (
              <ProjectCard key={p.id} project={p} highlight={projectId === p.id} />
            ))}
          </div>
        </section>
      )}

      {completed.length > 0 && (
        <section>
          <h2 className="text-xl font-semibold mb-4">Completados ({completed.length})</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {completed.map((p) => (
              <ProjectCard key={p.id} project={p} highlight={projectId === p.id} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
