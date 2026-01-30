import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import type { Project } from "@/lib/data";

interface KanbanCardProps {
  project: Project;
  onDragStart: (e: React.DragEvent, projectId: string) => void;
}

export function KanbanCard({ project, onDragStart }: KanbanCardProps) {
  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, project.id)}
      className="rounded-lg border bg-card p-3 shadow-sm cursor-grab active:cursor-grabbing hover:border-primary/50 transition-colors"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <Link
          href={`/projects/${project.id}`}
          onDragStart={(e) => e.stopPropagation()}
          className="font-medium text-sm leading-tight hover:underline"
        >
          {project.name}
        </Link>
      </div>
      <p className="text-xs text-muted-foreground mb-3 line-clamp-1">
        {project.description}
      </p>
      <div className="space-y-2">
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">{project.client}</span>
          <span className="font-medium">{project.progress}%</span>
        </div>
        <Progress value={project.progress} className="h-1.5" />
        <div className="flex gap-1 flex-wrap">
          {project.stack.slice(0, 3).map((tech) => (
            <Badge key={tech} variant="outline" className="text-[10px] px-1.5 py-0">
              {tech}
            </Badge>
          ))}
          {project.stack.length > 3 && (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0">
              +{project.stack.length - 3}
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
}
