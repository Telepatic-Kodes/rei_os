import { Badge } from "@/components/ui/badge";
import type { Project, QualityEntry } from "@/lib/schemas";
import { computeHealthScore } from "@/lib/workflow-engine";

interface ProjectHealthBadgeProps {
  project: Project;
  quality?: QualityEntry;
  showTooltip?: boolean;
}

/**
 * Health score badge (0-100) with color coding
 * Green: >80, Yellow: 50-80, Red: <50
 */
export function ProjectHealthBadge({ project, quality, showTooltip = true }: ProjectHealthBadgeProps) {
  const score = computeHealthScore(project, quality);

  const getColorClass = (score: number) => {
    if (score >= 80) {
      return "bg-green-500/20 text-green-400 border-green-500/30";
    } else if (score >= 50) {
      return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
    } else {
      return "bg-red-500/20 text-red-400 border-red-500/30";
    }
  };

  const getLabel = (score: number) => {
    if (score >= 80) return "Saludable";
    if (score >= 50) return "Atención";
    return "Crítico";
  };

  return (
    <Badge
      variant="outline"
      className={`${getColorClass(score)} text-xs font-mono`}
      title={
        showTooltip
          ? `Health Score: ${score}/100 - ${getLabel(score)}`
          : undefined
      }
    >
      ❤️ {score}
    </Badge>
  );
}
