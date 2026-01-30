import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getProjectById, getQualityByProject } from "@/lib/data";
import { ProjectDetailHeader } from "@/components/project-detail-header";
import { ProjectTimeline } from "@/components/project-timeline";
import { ProjectMetrics } from "@/components/project-metrics";

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

  return (
    <div className="space-y-6">
      <Link
        href="/projects"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver a proyectos
      </Link>

      <ProjectDetailHeader project={project} />

      <Tabs defaultValue="resumen" className="w-full">
        <TabsList>
          <TabsTrigger value="resumen">Resumen</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="metricas">Metricas</TabsTrigger>
        </TabsList>
        <TabsContent value="resumen" className="mt-4">
          <ProjectMetrics project={project} quality={latestQuality} />
        </TabsContent>
        <TabsContent value="timeline" className="mt-4">
          <ProjectTimeline project={project} />
        </TabsContent>
        <TabsContent value="metricas" className="mt-4">
          <ProjectMetrics project={project} quality={latestQuality} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
