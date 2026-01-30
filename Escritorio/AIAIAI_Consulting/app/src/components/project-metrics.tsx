import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { Project, QualityEntry } from "@/lib/data";

interface ProjectMetricsProps {
  project: Project;
  quality?: QualityEntry;
}

export function ProjectMetrics({ project, quality }: ProjectMetricsProps) {
  const taskPercent = project.tasksTotal > 0
    ? Math.round((project.tasksDone / project.tasksTotal) * 100)
    : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Tareas</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">{project.tasksDone}/{project.tasksTotal}</p>
          <Progress value={taskPercent} className="h-1.5 mt-2" />
        </CardContent>
      </Card>

      {quality && (
        <>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Lighthouse</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{quality.lighthouseScore}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Test Coverage</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Frontend: </span>
                  <span className="font-medium">{quality.testCoverage.frontend}%</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Backend: </span>
                  <span className="font-medium">{quality.testCoverage.backend}%</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Issues & Deuda</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Issues: </span>
                  <span className="font-medium">{quality.openIssues}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Deuda: </span>
                  <span className="font-medium">{quality.techDebt}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
