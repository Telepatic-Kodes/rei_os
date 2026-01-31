import { SyncStatus } from "@/components/sync-status";
import { SyncButton } from "@/components/sync-button";

/**
 * Dashboard header with sync status and manual refresh button.
 * Displayed at the top of the main content area.
 */
export function DashboardHeader() {
  return (
    <div className="flex items-center justify-between border-b pb-4 mb-6">
      <div>{/* Reserved for page title or breadcrumbs */}</div>
      <div className="flex items-center gap-3">
        <SyncStatus />
        <SyncButton />
      </div>
    </div>
  );
}
