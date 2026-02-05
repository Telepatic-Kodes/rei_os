"use client";

import { useState } from "react";
import { toast } from "sonner";
import { BrutalistPanel } from "./ui/brutalist-panel";
import { BrutalistButton } from "./ui/brutalist-button";
import { type Playbook, executePlaybook } from "@/lib/playbooks";

interface PlaybookLauncherProps {
  playbooks: Playbook[];
  projectId: string;
}

export function PlaybookLauncher({ playbooks, projectId }: PlaybookLauncherProps) {
  const [executingPlaybook, setExecutingPlaybook] = useState<string | null>(null);

  const launchPlaybook = async (playbook: Playbook) => {
    setExecutingPlaybook(playbook.id);

    try {
      const { executionId, steps } = await executePlaybook(playbook.id, projectId);

      toast.success(`Playbook started: ${playbook.name}`, {
        description: `Running ${steps} agents • Execution ID: ${executionId}`
      });
    } catch (error) {
      toast.error(`Failed to start playbook`, {
        description: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setExecutingPlaybook(null);
    }
  };

  if (playbooks.length === 0) {
    return (
      <BrutalistPanel title="Playbooks" borderColor="yellow">
        <div className="text-center py-8 text-gray-500 uppercase tracking-wider text-xs">
          No playbooks available for this project
        </div>
      </BrutalistPanel>
    );
  }

  return (
    <BrutalistPanel title="Automated Playbooks" borderColor="yellow">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        {playbooks.map((playbook) => {
          const isExecuting = executingPlaybook === playbook.id;
          const borderColorMap = {
            cyan: 'border-cyan-400',
            green: 'border-green-400',
            yellow: 'border-yellow-400',
            purple: 'border-purple-400',
            red: 'border-red-400',
          };

          const textColorMap = {
            cyan: 'text-cyan-400',
            green: 'text-green-400',
            yellow: 'text-yellow-400',
            purple: 'text-purple-400',
            red: 'text-red-400',
          };

          const borderClass = borderColorMap[playbook.borderColor || 'yellow'];
          const textClass = textColorMap[playbook.borderColor || 'yellow'];

          return (
            <div
              key={playbook.id}
              className={`border-2 ${borderClass} bg-black p-4 relative hover:bg-zinc-950 transition-colors`}
            >
              {/* Icon and Title */}
              <div className="flex items-start gap-3 mb-3">
                <div className="text-2xl">{playbook.icon}</div>
                <div className="flex-1">
                  <h4 className={`text-sm font-bold ${textClass} uppercase tracking-wide font-[family-name:var(--font-space)]`}>
                    {playbook.name}
                  </h4>
                  {playbook.estimatedTime && (
                    <div className="text-xs text-gray-500 font-mono mt-1">
                      ⏱ {playbook.estimatedTime}
                    </div>
                  )}
                </div>
              </div>

              {/* Description */}
              <p className="text-xs text-gray-400 mb-3 font-[family-name:var(--font-jetbrains)]">
                {playbook.description}
              </p>

              {/* Steps count */}
              <div className="text-xs text-gray-400 mb-3 uppercase tracking-wide">
                {playbook.steps.length} agents in sequence
              </div>

              {/* Launch Button */}
              <BrutalistButton
                variant="secondary"
                size="sm"
                onClick={() => launchPlaybook(playbook)}
                disabled={isExecuting || executingPlaybook !== null}
                fullWidth
              >
                {isExecuting ? '⏳ Starting...' : `▶ Run Playbook`}
              </BrutalistButton>
            </div>
          );
        })}
      </div>

      {/* Info Footer */}
      <div className="mt-6 p-3 bg-zinc-950 border-l-2 border-yellow-400">
        <div className="text-xs text-gray-400 uppercase tracking-wide font-[family-name:var(--font-jetbrains)]">
          ℹ Playbooks run multiple agents in sequence. Monitor progress in the Command Center.
        </div>
      </div>
    </BrutalistPanel>
  );
}
