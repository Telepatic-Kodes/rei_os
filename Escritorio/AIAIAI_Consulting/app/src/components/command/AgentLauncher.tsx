'use client';

import { useState } from 'react';
import type { Agent, TaskType, ExecuteAgentResponse } from '@/lib/types/command';
import { toast } from 'sonner';

interface AgentLauncherProps {
  agents: Agent[];
  onExecutionStarted?: () => void;
}

export function AgentLauncher({ agents, onExecutionStarted }: AgentLauncherProps) {
  const [selectedAgentId, setSelectedAgentId] = useState<string>('');
  const [taskType, setTaskType] = useState<TaskType | ''>('');
  const [input, setInput] = useState<Record<string, string>>({});
  const [executing, setExecuting] = useState(false);

  const selectedAgent = agents.find(a => a.id === selectedAgentId);

  const handleExecute = async () => {
    if (!selectedAgentId || !taskType) {
      toast.error('Select an agent and task type');
      return;
    }

    setExecuting(true);

    try {
      const res = await fetch('/api/command/execute-agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId: selectedAgentId,
          taskType,
          input,
        }),
      });

      if (!res.ok) {
        throw new Error('Execution failed');
      }

      const data: ExecuteAgentResponse = await res.json();

      toast.success('Agent launched', {
        description: data.message,
      });

      // Reset form
      setInput({});
      onExecutionStarted?.();
    } catch (error) {
      toast.error('Failed to execute agent');
      console.error(error);
    } finally {
      setExecuting(false);
    }
  };

  return (
    <div className="border-2 border-cyan-400 bg-zinc-950 p-6 relative">
      {/* Panel Label */}
      <div className="absolute -top-3 left-4 bg-black px-2 text-cyan-400 text-xs tracking-widest">
        ▐ AGENT CONTROL ▌
      </div>

      <div className="space-y-6">
        {/* Agent Selection */}
        <div>
          <label className="block text-cyan-400 text-sm mb-2 tracking-wide">
            SELECT AGENT
          </label>
          <select
            value={selectedAgentId}
            onChange={(e) => {
              setSelectedAgentId(e.target.value);
              setTaskType('');
              setInput({});
            }}
            className="w-full bg-black border-2 border-cyan-400 text-cyan-400 p-3 uppercase tracking-wide focus:outline-none focus:border-green-400 transition-colors"
          >
            <option value="">-- SELECT AGENT --</option>
            {agents.map(agent => (
              <option key={agent.id} value={agent.id}>
                {agent.id} | {agent.name}
              </option>
            ))}
          </select>
        </div>

        {/* Agent Preview */}
        {selectedAgent && (
          <div className="border border-cyan-400/30 p-4 space-y-2">
            <div className="text-cyan-400 font-bold uppercase">
              {selectedAgent.name}
            </div>
            <div className="text-xs text-gray-400">
              Department: <span className="text-green-400">{selectedAgent.department}</span>
            </div>
            <div className="text-xs text-gray-400">
              Role: {selectedAgent.role}
            </div>
            <div className="text-xs text-gray-400">
              Tools: {selectedAgent.tools.join(', ')}
            </div>
          </div>
        )}

        {/* Task Type Selection */}
        {selectedAgent && (
          <div>
            <label className="block text-cyan-400 text-sm mb-2 tracking-wide">
              TASK TYPE
            </label>
            <select
              value={taskType}
              onChange={(e) => {
                setTaskType(e.target.value as TaskType);
                setInput({});
              }}
              className="w-full bg-black border-2 border-cyan-400 text-cyan-400 p-3 uppercase tracking-wide focus:outline-none focus:border-green-400 transition-colors"
            >
              <option value="">-- SELECT TASK --</option>
              {selectedAgent.supportedTaskTypes.map(type => (
                <option key={type} value={type}>
                  {type.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Task Input */}
        {taskType && (
          <div>
            <label className="block text-cyan-400 text-sm mb-2 tracking-wide">
              INPUT
            </label>
            <input
              type="text"
              placeholder="Enter topic or content..."
              value={input.topic || ''}
              onChange={(e) => setInput({ ...input, topic: e.target.value })}
              className="w-full bg-black border-2 border-cyan-400 text-white p-3 placeholder-gray-600 focus:outline-none focus:border-green-400 transition-colors"
            />
          </div>
        )}

        {/* Execute Button */}
        <button
          onClick={handleExecute}
          disabled={!selectedAgentId || !taskType || executing}
          className="w-full bg-gradient-to-r from-cyan-400 to-green-400 text-black font-bold py-4 px-6 uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden group transition-all hover:shadow-[0_0_30px_rgba(0,255,0,0.5)]"
        >
          <span className="relative z-10">
            {executing ? '⟳ EXECUTING...' : '▶ EXECUTE AGENT'}
          </span>
          {!executing && (
            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/30 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500" />
          )}
        </button>

        {/* Cost Indicator */}
        <div className="text-center text-xs text-gray-500">
          ESTIMATED COST: <span className="text-green-400">$0.00</span> (PLAN MAX)
        </div>
      </div>
    </div>
  );
}
