import { readFileSync, existsSync } from "fs";
import { join } from "path";
import { Badge } from "@/components/ui/badge";
import { SyncStatusSchema } from "@/lib/schemas";

/**
 * Server component that displays the last sync status.
 * Reads data/sync-status.json and shows badge + time ago.
 */
export function SyncStatus() {
  const statusPath = join(process.cwd(), "..", "data", "sync-status.json");

  // Handle file not existing (never synced)
  if (!existsSync(statusPath)) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Badge variant="outline">Never synced</Badge>
      </div>
    );
  }

  try {
    const rawData = readFileSync(statusPath, "utf-8");
    const data = SyncStatusSchema.parse(JSON.parse(rawData));

    const lastSyncDate = new Date(data.lastSync);
    const timeAgo = formatTimeAgo(lastSyncDate);
    const variant = data.status === "success" ? "default" : "destructive";

    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Badge variant={variant}>
          {data.status === "success" ? "Synced" : "Error"}
        </Badge>
        <span>{timeAgo}</span>
      </div>
    );
  } catch (error) {
    // If file is corrupted or invalid, show error state
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Badge variant="destructive">Invalid</Badge>
      </div>
    );
  }
}

/**
 * Format a date as "Xm ago", "Xh ago", etc.
 */
function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);

  if (diffSec < 60) {
    return `${diffSec}s ago`;
  }

  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) {
    return `${diffMin}m ago`;
  }

  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) {
    return `${diffHour}h ago`;
  }

  const diffDay = Math.floor(diffHour / 24);
  return `${diffDay}d ago`;
}
