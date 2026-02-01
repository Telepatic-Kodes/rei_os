"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { BrutalistPanel } from "@/components/ui/brutalist-panel";
import { BrutalistButton } from "@/components/ui/brutalist-button";
import { validateForm, budgetSchema } from "@/lib/form-validation";

interface AlertConfig {
  globalBudget: number;
  globalThresholds: { percent: number; label?: string }[];
  perProjectLimits: Record<string, number>;
}

export default function SettingsPage() {
  const [config, setConfig] = useState<AlertConfig | null>(null);
  const [saving, setSaving] = useState(false);
  const [notifPermission, setNotifPermission] = useState<string>("default");
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  useEffect(() => {
    fetch("/api/settings/alerts")
      .then((res) => res.json())
      .then((data: AlertConfig) => setConfig(data))
      .catch(() => toast.error("Failed to load alert config"));
    if (typeof Notification !== "undefined") {
      setNotifPermission(Notification.permission);
    }
  }, []);

  // Warn before leaving with unsaved changes
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        return "";
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [hasUnsavedChanges]);

  async function handleSave() {
    if (!config) return;

    // Validate before saving
    const validation = validateForm(budgetSchema, config);
    if (!validation.success) {
      setValidationErrors(validation.errors);
      toast.error("Validation failed", {
        description: "Please fix errors before saving",
      });
      return;
    }

    setValidationErrors([]);
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
      setHasUnsavedChanges(false);
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
    setHasUnsavedChanges(true);
  }

  function removeThreshold(index: number) {
    if (!config) return;
    setConfig({
      ...config,
      globalThresholds: config.globalThresholds.filter((_, i) => i !== index),
    });
    setHasUnsavedChanges(true);
  }

  function updateThreshold(index: number, percent: number, label: string) {
    if (!config) return;
    const thresholds = [...config.globalThresholds];
    thresholds[index] = { percent, label: label || undefined };
    setConfig({ ...config, globalThresholds: thresholds });
    setHasUnsavedChanges(true);
  }

  function addProjectLimit() {
    if (!config) return;
    setConfig({
      ...config,
      perProjectLimits: { ...config.perProjectLimits, "": 50 },
    });
    setHasUnsavedChanges(true);
  }

  function removeProjectLimit(name: string) {
    if (!config) return;
    const limits = { ...config.perProjectLimits };
    delete limits[name];
    setConfig({ ...config, perProjectLimits: limits });
    setHasUnsavedChanges(true);
  }

  function updateProjectLimit(oldName: string, newName: string, limit: number) {
    if (!config) return;
    const limits = { ...config.perProjectLimits };
    if (oldName !== newName) delete limits[oldName];
    limits[newName] = limit;
    setConfig({ ...config, perProjectLimits: limits });
    setHasUnsavedChanges(true);
  }

  async function requestNotifPermission() {
    if (typeof Notification === "undefined") return;
    const result = await Notification.requestPermission();
    setNotifPermission(result);
  }

  if (!config) {
    return (
      <main className="max-w-[1400px] mx-auto space-y-6">
        <div className="text-center py-12 text-gray-500 uppercase tracking-wider text-sm">
          Loading settings...
        </div>
      </main>
    );
  }

  const projectEntries = Object.entries(config.perProjectLimits);

  return (
    <main className="max-w-[1400px] mx-auto space-y-6">
      {/* Page Title */}
      <h1 className="text-3xl font-bold text-purple-400 tracking-wider font-[family-name:var(--font-space)] uppercase">
        ▐ SETTINGS ▌
      </h1>

      {/* Global Budget */}
      <BrutalistPanel title="Global Budget Configuration" borderColor="green">
        <div className="space-y-4 mt-4">
          <div className="flex items-center gap-4">
            <label className="text-sm text-gray-400 uppercase tracking-wide font-[family-name:var(--font-jetbrains)] w-48">
              Monthly Budget ($):
            </label>
            <input
              type="number"
              min={1}
              value={config.globalBudget}
              onChange={(e) => {
                setConfig({ ...config, globalBudget: Number(e.target.value) });
                setHasUnsavedChanges(true);
              }}
              className="
                flex h-10 w-32 border-2 border-cyan-400 bg-black px-3 py-2
                text-sm font-mono text-white
                focus:outline-none focus:border-green-400
                transition-colors
              "
            />
          </div>
        </div>
      </BrutalistPanel>

      {/* Alert Thresholds */}
      <BrutalistPanel title="Alert Thresholds" borderColor="yellow">
        <div className="space-y-3 mt-4">
          {config.globalThresholds.map((t, i) => (
            <div key={i} className="flex items-center gap-3 p-3 bg-zinc-950 border-l-2 border-yellow-400">
              <input
                type="number"
                min={0}
                max={100}
                value={t.percent}
                onChange={(e) =>
                  updateThreshold(i, Number(e.target.value), t.label ?? "")
                }
                className="
                  flex h-9 w-20 border-2 border-gray-700 bg-black px-3 py-1
                  text-sm font-mono text-yellow-400
                  focus:outline-none focus:border-yellow-400
                "
              />
              <span className="text-sm text-gray-500 font-mono">%</span>
              <input
                type="text"
                placeholder="LABEL"
                value={t.label ?? ""}
                onChange={(e) =>
                  updateThreshold(i, t.percent, e.target.value)
                }
                className="
                  flex h-9 flex-1 border-2 border-gray-700 bg-black px-3 py-1
                  text-sm font-mono text-white uppercase
                  placeholder:text-gray-600
                  focus:outline-none focus:border-yellow-400
                "
              />
              <BrutalistButton
                variant="danger"
                size="sm"
                onClick={() => removeThreshold(i)}
              >
                Remove
              </BrutalistButton>
            </div>
          ))}
          <BrutalistButton
            variant="secondary"
            size="sm"
            onClick={addThreshold}
          >
            + Add Threshold
          </BrutalistButton>
        </div>
      </BrutalistPanel>

      {/* Per-Project Limits */}
      <BrutalistPanel title="Per-Project Budget Limits" borderColor="purple">
        <div className="space-y-3 mt-4">
          {projectEntries.map(([name, limit]) => (
            <div key={name} className="flex items-center gap-3 p-3 bg-zinc-950 border-l-2 border-purple-400">
              <input
                type="text"
                placeholder="PROJECT NAME"
                value={name}
                onChange={(e) => updateProjectLimit(name, e.target.value, limit)}
                className="
                  flex h-9 w-60 border-2 border-gray-700 bg-black px-3 py-1
                  text-sm font-mono text-white uppercase
                  placeholder:text-gray-600
                  focus:outline-none focus:border-purple-400
                "
              />
              <span className="text-sm text-gray-500 font-mono">$</span>
              <input
                type="number"
                min={0}
                value={limit}
                onChange={(e) =>
                  updateProjectLimit(name, name, Number(e.target.value))
                }
                className="
                  flex h-9 w-32 border-2 border-gray-700 bg-black px-3 py-1
                  text-sm font-mono text-green-400
                  focus:outline-none focus:border-purple-400
                "
              />
              <BrutalistButton
                variant="danger"
                size="sm"
                onClick={() => removeProjectLimit(name)}
              >
                Remove
              </BrutalistButton>
            </div>
          ))}
          <BrutalistButton
            variant="secondary"
            size="sm"
            onClick={addProjectLimit}
          >
            + Add Project Limit
          </BrutalistButton>
        </div>
      </BrutalistPanel>

      {/* Browser Notifications */}
      <BrutalistPanel title="Browser Notifications" borderColor="cyan">
        <div className="mt-4 space-y-4">
          {notifPermission === "granted" ? (
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse" />
              <p className="text-sm text-green-400 font-mono uppercase tracking-wide">
                Notifications Enabled
              </p>
            </div>
          ) : notifPermission === "denied" ? (
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-400 rounded-full" />
              <p className="text-sm text-red-400 font-mono uppercase tracking-wide">
                Notifications Blocked - Enable in Browser Settings
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-gray-600 rounded-full" />
                <p className="text-sm text-gray-400 font-mono uppercase tracking-wide">
                  Permission: Not Requested
                </p>
              </div>
              <BrutalistButton
                variant="primary"
                onClick={requestNotifPermission}
              >
                Enable Notifications
              </BrutalistButton>
            </div>
          )}
        </div>
      </BrutalistPanel>

      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <BrutalistPanel title="Validation Errors" borderColor="red">
          <div className="mt-4 space-y-2">
            {validationErrors.map((error, i) => (
              <div key={i} className="text-sm text-red-400 font-mono flex items-start gap-2">
                <span className="text-red-500">×</span>
                <span>{error}</span>
              </div>
            ))}
          </div>
        </BrutalistPanel>
      )}

      {/* Save Button */}
      <div className="flex justify-end gap-4 items-center">
        {hasUnsavedChanges && (
          <p className="text-sm text-yellow-400 uppercase tracking-wider font-mono">
            ⚠ Unsaved Changes
          </p>
        )}
        <BrutalistButton
          variant="primary"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? "Saving..." : "Save All Settings"}
        </BrutalistButton>
      </div>
    </main>
  );
}
