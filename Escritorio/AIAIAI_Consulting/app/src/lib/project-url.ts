/**
 * URL synchronization utilities for project selection
 *
 * Handles reading and writing project ID from URL search params
 */

/**
 * Extract project ID from URL search params (server-side)
 * @param searchParams - Next.js searchParams from page props
 * @returns Project ID or "all" as default
 */
export function getProjectFromUrl(
  searchParams: { [key: string]: string | string[] | undefined }
): string {
  const project = searchParams.project;

  if (typeof project === "string" && project.length > 0) {
    return project;
  }

  return "all";
}

/**
 * Build URL with project param preserved
 * @param pathname - Current pathname
 * @param projectId - Project ID to include
 * @returns Full URL with project param
 */
export function buildProjectUrl(pathname: string, projectId: string): string {
  const params = new URLSearchParams();
  params.set("project", projectId);
  return `${pathname}?${params.toString()}`;
}

/**
 * Validate project ID exists in project list
 * @param projectId - ID to validate
 * @param validIds - Array of valid project IDs
 * @returns True if valid or "all", false otherwise
 */
export function isValidProjectId(projectId: string, validIds: string[]): boolean {
  return projectId === "all" || validIds.includes(projectId);
}
