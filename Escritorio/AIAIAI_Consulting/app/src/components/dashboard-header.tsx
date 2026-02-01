import { SyncStatus } from "@/components/sync-status";
import { SyncButton } from "@/components/sync-button";
import { Breadcrumb } from "@/components/breadcrumb";
import { ProjectSelector } from "@/components/project-selector";

/**
 * Dashboard header with breadcrumbs, project selector, sync status and manual refresh button.
 * Displayed at the top of the main content area.
 */
export function DashboardHeader() {
  return (
    <div className="flex items-center justify-between border-b pb-4 mb-6">
      <Breadcrumb />
      <div className="flex items-center gap-3">
        <ProjectSelector />
        <div className="h-6 w-px bg-border" />
        <SyncStatus />
        <SyncButton />
      </div>
    </div>
  );
}
