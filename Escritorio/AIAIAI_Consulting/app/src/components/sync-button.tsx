"use client";

import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

/**
 * Manual sync button with loading state and toast feedback.
 * Triggers POST /api/sync and reloads page on success.
 */
export function SyncButton() {
  const [syncing, setSyncing] = useState(false);

  const handleSync = async () => {
    setSyncing(true);
    toast("Syncing data...");

    try {
      const response = await fetch("/api/sync", {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        toast.error(data.error || "Sync failed");
        return;
      }

      toast.success("Sync complete");
      // Reload page to show fresh data
      window.location.reload();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      toast.error(`Sync failed: ${message}`);
    } finally {
      setSyncing(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleSync}
      disabled={syncing}
    >
      <RefreshCw className={syncing ? "animate-spin" : ""} />
      Refresh
    </Button>
  );
}
