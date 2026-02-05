import type { Project, QualityEntry, NextAction } from "./schemas";

/**
 * Workflow Engine - Intelligent project recommendations and health scoring
 *
 * Analyzes project state and generates actionable next steps
 */

/**
 * Compute project health score (0-100)
 * @param project - Project to analyze
 * @param quality - Optional quality metrics
 * @returns Health score 0-100
 */
export function computeHealthScore(project: Project, quality?: QualityEntry): number {
  let score = 100;

  // Calculate days until deadline
  const now = new Date();
  const deadline = new Date(project.deadline);
  const daysUntilDeadline = Math.floor((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  // 1. Deadline risk penalty (up to -20 pts)
  if (project.status === "active") {
    if (daysUntilDeadline < 0) {
      // Overdue
      score -= 20;
    } else if (daysUntilDeadline < 7 && project.progress < 90) {
      // Critical: less than 7 days and not nearly done
      score -= 20;
    } else if (daysUntilDeadline < 14 && project.progress < 75) {
      // Warning: less than 2 weeks and not 75% done
      score -= 10;
    }
  }

  // 2. Low test coverage penalty (up to -15 pts)
  if (quality) {
    const avgCoverage = (quality.testCoverage.frontend + quality.testCoverage.backend) / 2;
    if (avgCoverage < 50) {
      score -= 15;
    } else if (avgCoverage < 70) {
      score -= 10;
    } else if (avgCoverage < 80) {
      score -= 5;
    }
  }

  // 3. Low Lighthouse score penalty (up to -10 pts)
  if (quality) {
    if (quality.lighthouseScore < 70) {
      score -= 10;
    } else if (quality.lighthouseScore < 85) {
      score -= 5;
    }
  }

  // 4. Stalled project penalty (-20 pts for >14 days inactive)
  if (project.lastActivity && project.status === "active") {
    const lastActivity = new Date(project.lastActivity);
    const daysSinceActivity = Math.floor((now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24));

    if (daysSinceActivity > 14) {
      score -= 20;
    } else if (daysSinceActivity > 7) {
      score -= 10;
    }
  }

  // 5. Task tracking mismatch penalty (-20 pts)
  const tasksRemaining = project.tasksTotal - project.tasksDone;
  const progressExpected = project.tasksTotal > 0
    ? (project.tasksDone / project.tasksTotal) * 100
    : 0;
  const progressDelta = Math.abs(project.progress - progressExpected);

  if (progressDelta > 20) {
    // Progress and tasks are very misaligned
    score -= 20;
  } else if (progressDelta > 10) {
    score -= 10;
  }

  // 6. High velocity bonus (+10 pts)
  if (project.velocity && project.velocity > 10) {
    score += 10;
  }

  // Clamp to 0-100
  return Math.max(0, Math.min(100, score));
}

/**
 * Generate next actions for a project
 * @param project - Project to analyze
 * @param quality - Optional quality metrics
 * @returns Array of recommended next actions, sorted by priority
 */
export function generateNextActions(project: Project, quality?: QualityEntry): NextAction[] {
  const actions: NextAction[] = [];
  const now = new Date();
  const deadline = new Date(project.deadline);
  const daysUntilDeadline = Math.floor((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  const tasksRemaining = project.tasksTotal - project.tasksDone;

  // 1. Critical deadline approaching
  if (project.status === "active" && daysUntilDeadline < 7 && project.progress < 90) {
    actions.push({
      id: "deadline-critical",
      priority: "critical",
      category: "development",
      title: `Deadline crítico - ${daysUntilDeadline} días restantes`,
      description: `El proyecto tiene ${daysUntilDeadline} días hasta el deadline con ${100 - project.progress}% pendiente. Prioriza tareas críticas para entregar a tiempo.`,
      estimatedDays: Math.ceil(tasksRemaining / (project.velocity || 2)),
    });
  }

  // 2. Frontend test coverage low
  if (quality && quality.testCoverage.frontend < 70) {
    actions.push({
      id: "frontend-coverage",
      priority: quality.testCoverage.frontend < 50 ? "high" : "medium",
      category: "testing",
      title: "Mejorar cobertura de tests frontend",
      description: `Coverage actual: ${quality.testCoverage.frontend}%. Meta: 70%+. Agrega tests unitarios y de integración para componentes críticos.`,
      agentSuggestion: "test-engineer",
    });
  }

  // 3. Backend test coverage low
  if (quality && quality.testCoverage.backend < 70) {
    actions.push({
      id: "backend-coverage",
      priority: quality.testCoverage.backend < 50 ? "high" : "medium",
      category: "testing",
      title: "Mejorar cobertura de tests backend",
      description: `Coverage actual: ${quality.testCoverage.backend}%. Meta: 70%+. Enfócate en endpoints críticos y lógica de negocio.`,
      agentSuggestion: "test-engineer",
    });
  }

  // 4. Lighthouse score low
  if (quality && quality.lighthouseScore < 90) {
    actions.push({
      id: "lighthouse-optimization",
      priority: quality.lighthouseScore < 70 ? "high" : "medium",
      category: "quality",
      title: "Optimizar Lighthouse score",
      description: `Score actual: ${quality.lighthouseScore}. Meta: 90+. Revisa performance, accessibility, y best practices.`,
    });
  }

  // 5. Open issues accumulating
  if (quality && quality.openIssues > 5) {
    actions.push({
      id: "reduce-issues",
      priority: quality.openIssues > 10 ? "high" : "medium",
      category: "quality",
      title: "Reducir issues abiertos",
      description: `${quality.openIssues} issues abiertos. Prioriza bugs críticos y tech debt que bloquea desarrollo.`,
    });
  }

  // 6. Tasks pending
  if (tasksRemaining > 0 && project.status === "active") {
    const estimatedDays = project.velocity ? Math.ceil(tasksRemaining / project.velocity) : undefined;

    actions.push({
      id: "complete-tasks",
      priority: tasksRemaining > 5 ? "high" : "medium",
      category: "development",
      title: `Completar ${tasksRemaining} tareas pendientes`,
      description: `Quedan ${tasksRemaining} de ${project.tasksTotal} tareas. ${project.progress}% de progreso general.`,
      estimatedDays,
    });
  }

  // 7. Project stalled
  if (project.lastActivity && project.status === "active") {
    const lastActivity = new Date(project.lastActivity);
    const daysSinceActivity = Math.floor((now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24));

    if (daysSinceActivity > 7) {
      actions.push({
        id: "resume-development",
        priority: daysSinceActivity > 14 ? "high" : "medium",
        category: "development",
        title: "Reactivar desarrollo",
        description: `Sin actividad por ${daysSinceActivity} días. Retoma el trabajo o considera cambiar status a "pausado".`,
      });
    }
  }

  // 8. Ready for deployment
  if (
    project.progress >= 95 &&
    quality &&
    quality.testCoverage.frontend >= 70 &&
    quality.testCoverage.backend >= 70 &&
    quality.lighthouseScore >= 85 &&
    quality.openIssues === 0
  ) {
    actions.push({
      id: "deploy",
      priority: "high",
      category: "deployment",
      title: "Proyecto listo para deployment",
      description:
        "Todas las métricas de calidad están en meta. Considera hacer deploy a producción o marcar como completado.",
    });
  }

  // Sort by priority (critical > high > medium > low)
  const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  actions.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  // Return top 5 actions
  return actions.slice(0, 5);
}

/**
 * Generate progress narrative for a project
 * @param project - Project to analyze
 * @param quality - Optional quality metrics
 * @returns Human-readable narrative string
 */
export function generateProgressNarrative(project: Project, quality?: QualityEntry): string {
  const now = new Date();
  const startDate = new Date(project.startDate);
  const deadline = new Date(project.deadline);

  const daysActive = Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  const daysUntilDeadline = Math.floor((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  const tasksRemaining = project.tasksTotal - project.tasksDone;

  let narrative = `${project.name} lleva ${daysActive} días ${project.status === "active" ? "activo" : project.status} y está ${project.progress}% completo. `;

  narrative += `Has completado ${project.tasksDone} de ${project.tasksTotal} tareas. `;

  if (project.status === "active") {
    if (daysUntilDeadline < 0) {
      narrative += `⚠️ El deadline venció hace ${Math.abs(daysUntilDeadline)} días. `;
    } else if (daysUntilDeadline < 7) {
      narrative += `⚠️ Quedan solo ${daysUntilDeadline} días para el deadline. `;
    } else {
      const deadlineDate = deadline.toLocaleDateString("es-CL");
      narrative += `El proyecto está en camino para terminar ${deadlineDate} (${daysUntilDeadline} días restantes). `;
    }
  }

  if (quality) {
    const avgCoverage = Math.round((quality.testCoverage.frontend + quality.testCoverage.backend) / 2);

    if (avgCoverage < 70) {
      narrative += `Sin embargo, la cobertura de tests está en ${avgCoverage}% - considera agregar tests antes del deployment. `;
    }

    if (quality.lighthouseScore < 85) {
      narrative += `El Lighthouse score es ${quality.lighthouseScore}, hay margen de mejora en performance. `;
    }

    if (quality.openIssues > 5) {
      narrative += `Hay ${quality.openIssues} issues abiertos que requieren atención. `;
    }
  }

  if (project.velocity && project.velocity > 0 && tasksRemaining > 0) {
    const weeksToComplete = Math.ceil(tasksRemaining / project.velocity);
    narrative += `A tu velocidad actual (${project.velocity.toFixed(1)} tasks/semana), te tomaría ${weeksToComplete} semanas completar las tareas restantes.`;
  }

  return narrative.trim();
}
