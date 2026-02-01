/**
 * Breadcrumb generation logic
 *
 * Converts pathname + context into human-readable breadcrumbs
 */

export interface BreadcrumbItem {
  label: string;
  href?: string; // undefined for current page
}

/**
 * Generate breadcrumbs from pathname
 * @param pathname - Current route pathname
 * @param projectName - Optional project name for project-specific pages
 * @returns Array of breadcrumb items
 */
export function generateBreadcrumbs(pathname: string, projectName?: string): BreadcrumbItem[] {
  const breadcrumbs: BreadcrumbItem[] = [{ label: "Dashboard", href: "/" }];

  // Root dashboard
  if (pathname === "/") {
    return breadcrumbs;
  }

  // Parse path segments
  const segments = pathname.split("/").filter(Boolean);

  // Map route segments to labels
  const routeLabels: Record<string, string> = {
    projects: "Proyectos",
    command: "Command Center",
    tokens: "Tokens",
    analytics: "Analytics",
    quality: "Calidad",
    kanban: "Kanban",
    settings: "Settings",
  };

  segments.forEach((segment, index) => {
    const isLast = index === segments.length - 1;
    const label = routeLabels[segment] || projectName || segment;

    const href = isLast ? undefined : `/${segments.slice(0, index + 1).join("/")}`;

    breadcrumbs.push({ label, href });
  });

  return breadcrumbs;
}
