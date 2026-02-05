import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { ProjectHealthBadge } from "@/components/workflow/ProjectHealthBadge";
import { generateNextActions } from "@/lib/workflow-engine";
import { getLatestQuality } from "@/lib/data-filters";
import { getQuality } from "@/lib/data";
import type { Project } from "@/lib/data";

const statusColors: Record<string, { bg: string; text: string; border: string }> = {
  active: { bg: 'bg-green-950/20', text: 'text-green-400', border: 'border-green-400' },
  paused: { bg: 'bg-yellow-950/20', text: 'text-yellow-400', border: 'border-yellow-400' },
  completed: { bg: 'bg-cyan-950/20', text: 'text-cyan-400', border: 'border-cyan-400' },
};

const statusIcons: Record<string, string> = {
  active: '▸',
  paused: '▌▌',
  completed: '✓',
};

export function ProjectCard({ project, highlight }: { project: Project; highlight?: boolean }) {
  // Get quality data for this project
  const allQuality = getQuality();
  const quality = getLatestQuality(allQuality, project.id);

  // Get first next action
  const actions = generateNextActions(project, quality);
  const nextAction = actions[0];

  const statusStyle = statusColors[project.status] || statusColors.active;
  const statusIcon = statusIcons[project.status] || '▸';

  return (
    <Link href={`/projects/${project.id}`} className="block">
      <div
        className={`
          border-2 border-purple-400 bg-black p-6
          hover:bg-zinc-950 transition-colors
          relative cursor-pointer
          ${highlight ? 'ring-4 ring-cyan-400 ring-offset-2 ring-offset-black' : ''}
        `}
      >
        {/* Status indicator - left bar */}
        <div className={`absolute left-0 top-0 bottom-0 w-1 ${statusStyle.text.replace('text-', 'bg-')}`} />

        {/* Header */}
        <div className="flex items-start justify-between mb-4 gap-4">
          <h3 className="text-xl font-bold text-purple-400 uppercase tracking-wide font-[family-name:var(--font-space)]">
            {project.name}
          </h3>
          <div className="flex items-center gap-2 shrink-0">
            <ProjectHealthBadge project={project} quality={quality} />
            <Badge
              variant="outline"
              className={`${statusStyle.bg} ${statusStyle.text} border-2 ${statusStyle.border} text-xs uppercase tracking-wide`}
            >
              {statusIcon} {project.status}
            </Badge>
          </div>
        </div>

        {/* Description */}
        <p className="text-sm text-gray-400 mb-4 font-[family-name:var(--font-jetbrains)]">
          {project.description}
        </p>

        {/* Progress bar with gradient */}
        <div className="mb-4">
          <div className="flex justify-between text-xs uppercase tracking-wide mb-2">
            <span className="text-gray-500">Progress</span>
            <span className="text-white font-mono">{project.progress}%</span>
          </div>
          <div className="h-2 bg-zinc-900 relative overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-yellow-400 to-green-400 relative"
              style={{ width: `${project.progress}%` }}
            >
              {/* Animated shimmer effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse" />
            </div>
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-4 text-xs uppercase tracking-wide mb-4 font-[family-name:var(--font-jetbrains)]">
          <div>
            <span className="text-gray-500">Client:</span>
            <span className="text-white ml-2">{project.client}</span>
          </div>
          <div>
            <span className="text-gray-500">Tasks:</span>
            <span className="text-green-400 ml-2 font-mono">{project.tasksDone}/{project.tasksTotal}</span>
          </div>
          <div>
            <span className="text-gray-500">Deadline:</span>
            <span className="text-white ml-2 font-mono">{project.deadline}</span>
          </div>
          <div>
            <span className="text-gray-500">Last Commit:</span>
            <span className="text-white ml-2 font-mono">{project.lastCommit}</span>
          </div>
        </div>

        {/* Stack tags */}
        <div className="flex gap-2 flex-wrap mb-4">
          {project.stack.map((tech) => (
            <Badge
              key={tech}
              variant="outline"
              className="text-[10px] uppercase tracking-wider border-gray-700 text-gray-400 font-[family-name:var(--font-jetbrains)]"
            >
              {tech}
            </Badge>
          ))}
        </div>

        {/* Next action preview */}
        {nextAction && (
          <div className="pt-4 border-t-2 border-gray-800">
            <div className="text-yellow-400 text-xs uppercase tracking-wide flex items-center gap-2 font-[family-name:var(--font-jetbrains)]">
              <span className="text-base">⚡</span>
              <span>Next:</span>
              <span className="text-white">{nextAction.title}</span>
              <Badge
                variant="outline"
                className="ml-auto text-[10px] border-yellow-400 text-yellow-400 uppercase"
              >
                {nextAction.priority}
              </Badge>
            </div>
          </div>
        )}
      </div>
    </Link>
  );
}
