'use client';

import { useState } from 'react';
import type { Workflow } from '@/lib/types/command';
import { toast } from 'sonner';

interface WorkflowLauncherProps {
  workflows: Workflow[];
  onWorkflowLaunched?: () => void;
}

export function WorkflowLauncher({ workflows, onWorkflowLaunched }: WorkflowLauncherProps) {
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string>('');
  const [input, setInput] = useState<string>('');
  const [launching, setLaunching] = useState(false);

  const selectedWorkflow = workflows.find(w => w.id === selectedWorkflowId);

  const handleLaunch = async () => {
    if (!selectedWorkflowId || !input.trim()) {
      toast.error('Select a workflow and enter input');
      return;
    }

    setLaunching(true);

    try {
      const res = await fetch('/api/command/execute-workflow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workflowId: selectedWorkflowId,
          input: { topic: input },
        }),
      });

      if (!res.ok) {
        throw new Error('Workflow launch failed');
      }

      const data = await res.json();

      toast.success('Workflow launched', {
        description: data.message,
      });

      // Reset
      setInput('');
      setSelectedWorkflowId('');
      onWorkflowLaunched?.();
    } catch (error) {
      toast.error('Failed to launch workflow');
      console.error(error);
    } finally {
      setLaunching(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="text-lg text-cyan-400 mb-4 uppercase tracking-wide">
        Workflows
      </div>

      {/* Workflow Selection */}
      <div className="grid grid-cols-2 gap-3">
        {workflows.map(workflow => (
          <button
            key={workflow.id}
            onClick={() => setSelectedWorkflowId(workflow.id)}
            className={`text-left border-2 p-4 transition-all ${
              selectedWorkflowId === workflow.id
                ? 'border-green-400 bg-green-950/20'
                : 'border-gray-700 hover:border-cyan-400 bg-black'
            }`}
          >
            <div className={`font-bold uppercase text-sm ${
              selectedWorkflowId === workflow.id ? 'text-green-400' : 'text-cyan-400'
            }`}>
              ○ {workflow.name}
            </div>
            <div className="text-xs text-gray-500 mt-2">
              {workflow.steps.length} steps | ~{workflow.estimatedDuration}s
            </div>
          </button>
        ))}
      </div>

      {/* Selected Workflow Details */}
      {selectedWorkflow && (
        <div className="border border-cyan-400/30 p-4 space-y-3">
          <div className="text-cyan-400 font-bold uppercase">
            {selectedWorkflow.name}
          </div>
          <div className="text-xs text-gray-400">
            {selectedWorkflow.description}
          </div>

          {/* Steps Preview */}
          <div className="text-xs text-gray-500 space-y-1 pt-2 border-t border-gray-800">
            <div className="text-cyan-400 mb-1">Pipeline:</div>
            {selectedWorkflow.steps.map((step, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <span className="text-green-400">→</span>
                <span>{step.agentId}</span>
                <span className="text-gray-400">|</span>
                <span>{step.taskType.replace(/_/g, ' ')}</span>
              </div>
            ))}
          </div>

          {/* Input */}
          <div className="pt-2">
            <label className="block text-cyan-400 text-xs mb-2 uppercase">
              Topic / Input
            </label>
            <input
              type="text"
              placeholder="Enter workflow topic..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="w-full bg-black border-2 border-cyan-400 text-white p-2 text-sm placeholder-gray-600 focus:outline-none focus:border-green-400 transition-colors"
            />
          </div>

          {/* Launch Button */}
          <button
            onClick={handleLaunch}
            disabled={!input.trim() || launching}
            className="w-full bg-gradient-to-r from-green-400 to-cyan-400 text-black font-bold py-3 px-4 uppercase text-sm tracking-widest disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden group"
          >
            {launching ? '⟳ LAUNCHING...' : '🚀 LAUNCH WORKFLOW'}
          </button>
        </div>
      )}
    </div>
  );
}
