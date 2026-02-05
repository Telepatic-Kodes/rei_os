"use client";

import { useState } from "react";
import { toast } from "sonner";
import { BrutalistButton } from "./ui/brutalist-button";
import { StatusIndicator } from "./ui/status-indicator";

interface AgentLauncherCardProps {
  agentId: string;
  agentName: string;
  description: string;
  icon: string;
  projectId: string;
  borderColor?: 'cyan' | 'green' | 'yellow' | 'purple' | 'red';
  recommendedFor?: string[];
  estimatedTime?: string;
}

export function AgentLauncherCard({
  agentId,
  agentName,
  description,
  icon,
  projectId,
  borderColor = 'purple',
  recommendedFor,
  estimatedTime
}: AgentLauncherCardProps) {
  const [isLaunching, setIsLaunching] = useState(false);
  const [lastExecution, setLastExecution] = useState<{
    status: 'running' | 'completed' | 'failed';
    timestamp: string;
  } | null>(null);

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

  const borderClass = borderColorMap[borderColor];
  const textClass = textColorMap[borderColor];

  const launchAgent = async () => {
    setIsLaunching(true);

    try {
      const res = await fetch('/api/command/execute-agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId,
          project: projectId,
          context: {
            source: 'project-detail',
            timestamp: new Date().toISOString()
          }
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to launch agent');
      }

      setLastExecution({
        status: 'running',
        timestamp: new Date().toISOString()
      });

      toast.success(`Agent launched: ${agentName}`, {
        description: `Execution ID: ${data.executionId}`
      });
    } catch (error) {
      toast.error(`Failed to launch ${agentName}`, {
        description: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setIsLaunching(false);
    }
  };

  return (
    <div className={`border-2 ${borderClass} bg-zinc-950 p-6 relative hover:bg-zinc-900 transition-colors`}>
      {/* Icon and Name */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`text-3xl ${textClass}`}>{icon}</div>
          <div>
            <h3 className={`text-lg font-bold ${textClass} uppercase tracking-wide font-[family-name:var(--font-space)]`}>
              {agentName}
            </h3>
            {estimatedTime && (
              <div className="text-xs text-gray-500 font-mono mt-1">
                ⏱ {estimatedTime}
              </div>
            )}
          </div>
        </div>

        {/* Last execution status */}
        {lastExecution && (
          <StatusIndicator
            status={lastExecution.status}
            active={lastExecution.status === 'running'}
            color={
              lastExecution.status === 'running' ? 'green' :
              lastExecution.status === 'completed' ? 'cyan' : 'red'
            }
            pulse={lastExecution.status === 'running'}
            size="sm"
          />
        )}
      </div>

      {/* Description */}
      <p className="text-sm text-gray-400 mb-4 font-[family-name:var(--font-jetbrains)]">
        {description}
      </p>

      {/* Recommended for */}
      {recommendedFor && recommendedFor.length > 0 && (
        <div className="mb-4">
          <div className="text-xs text-gray-400 uppercase tracking-wide mb-2">
            Recommended for:
          </div>
          <div className="flex flex-wrap gap-2">
            {recommendedFor.map((tag) => (
              <span
                key={tag}
                className="text-xs px-2 py-1 bg-black border border-gray-700 text-gray-400 uppercase tracking-wider font-mono"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Launch Button */}
      <BrutalistButton
        variant="secondary"
        size="sm"
        onClick={launchAgent}
        disabled={isLaunching}
        fullWidth
      >
        {isLaunching ? '⏳ Launching...' : `🚀 Launch ${agentName}`}
      </BrutalistButton>
    </div>
  );
}
