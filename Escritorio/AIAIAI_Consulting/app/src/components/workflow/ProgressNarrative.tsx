import { Card, CardContent } from "@/components/ui/card";
import type { Project, QualityEntry } from "@/lib/schemas";
import { generateProgressNarrative } from "@/lib/workflow-engine";

interface ProgressNarrativeProps {
  project: Project;
  quality?: QualityEntry;
}

/**
 * Human-readable project progress story
 * Provides context-aware narrative about project state
 */
export function ProgressNarrative({ project, quality }: ProgressNarrativeProps) {
  const narrative = generateProgressNarrative(project, quality);

  return (
    <Card className="border-l-4 border-l-cyan-500">
      <CardContent className="pt-6">
        <p className="text-sm leading-relaxed text-foreground/90">{narrative}</p>
      </CardContent>
    </Card>
  );
}
