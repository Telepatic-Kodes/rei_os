import type { Project, TokenEntry, QualityEntry } from "./schemas";

/**
 * Data filtering utilities for project-scoped views
 *
 * All functions handle the special case projectId === "all"
 * by returning the original data unfiltered
 */

/**
 * Filter projects by ID
 * @param projects - All projects
 * @param projectId - Target project ID or "all"
 * @returns Filtered projects array
 */
export function filterProjects(projects: Project[], projectId: string): Project[] {
  if (projectId === "all") {
    return projects;
  }

  return projects.filter((p) => p.id === projectId);
}

/**
 * Filter token entries by project
 * @param entries - All token entries
 * @param projectId - Target project ID or "all"
 * @returns Filtered token entries
 */
export function filterTokenEntries(entries: TokenEntry[], projectId: string): TokenEntry[] {
  if (projectId === "all") {
    return entries;
  }

  return entries.filter((e) => e.project === projectId);
}

/**
 * Filter quality entries by project
 * @param entries - All quality entries
 * @param projectId - Target project ID or "all"
 * @returns Filtered quality entries
 */
export function filterQualityEntries(entries: QualityEntry[], projectId: string): QualityEntry[] {
  if (projectId === "all") {
    return entries;
  }

  return entries.filter((e) => e.project === projectId);
}

/**
 * Calculate aggregate stats for filtered projects
 * @param projects - Filtered projects
 * @returns Aggregated statistics
 */
export function calculateProjectStats(projects: Project[]) {
  const total = projects.length;
  const active = projects.filter((p) => p.status === "active").length;
  const completed = projects.filter((p) => p.status === "completed").length;
  const paused = projects.filter((p) => p.status === "paused").length;

  const totalTasks = projects.reduce((sum, p) => sum + p.tasksTotal, 0);
  const completedTasks = projects.reduce((sum, p) => sum + p.tasksDone, 0);

  return {
    total,
    active,
    completed,
    paused,
    totalTasks,
    completedTasks,
    avgProgress: total > 0 ? projects.reduce((sum, p) => sum + p.progress, 0) / total : 0,
  };
}

/**
 * Calculate token totals for filtered entries
 * @param entries - Filtered token entries
 * @returns Token aggregates
 */
export function calculateTokenTotals(entries: TokenEntry[]) {
  const totalTokensIn = entries.reduce((sum, e) => sum + e.tokensIn, 0);
  const totalTokensOut = entries.reduce((sum, e) => sum + e.tokensOut, 0);
  const totalCost = entries.reduce((sum, e) => sum + e.cost, 0);

  return {
    totalTokensIn,
    totalTokensOut,
    totalCost,
  };
}

/**
 * Get latest quality entry for a project
 * @param entries - All quality entries
 * @param projectId - Target project ID
 * @returns Latest quality entry or undefined
 */
export function getLatestQuality(
  entries: QualityEntry[],
  projectId: string
): QualityEntry | undefined {
  const projectEntries = entries.filter((e) => e.project === projectId);

  if (projectEntries.length === 0) {
    return undefined;
  }

  // Sort by date descending and return first
  return projectEntries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
}
