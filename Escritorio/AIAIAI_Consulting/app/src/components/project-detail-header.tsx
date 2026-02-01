import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ProjectHealthBadge } from "@/components/workflow/ProjectHealthBadge";
import type { Project, QualityEntry } from "@/lib/data";

const statusColors: Record<string, string> = {
  active: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  paused: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  completed: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
};

const statusLabels: Record<string, string> = {
  active: "Activo",
  paused: "Pausado",
  completed: "Completado",
};

export function ProjectDetailHeader({
  project,
  quality
}: {
  project: Project;
  quality?: QualityEntry;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <h1 className="text-3xl font-bold tracking-tight">{project.name}</h1>
        <ProjectHealthBadge project={project} quality={quality} />
        <Badge className={statusColors[project.status] ?? ""} variant="secondary">
          {statusLabels[project.status] ?? project.status}
        </Badge>
      </div>
      <p className="text-muted-foreground">{project.description}</p>
      <div className="flex items-center gap-6 text-sm">
        <div>
          <span className="text-muted-foreground">Cliente: </span>
          <span className="font-medium">{project.client}</span>
        </div>
        <div>
          <span className="text-muted-foreground">Inicio: </span>
          <span className="font-medium">{project.startDate}</span>
        </div>
        <div>
          <span className="text-muted-foreground">Deadline: </span>
          <span className="font-medium">{project.deadline}</span>
        </div>
      </div>
      <div>
        <div className="flex justify-between text-sm mb-1">
          <span className="text-muted-foreground">Progreso</span>
          <span className="font-medium">{project.progress}%</span>
        </div>
        <Progress value={project.progress} className="h-2" />
      </div>
      <div className="flex gap-1.5 flex-wrap">
        {project.stack.map((tech) => (
          <Badge key={tech} variant="outline" className="text-xs">
            {tech}
          </Badge>
        ))}
      </div>
    </div>
  );
}
