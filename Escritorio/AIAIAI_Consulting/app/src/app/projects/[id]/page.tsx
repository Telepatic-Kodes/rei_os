import Link from "next/link";
import { notFound } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getProjectById, getQualityByProject } from "@/lib/data";
import { ProjectDetailHeader } from "@/components/project-detail-header";
import { ProjectTimeline } from "@/components/project-timeline";
import { ProjectMetrics } from "@/components/project-metrics";
import { NextActionsCard } from "@/components/workflow/NextActionsCard";
import { ProgressNarrative } from "@/components/workflow/ProgressNarrative";
import { generateNextActions } from "@/lib/workflow-engine";
import { BrutalistButton } from "@/components/ui/brutalist-button";
import { ProjectAgentsSection } from "@/components/project-agents-section";

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const project = getProjectById(id);

  if (!project) {
    notFound();
  }

  const qualityEntries = getQualityByProject(project.name);
  const latestQuality = qualityEntries.length > 0
    ? qualityEntries[qualityEntries.length - 1]
    : undefined;

  // Generate workflow recommendations
  const nextActions = generateNextActions(project, latestQuality);

  return (
    <main className="max-w-[2000px] mx-auto space-y-6">
      {/* Back Button */}
      <Link href="/projects">
        <BrutalistButton variant="ghost" size="sm">
          ← Back to Projects
        </BrutalistButton>
      </Link>

      {/* Project Header */}
      <ProjectDetailHeader project={project} quality={latestQuality} />

      {/* Tabs */}
      <div className="border-2 border-cyan-400 bg-zinc-950">
        <Tabs defaultValue="resumen" className="w-full">
          <TabsList className="w-full bg-black border-b-2 border-gray-800 rounded-none h-auto p-0">
            <TabsTrigger
              value="resumen"
              className="
                uppercase tracking-widest font-[family-name:var(--font-jetbrains)] text-xs
                data-[state=active]:bg-cyan-950/20 data-[state=active]:text-cyan-400
                data-[state=active]:border-b-2 data-[state=active]:border-cyan-400
                text-gray-400 px-6 py-3 rounded-none
              "
            >
              Overview
            </TabsTrigger>
            <TabsTrigger
              value="timeline"
              className="
                uppercase tracking-widest font-[family-name:var(--font-jetbrains)] text-xs
                data-[state=active]:bg-cyan-950/20 data-[state=active]:text-cyan-400
                data-[state=active]:border-b-2 data-[state=active]:border-cyan-400
                text-gray-400 px-6 py-3 rounded-none
              "
            >
              Timeline
            </TabsTrigger>
            <TabsTrigger
              value="metricas"
              className="
                uppercase tracking-widest font-[family-name:var(--font-jetbrains)] text-xs
                data-[state=active]:bg-cyan-950/20 data-[state=active]:text-cyan-400
                data-[state=active]:border-b-2 data-[state=active]:border-cyan-400
                text-gray-400 px-6 py-3 rounded-none
              "
            >
              Metrics
            </TabsTrigger>
            <TabsTrigger
              value="agents"
              className="
                uppercase tracking-widest font-[family-name:var(--font-jetbrains)] text-xs
                data-[state=active]:bg-cyan-950/20 data-[state=active]:text-cyan-400
                data-[state=active]:border-b-2 data-[state=active]:border-cyan-400
                text-gray-400 px-6 py-3 rounded-none
              "
            >
              Agents
            </TabsTrigger>
          </TabsList>

          <div className="p-6">
            <TabsContent value="resumen" className="mt-0 space-y-6">
              <ProgressNarrative project={project} quality={latestQuality} />
              <NextActionsCard actions={nextActions} projectId={project.id} />
              <ProjectMetrics project={project} quality={latestQuality} />
            </TabsContent>

            <TabsContent value="timeline" className="mt-0">
              <ProjectTimeline project={project} />
            </TabsContent>

            <TabsContent value="metricas" className="mt-0">
              <ProjectMetrics project={project} quality={latestQuality} />
            </TabsContent>

            <TabsContent value="agents" className="mt-0">
              <ProjectAgentsSection project={project} quality={latestQuality} />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </main>
  );
}
