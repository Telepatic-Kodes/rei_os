import { SyncStatus } from "@/components/sync-status";
import { SyncButton } from "@/components/sync-button";
import { Breadcrumb } from "@/components/breadcrumb";
import { ProjectSelector } from "@/components/project-selector";

/**
 * Dashboard header with breadcrumbs, project selector, sync status and manual refresh button.
 * Brutalist design with cyan border and structured layout.
 */
export function DashboardHeader() {
  return (
    <div className="border-b-2 border-cyan-400 pb-4 mb-6 bg-zinc-950 p-4 -m-8 mb-6">
      <div className="flex items-center justify-between">
        <Breadcrumb />
        <div className="flex items-center gap-4">
          <ProjectSelector />
          <div className="h-8 w-px bg-gray-700" />
          <SyncStatus />
          <SyncButton />
        </div>
      </div>
    </div>
  );
}
