import type { Project } from "@/lib/data";

function daysBetween(a: string, b: string): number {
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / msPerDay);
}

export function ProjectTimeline({ project }: { project: Project }) {
  const today = new Date().toISOString().split("T")[0];
  const daysActive = daysBetween(project.startDate, today);
  const daysRemaining = daysBetween(today, project.deadline);

  const events = [
    { label: "Inicio", date: project.startDate },
    { label: "Ultimo commit", date: project.lastCommit },
    { label: "Deadline", date: project.deadline },
  ];

  return (
    <div className="space-y-6">
      <div className="flex gap-8 text-sm">
        <div>
          <span className="text-muted-foreground">Dias activos: </span>
          <span className="font-semibold">{daysActive}</span>
        </div>
        <div>
          <span className="text-muted-foreground">Dias restantes: </span>
          <span className={`font-semibold ${daysRemaining < 0 ? "text-red-500" : ""}`}>
            {daysRemaining < 0 ? `${Math.abs(daysRemaining)} atrasado` : daysRemaining}
          </span>
        </div>
      </div>
      <div className="relative pl-6">
        <div className="absolute left-2.5 top-1 bottom-1 w-px bg-border" />
        {events.map((event) => (
          <div key={event.label} className="relative flex items-center gap-3 py-3">
            <div className="absolute left-[-16px] h-2.5 w-2.5 rounded-full bg-primary border-2 border-background" />
            <div>
              <p className="font-medium text-sm">{event.label}</p>
              <p className="text-xs text-muted-foreground">{event.date}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
