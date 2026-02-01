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
    toast.loading("Syncing tokens, quality, and projects...", { id: "sync" });

    try {
      const response = await fetch("/api/sync", {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        toast.error(data.error || "Sync failed", { id: "sync" });
        setSyncing(false);
        return;
      }

      const duration = data.durationMs ? ` (${(data.durationMs / 1000).toFixed(1)}s)` : "";
      toast.success(`Sync complete${duration}`, { id: "sync" });

      // Delay reload to show success message
      setTimeout(() => window.location.reload(), 800);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      toast.error(`Network error: ${message}`, { id: "sync" });
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
