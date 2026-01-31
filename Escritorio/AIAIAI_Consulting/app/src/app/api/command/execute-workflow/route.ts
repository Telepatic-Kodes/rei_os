import { NextRequest, NextResponse } from 'next/server';
import { getWorkflowById, getAgentById, addExecution } from '@/lib/data-helpers';
import type { ExecuteWorkflowRequest, Execution } from '@/lib/types/command';

export async function POST(request: NextRequest) {
  try {
    const body: ExecuteWorkflowRequest = await request.json();
    const { workflowId, input } = body;

    // Validate workflow exists
    const workflow = await getWorkflowById(workflowId);
    if (!workflow) {
      return NextResponse.json(
        { error: 'Workflow not found' },
        { status: 404 }
      );
    }

    // Create executions for each step (simplified - not handling dependencies)
    const executionIds: string[] = [];

    for (const step of workflow.steps) {
      const agent = await getAgentById(step.agentId);
      if (!agent) continue;

      const executionId = `exec-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      const execution: Execution = {
        id: executionId,
        agentId: agent.id,
        agentName: agent.name,
        taskType: step.taskType,
        status: 'queued',
        progress: 0,
        startedAt: Date.now(),
        input,
      };

      await addExecution(execution);
      executionIds.push(executionId);

      // Small delay between steps
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    return NextResponse.json({
      success: true,
      workflowId,
      executionIds,
      message: `Workflow ${workflow.name} launched with ${executionIds.length} steps`,
    });
  } catch (error) {
    console.error('Execute workflow error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
