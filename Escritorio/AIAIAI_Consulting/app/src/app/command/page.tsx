'use client';

import { useState, useEffect } from 'react';
import type { Agent, Execution, Workflow, Handoff } from '@/lib/types/command';
import { AgentLauncher } from '@/components/command/AgentLauncher';
import { ExecutionMonitor } from '@/components/command/ExecutionMonitor';
import { WorkflowLauncher } from '@/components/command/WorkflowLauncher';
import { HandoffQueue } from '@/components/command/HandoffQueue';

export default function CommandCenterPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [executions, setExecutions] = useState<Execution[]>([]);
  const [handoffs, setHandoffs] = useState<Handoff[]>([]);
  const [loading, setLoading] = useState(true);

  // Data loading functions (declared before useEffect)
  const loadAgents = async () => {
    const res = await fetch('/data/agents.json');
    const data = await res.json();
    setAgents(data.agents);
  };

  const loadWorkflows = async () => {
    const res = await fetch('/data/workflows.json');
    const data = await res.json();
    setWorkflows(data.workflows);
  };

  const loadExecutions = async () => {
    const res = await fetch('/api/command/executions?filter=recent&limit=20');
    const data = await res.json();
    setExecutions(data.executions);
  };

  const loadHandoffs = async () => {
    const res = await fetch('/api/command/handoffs');
    const data = await res.json();
    setHandoffs(data.handoffs);
  };

  const loadData = async () => {
    await Promise.all([
      loadAgents(),
      loadWorkflows(),
      loadExecutions(),
      loadHandoffs(),
    ]);
    setLoading(false);
  };

  // Load initial data
  useEffect(() => {
    loadData();
    // Auto-refresh executions and handoffs every 3 seconds
    const interval = setInterval(() => {
      loadExecutions();
      loadHandoffs();
    }, 3000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const activeCount = executions.filter(e => e.status === 'running').length;
  const onlineAgents = agents.filter(a => a.status === 'online').length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-black text-cyan-400 font-[family-name:var(--font-jetbrains)]">
        <div className="text-center">
          <div className="text-4xl mb-4 font-[family-name:var(--font-space)] tracking-widest">
            ▐ INITIALIZING COMMAND CENTER ▌
          </div>
          <div className="text-xl animate-pulse">LOADING SYSTEMS...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white font-[family-name:var(--font-jetbrains)]">
      {/* Header */}
      <header className="border-b-2 border-cyan-400 p-4 bg-zinc-950">
        <div className="flex items-center justify-between max-w-[2000px] mx-auto">
          <h1 className="text-3xl font-bold text-cyan-400 tracking-wider font-[family-name:var(--font-space)]">
            ▐ COMMAND CENTER ▌
          </h1>
          <div className="flex gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse" />
              <span className="text-green-400">{onlineAgents} AGENTS ONLINE</span>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${activeCount > 0 ? 'bg-yellow-400 animate-pulse' : 'bg-gray-600'}`} />
              <span className={activeCount > 0 ? 'text-yellow-400' : 'text-gray-500'}>
                {activeCount} RUNNING
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Grid */}
      <main className="max-w-[2000px] mx-auto p-6 grid grid-cols-12 gap-6">
        {/* Left Panel - Agent Launcher & Workflows */}
        <div className="col-span-4 space-y-6">
          <AgentLauncher
            agents={agents}
            onExecutionStarted={loadExecutions}
          />

          <div className="border-2 border-purple-400 bg-zinc-950 p-6 relative">
            <div className="absolute -top-3 left-4 bg-black px-2 text-purple-400 text-xs tracking-widest">
              ▐ WORKFLOW CONTROL ▌
            </div>
            <WorkflowLauncher
              workflows={workflows}
              onWorkflowLaunched={loadExecutions}
            />
          </div>
        </div>

        {/* Right Panel - Execution Monitor */}
        <div className="col-span-8">
          <ExecutionMonitor executions={executions} />
        </div>

        {/* Bottom Panel - Handoff Queue */}
        <div className="col-span-12">
          <HandoffQueue
            handoffs={handoffs}
            onHandoffUpdated={loadHandoffs}
          />
        </div>
      </main>
    </div>
  );
}
