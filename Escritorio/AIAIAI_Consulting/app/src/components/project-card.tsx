import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ProjectHealthBadge } from "@/components/workflow/ProjectHealthBadge";
import { generateNextActions } from "@/lib/workflow-engine";
import { getLatestQuality } from "@/lib/data-filters";
import { getQuality } from "@/lib/data";
import type { Project } from "@/lib/data";

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

export function ProjectCard({ project, highlight }: { project: Project; highlight?: boolean }) {
  // Get quality data for this project
  const allQuality = getQuality();
  const quality = getLatestQuality(allQuality, project.id);

  // Get first next action
  const actions = generateNextActions(project, quality);
  const nextAction = actions[0];

  return (
    <Link href={`/projects/${project.id}`} className="block hover:shadow-lg transition-shadow rounded-lg">
    <Card className={highlight ? "ring-2 ring-cyan-500" : ""}>
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-lg">{project.name}</CardTitle>
          <div className="flex items-center gap-2">
            <ProjectHealthBadge project={project} quality={quality} />
            <Badge className={statusColors[project.status] ?? ""} variant="secondary">
              {statusLabels[project.status] ?? project.status}
            </Badge>
          </div>
        </div>
        <CardDescription>{project.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-muted-foreground">Progreso</span>
            <span className="font-medium">{project.progress}%</span>
          </div>
          <Progress value={project.progress} className="h-2" />
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Cliente:</span>{" "}
            <span className="font-medium">{project.client}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Tareas:</span>{" "}
            <span className="font-medium">{project.tasksDone}/{project.tasksTotal}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Deadline:</span>{" "}
            <span className="font-medium">{project.deadline}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Ultimo commit:</span>{" "}
            <span className="font-medium">{project.lastCommit}</span>
          </div>
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {project.stack.map((tech) => (
            <Badge key={tech} variant="outline" className="text-xs">
              {tech}
            </Badge>
          ))}
        </div>

        {nextAction && (
          <div className="pt-3 border-t border-border/50">
            <p className="text-xs text-muted-foreground">
              ⚡ <span className="font-semibold">Próximo:</span> {nextAction.title}
              <Badge variant="outline" className="ml-2 text-[10px]">
                {nextAction.priority}
              </Badge>
            </p>
          </div>
        )}
      </CardContent>
    </Card>
    </Link>
  );
}
