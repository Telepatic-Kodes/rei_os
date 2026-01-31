"use client";

import { useEffect, useRef, useState } from "react";
import { AlertTriangle, X } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface AlertItem {
  type: "global" | "project";
  level: "warning" | "critical";
  message: string;
  alertKey: string;
  projectName?: string;
}

const STORAGE_KEY = "dismissed-alerts";
const POLL_INTERVAL_MS = 60_000;

function getDismissed(): string[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
  } catch {
    return [];
  }
}

function fireBrowserNotification(alert: AlertItem): void {
  if (typeof Notification === "undefined") return;
  if (Notification.permission !== "granted") return;
  if (document.hidden) return;

  try {
    new Notification(
      alert.level === "critical"
        ? "Critical Budget Alert"
        : "Budget Warning",
      {
        body: alert.message,
        icon: "/favicon.ico",
        tag: alert.alertKey,
      }
    );
  } catch {
    // Browser notification best-effort
  }
}

export function AlertBanner() {
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [dismissed, setDismissed] = useState<string[]>([]);
  const notifiedKeysRef = useRef<Set<string>>(new Set());

  function fetchAlerts() {
    fetch("/api/alert-status")
      .then((res) => res.json())
      .then((data: { alerts: AlertItem[] }) => {
        setAlerts(data.alerts);

        // Fire browser notifications for new alerts
        for (const alert of data.alerts) {
          if (!notifiedKeysRef.current.has(alert.alertKey)) {
            notifiedKeysRef.current.add(alert.alertKey);
            fireBrowserNotification(alert);
          }
        }
      })
      .catch(() => {});
  }

  useEffect(() => {
    setDismissed(getDismissed());
    fetchAlerts();

    const interval = setInterval(fetchAlerts, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, []);

  function dismiss(key: string) {
    const next = [...dismissed, key];
    setDismissed(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }

  const visible = alerts.filter((a) => !dismissed.includes(a.alertKey));
  if (visible.length === 0) return null;

  return (
    <div className="flex flex-col gap-2 mb-4">
      {visible.map((alert) => (
        <Alert
          key={alert.alertKey}
          variant={alert.level === "critical" ? "destructive" : "default"}
          className="relative pr-10"
        >
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>
            {alert.level === "critical"
              ? "Critical Budget Alert"
              : "Budget Warning"}
          </AlertTitle>
          <AlertDescription>{alert.message}</AlertDescription>
          <button
            onClick={() => dismiss(alert.alertKey)}
            className="absolute top-3 right-3 p-1 rounded-sm opacity-70 hover:opacity-100 transition-opacity"
            aria-label="Dismiss alert"
          >
            <X className="h-4 w-4" />
          </button>
        </Alert>
      ))}
    </div>
  );
}
