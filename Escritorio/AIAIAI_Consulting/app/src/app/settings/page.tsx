"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

interface AlertConfig {
  globalBudget: number;
  globalThresholds: { percent: number; label?: string }[];
  perProjectLimits: Record<string, number>;
}

export default function SettingsPage() {
  const [config, setConfig] = useState<AlertConfig | null>(null);
  const [saving, setSaving] = useState(false);
  const [notifPermission, setNotifPermission] = useState<string>("default");

  useEffect(() => {
    fetch("/api/settings/alerts")
      .then((res) => res.json())
      .then((data: AlertConfig) => setConfig(data))
      .catch(() => toast.error("Failed to load alert config"));
    if (typeof Notification !== "undefined") {
      setNotifPermission(Notification.permission);
    }
  }, []);

  async function handleSave() {
    if (!config) return;
    setSaving(true);
    try {
      const res = await fetch("/api/settings/alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Save failed");
      }
      toast.success("Alert settings saved");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  function addThreshold() {
    if (!config) return;
    setConfig({
      ...config,
      globalThresholds: [...config.globalThresholds, { percent: 50 }],
    });
  }

  function removeThreshold(index: number) {
    if (!config) return;
    setConfig({
      ...config,
      globalThresholds: config.globalThresholds.filter((_, i) => i !== index),
    });
  }

  function updateThreshold(index: number, percent: number, label: string) {
    if (!config) return;
    const thresholds = [...config.globalThresholds];
    thresholds[index] = { percent, label: label || undefined };
    setConfig({ ...config, globalThresholds: thresholds });
  }

  function addProjectLimit() {
    if (!config) return;
    setConfig({
      ...config,
      perProjectLimits: { ...config.perProjectLimits, "": 50 },
    });
  }

  function removeProjectLimit(name: string) {
    if (!config) return;
    const limits = { ...config.perProjectLimits };
    delete limits[name];
    setConfig({ ...config, perProjectLimits: limits });
  }

  function updateProjectLimit(oldName: string, newName: string, limit: number) {
    if (!config) return;
    const limits = { ...config.perProjectLimits };
    if (oldName !== newName) delete limits[oldName];
    limits[newName] = limit;
    setConfig({ ...config, perProjectLimits: limits });
  }

  async function requestNotifPermission() {
    if (typeof Notification === "undefined") return;
    const result = await Notification.requestPermission();
    setNotifPermission(result);
  }

  if (!config) {
    return (
      <div className="max-w-2xl mx-auto py-8">
        <p className="text-muted-foreground">Loading settings...</p>
      </div>
    );
  }

  const projectEntries = Object.entries(config.perProjectLimits);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Settings</h1>

      <Card className="p-6 space-y-4">
        <h2 className="text-lg font-semibold">Global Budget</h2>
        <div className="flex items-center gap-2">
          <label className="text-sm text-muted-foreground">Monthly budget ($)</label>
          <input
            type="number"
            min={1}
            value={config.globalBudget}
            onChange={(e) =>
              setConfig({ ...config, globalBudget: Number(e.target.value) })
            }
            className="flex h-9 w-32 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
        </div>

        <Separator />

        <h2 className="text-lg font-semibold">Alert Thresholds</h2>
        <div className="space-y-2">
          {config.globalThresholds.map((t, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                type="number"
                min={0}
                max={100}
                value={t.percent}
                onChange={(e) =>
                  updateThreshold(i, Number(e.target.value), t.label ?? "")
                }
                className="flex h-9 w-20 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
              <span className="text-sm text-muted-foreground">%</span>
              <input
                type="text"
                placeholder="Label"
                value={t.label ?? ""}
                onChange={(e) =>
                  updateThreshold(i, t.percent, e.target.value)
                }
                className="flex h-9 w-32 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
              <button
                onClick={() => removeThreshold(i)}
                className="text-sm text-destructive hover:underline"
              >
                Remove
              </button>
            </div>
          ))}
          <button
            onClick={addThreshold}
            className="text-sm text-primary hover:underline"
          >
            + Add threshold
          </button>
        </div>

        <Separator />

        <h2 className="text-lg font-semibold">Per-Project Limits</h2>
        <div className="space-y-2">
          {projectEntries.map(([name, limit]) => (
            <div key={name} className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Project name"
                value={name}
                onChange={(e) => updateProjectLimit(name, e.target.value, limit)}
                className="flex h-9 w-40 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
              <span className="text-sm text-muted-foreground">$</span>
              <input
                type="number"
                min={0}
                value={limit}
                onChange={(e) =>
                  updateProjectLimit(name, name, Number(e.target.value))
                }
                className="flex h-9 w-24 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
              <button
                onClick={() => removeProjectLimit(name)}
                className="text-sm text-destructive hover:underline"
              >
                Remove
              </button>
            </div>
          ))}
          <button
            onClick={addProjectLimit}
            className="text-sm text-primary hover:underline"
          >
            + Add project limit
          </button>
        </div>

        <Separator />

        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center justify-center rounded-md text-sm font-medium h-9 px-4 py-2 bg-primary text-primary-foreground shadow hover:bg-primary/90 disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Settings"}
        </button>
      </Card>

      <Card className="p-6 space-y-4">
        <h2 className="text-lg font-semibold">Browser Notifications</h2>
        <p className="text-sm text-muted-foreground">
          Permission status:{" "}
          <span className="font-medium">
            {notifPermission === "granted"
              ? "Enabled"
              : notifPermission === "denied"
                ? "Blocked"
                : "Not requested"}
          </span>
        </p>
        {notifPermission === "denied" ? (
          <p className="text-sm text-muted-foreground">
            Notifications are blocked. Please enable them in your browser settings.
          </p>
        ) : notifPermission !== "granted" ? (
          <button
            onClick={requestNotifPermission}
            className="inline-flex items-center justify-center rounded-md text-sm font-medium h-9 px-4 py-2 bg-primary text-primary-foreground shadow hover:bg-primary/90"
          >
            Enable Browser Notifications
          </button>
        ) : null}
      </Card>
    </div>
  );
}
