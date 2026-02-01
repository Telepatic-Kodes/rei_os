import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { NextAction } from "@/lib/schemas";

interface NextActionsCardProps {
  actions: NextAction[];
  projectId?: string;
}

const priorityColors = {
  critical: "bg-red-500/20 text-red-400 border-red-500/30",
  high: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  medium: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  low: "bg-blue-500/20 text-blue-400 border-blue-500/30",
};

const categoryIcons = {
  development: "🔧",
  testing: "✅",
  quality: "📊",
  deployment: "🚀",
};

const priorityLabels = {
  critical: "CRÍTICO",
  high: "ALTO",
  medium: "MEDIO",
  low: "BAJO",
};

/**
 * Card displaying recommended next actions for a project
 * Sorted by priority with agent suggestions
 */
export function NextActionsCard({ actions, projectId }: NextActionsCardProps) {
  if (actions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Próximas Acciones Recomendadas</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            ✨ Todo está bajo control. No hay acciones críticas pendientes.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Próximas Acciones Recomendadas</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {actions.map((action) => (
          <div
            key={action.id}
            className="border border-border rounded-md p-4 space-y-2 hover:bg-accent/50 transition-colors"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-2">
                <span className="text-lg">{categoryIcons[action.category]}</span>
                <div>
                  <h3 className="font-semibold text-sm">{action.title}</h3>
                  <p className="text-xs text-muted-foreground mt-1">{action.description}</p>
                </div>
              </div>
              <Badge variant="outline" className={`${priorityColors[action.priority]} shrink-0`}>
                {priorityLabels[action.priority]}
              </Badge>
            </div>

            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              {action.estimatedDays && (
                <span>⏱️ ~{action.estimatedDays} días estimados</span>
              )}
              {action.agentSuggestion && (
                <Link
                  href={`/command?agent=${action.agentSuggestion}${projectId ? `&project=${projectId}` : ""}`}
                  className="text-cyan-400 hover:text-cyan-300 underline"
                >
                  → Ejecutar con {action.agentSuggestion}
                </Link>
              )}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
