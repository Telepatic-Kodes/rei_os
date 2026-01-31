// Data helpers for JSON file operations
import { promises as fs } from 'fs';
import path from 'path';
import type { Agent, Execution, Workflow, Handoff } from './types/command';

const DATA_DIR = path.join(process.cwd(), '..', 'data');

// Generic JSON reader
async function readJSON<T>(filename: string): Promise<T> {
  const filePath = path.join(DATA_DIR, filename);
  const content = await fs.readFile(filePath, 'utf-8');
  return JSON.parse(content);
}

// Generic JSON writer
async function writeJSON<T>(filename: string, data: T): Promise<void> {
  const filePath = path.join(DATA_DIR, filename);
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

// Agents
export async function getAgents(): Promise<Agent[]> {
  const data = await readJSON<{ agents: Agent[] }>('agents.json');
  return data.agents;
}

export async function getAgentById(id: string): Promise<Agent | undefined> {
  const agents = await getAgents();
  return agents.find(agent => agent.id === id);
}

// Workflows
export async function getWorkflows(): Promise<Workflow[]> {
  const data = await readJSON<{ workflows: Workflow[] }>('workflows.json');
  return data.workflows;
}

export async function getWorkflowById(id: string): Promise<Workflow | undefined> {
  const workflows = await getWorkflows();
  return workflows.find(workflow => workflow.id === id);
}

// Executions
export async function getExecutions(): Promise<Execution[]> {
  const data = await readJSON<{ executions: Execution[] }>('executions.json');
  return data.executions;
}

export async function addExecution(execution: Execution): Promise<void> {
  const data = await readJSON<{ executions: Execution[] }>('executions.json');
  data.executions.push(execution);
  await writeJSON('executions.json', data);
}

export async function updateExecution(id: string, updates: Partial<Execution>): Promise<void> {
  const data = await readJSON<{ executions: Execution[] }>('executions.json');
  const index = data.executions.findIndex(exec => exec.id === id);

  if (index !== -1) {
    data.executions[index] = { ...data.executions[index], ...updates };
    await writeJSON('executions.json', data);
  }
}

export async function getActiveExecutions(): Promise<Execution[]> {
  const executions = await getExecutions();
  return executions.filter(exec => exec.status === 'running' || exec.status === 'queued');
}

export async function getRecentExecutions(limit: number = 10): Promise<Execution[]> {
  const executions = await getExecutions();
  return executions
    .sort((a, b) => b.startedAt - a.startedAt)
    .slice(0, limit);
}

// Handoffs
export async function getHandoffs(): Promise<Handoff[]> {
  const data = await readJSON<{ handoffs: Handoff[] }>('handoffs.json');
  return data.handoffs;
}

export async function getPendingHandoffs(): Promise<Handoff[]> {
  const handoffs = await getHandoffs();
  return handoffs.filter(handoff => handoff.status === 'pending');
}

export async function updateHandoff(id: string, updates: Partial<Handoff>): Promise<void> {
  const data = await readJSON<{ handoffs: Handoff[] }>('handoffs.json');
  const index = data.handoffs.findIndex(handoff => handoff.id === id);

  if (index !== -1) {
    data.handoffs[index] = { ...data.handoffs[index], ...updates };
    await writeJSON('handoffs.json', data);
  }
}

export async function addHandoff(handoff: Handoff): Promise<void> {
  const data = await readJSON<{ handoffs: Handoff[] }>('handoffs.json');
  data.handoffs.push(handoff);
  await writeJSON('handoffs.json', data);
}
