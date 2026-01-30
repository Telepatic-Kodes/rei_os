import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
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

export function ProjectCard({ project }: { project: Project }) {
  return (
    <Link href={`/projects/${project.id}`} className="block hover:shadow-lg transition-shadow rounded-lg">
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{project.name}</CardTitle>
          <Badge className={statusColors[project.status] ?? ""} variant="secondary">
            {statusLabels[project.status] ?? project.status}
          </Badge>
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
      </CardContent>
    </Card>
    </Link>
  );
}
