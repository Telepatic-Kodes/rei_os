'use client';

import { useState, useEffect } from 'react';
import type { Execution } from '@/lib/types/command';
import { ExecutionDetails } from './ExecutionDetails';

interface ExecutionMonitorProps {
  executions: Execution[];
}

export function ExecutionMonitor({ executions }: ExecutionMonitorProps) {
  const [selectedExecution, setSelectedExecution] = useState<Execution | null>(null);
  const [projectFilter, setProjectFilter] = useState<string>('all');

  // Extract unique projects
  const projects = Array.from(new Set(executions.map(e => e.project).filter(Boolean))) as string[];

  // Apply filters
  const filteredExecutions = projectFilter === 'all'
    ? executions
    : executions.filter(e => e.project === projectFilter);

  const activeExecutions = filteredExecutions.filter(e => e.status === 'running' || e.status === 'queued');
  const recentExecutions = filteredExecutions.filter(e => e.status === 'completed' || e.status === 'failed').slice(0, 10);

  return (
    <>
      {selectedExecution && (
        <ExecutionDetails
          execution={selectedExecution}
          onClose={() => setSelectedExecution(null)}
        />
      )}

    <div className="border-2 border-green-400 bg-zinc-950 p-6 relative min-h-[600px]">
      {/* Panel Label */}
      <div className="absolute -top-3 left-4 bg-black px-2 text-green-400 text-xs tracking-widest">
        ▐ EXECUTION MONITOR ▌
      </div>

      {/* Project Filter */}
      {projects.length > 0 && (
        <div className="mb-4">
          <label className="block text-purple-400 text-xs mb-2 uppercase tracking-wide">
            Filter by Project
          </label>
          <select
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
            className="bg-black border-2 border-purple-400 text-purple-400 p-2 text-sm uppercase tracking-wide focus:outline-none focus:border-purple-300 transition-colors"
          >
            <option value="all">ALL PROJECTS ({executions.length})</option>
            {projects.map(project => (
              <option key={project} value={project}>
                {project.toUpperCase()} ({executions.filter(e => e.project === project).length})
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="space-y-6">
        {/* Active Executions */}
        {activeExecutions.length > 0 && (
          <div>
            <div className="text-lg text-yellow-400 mb-4 uppercase tracking-wide">
              ⟳ Active Executions ({activeExecutions.length})
            </div>
            <div className="space-y-3">
              {activeExecutions.map(exec => (
                <ExecutionCard
                  key={exec.id}
                  execution={exec}
                  active
                  onClick={() => setSelectedExecution(exec)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Recent Executions */}
        <div>
          <div className="text-lg text-green-400 mb-4 uppercase tracking-wide">
            Recent Executions
          </div>

          {executions.length === 0 ? (
            <div className="text-gray-500 text-center py-12 border border-gray-800">
              NO EXECUTIONS FOUND
              <div className="text-xs mt-2">Launch an agent to see execution status</div>
            </div>
          ) : recentExecutions.length === 0 ? (
            <div className="text-gray-500 text-center py-8 border border-gray-800">
              No completed executions yet
            </div>
          ) : (
            <div className="space-y-2">
              {recentExecutions.map(exec => (
                <ExecutionCard
                  key={exec.id}
                  execution={exec}
                  onClick={() => setSelectedExecution(exec)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
    </>
  );
}

function ExecutionCard({
  execution,
  active = false,
  onClick,
}: {
  execution: Execution;
  active?: boolean;
  onClick?: () => void;
}) {
  const statusConfig = {
    running: { icon: '⟳', color: 'text-yellow-400', borderColor: 'border-yellow-400' },
    queued: { icon: '○', color: 'text-gray-400', borderColor: 'border-gray-400' },
    completed: { icon: '✓', color: 'text-green-400', borderColor: 'border-green-400' },
    failed: { icon: '✗', color: 'text-red-400', borderColor: 'border-red-400' },
  };

  const config = statusConfig[execution.status];

  return (
    <div
      onClick={onClick}
      className={`border-l-4 ${config.borderColor} bg-black p-4 relative overflow-hidden ${active ? 'shadow-lg' : ''} ${onClick ? 'cursor-pointer hover:bg-zinc-900 transition-colors' : ''}`}
    >
      {/* Scanline effect for active executions */}
      {active && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-yellow-400/20 to-transparent h-1 animate-scan" />
        </div>
      )}

      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <div className="font-bold text-white text-sm uppercase">
              {execution.agentId}
            </div>
            {execution.project && (
              <span className="text-xs bg-purple-950 border border-purple-400 text-purple-400 px-2 py-0.5 uppercase">
                {execution.project}
              </span>
            )}
          </div>
          <div className="text-xs text-gray-400">
            {execution.agentName}
          </div>
        </div>
        <div className={`text-sm font-bold ${config.color} uppercase flex items-center gap-1`}>
          <span className={active ? 'animate-pulse' : ''}>{config.icon}</span>
          {execution.status}
        </div>
      </div>

      <div className="text-xs text-gray-400 mb-2">
        Task: {execution.taskType.replace(/_/g, ' ')}
      </div>

      {/* Progress Bar for running executions */}
      {execution.status === 'running' && (
        <RunningProgress execution={execution} />
      )}

      {/* Completion Info */}
      {execution.status === 'completed' && execution.duration && (
        <div className="flex items-center justify-between text-xs text-gray-500 mt-2 pt-2 border-t border-gray-800">
          <span>{(execution.duration / 1000).toFixed(1)}s</span>
          <span>{execution.tokensUsed?.toLocaleString()} tokens</span>
          <span className="text-green-400">${execution.cost?.toFixed(2) || '0.00'}</span>
        </div>
      )}

      {/* Error Info */}
      {execution.status === 'failed' && execution.error && (
        <div className="text-xs text-red-400 mt-2 p-2 bg-red-950/20 border border-red-900">
          Error: {execution.error}
        </div>
      )}
    </div>
  );
}

function RunningProgress({ execution }: { execution: Execution }) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const updateElapsed = () => {
      setElapsed(Math.floor((Date.now() - execution.startedAt) / 1000));
    };

    updateElapsed();
    const interval = setInterval(updateElapsed, 1000);
    return () => clearInterval(interval);
  }, [execution.startedAt]);

  return (
    <div className="mt-3">
      <div className="flex items-center justify-between text-xs text-yellow-400 mb-1">
        <span>PROGRESS</span>
        <span className="font-bold">{execution.progress}%</span>
      </div>
      <div className="h-2 bg-zinc-900 overflow-hidden relative">
        <div
          className="h-full bg-gradient-to-r from-yellow-400 to-green-400 transition-all duration-300 relative"
          style={{ width: `${execution.progress}%` }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/50 to-white/0 animate-pulse" />
        </div>
      </div>
      <div className="text-xs text-gray-500 mt-1">
        {elapsed}s elapsed
      </div>
    </div>
  );
}
