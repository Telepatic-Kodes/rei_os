// Command Center Types for AMD Agent System

export type AgentDepartment =
  | 'content'
  | 'social'
  | 'seo'
  | 'email'
  | 'ads'
  | 'analytics'
  | 'brand';

export type AgentStatus = 'online' | 'offline' | 'busy';

export type ExecutionStatus = 'queued' | 'running' | 'completed' | 'failed';

export type TaskType =
  | 'create_linkedin_post'
  | 'create_twitter_thread'
  | 'write_blog'
  | 'keyword_research'
  | 'content_optimization'
  | 'email_campaign'
  | 'ad_copy'
  | 'analyze_performance'
  | 'brand_guidelines';

export interface Agent {
  id: string;
  name: string;
  department: AgentDepartment;
  role: string;
  status: AgentStatus;
  capabilities: string[];
  tools: string[];
  supportedTaskTypes: TaskType[];
}

export interface Execution {
  id: string;
  agentId: string;
  agentName: string;
  taskType: TaskType;
  status: ExecutionStatus;
  progress: number; // 0-100
  startedAt: number; // Unix timestamp
  completedAt?: number;
  duration?: number; // milliseconds
  tokensUsed?: number;
  cost?: number;
  input?: Record<string, unknown>;
  output?: Record<string, unknown>;
  error?: string;
  project?: string; // Optional project tag
}

export interface WorkflowStep {
  agentId: string;
  taskType: TaskType;
  dependsOn?: string[]; // IDs of previous steps
}

export interface Workflow {
  id: string;
  name: string;
  description: string;
  steps: WorkflowStep[];
  estimatedDuration: number; // seconds
}

export interface Handoff {
  id: string;
  fromAgent: string;
  toAgent: string;
  reason: string;
  payload: Record<string, unknown>;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: number;
}

// API Request/Response types
export interface ExecuteAgentRequest {
  agentId: string;
  taskType: TaskType;
  input: Record<string, unknown>;
}

export interface ExecuteAgentResponse {
  executionId: string;
  status: ExecutionStatus;
  message: string;
}

export interface ExecuteWorkflowRequest {
  workflowId: string;
  input: Record<string, unknown>;
}

export interface AcceptHandoffRequest {
  handoffId: string;
}

export interface RejectHandoffRequest {
  handoffId: string;
  reason: string;
}
