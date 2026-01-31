import { NextRequest, NextResponse } from 'next/server';
import { getAgentById, addExecution, updateExecution } from '@/lib/data-helpers';
import type { ExecuteAgentRequest, ExecuteAgentResponse, Execution } from '@/lib/types/command';

export async function POST(request: NextRequest) {
  try {
    const body: ExecuteAgentRequest = await request.json();
    const { agentId, taskType, input } = body;

    // Validate agent exists
    const agent = await getAgentById(agentId);
    if (!agent) {
      return NextResponse.json(
        { error: 'Agent not found' },
        { status: 404 }
      );
    }

    // Validate task type is supported
    if (!agent.supportedTaskTypes.includes(taskType)) {
      return NextResponse.json(
        { error: `Agent ${agent.name} does not support task type: ${taskType}` },
        { status: 400 }
      );
    }

    // Create execution record
    const executionId = `exec-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const execution: Execution = {
      id: executionId,
      agentId: agent.id,
      agentName: agent.name,
      taskType,
      status: 'queued',
      progress: 0,
      startedAt: Date.now(),
      input,
    };

    await addExecution(execution);

    // Simulate async agent execution (in real system, would call Claude API)
    executeAgentAsync(executionId, agent, taskType, input);

    const response: ExecuteAgentResponse = {
      executionId,
      status: 'queued',
      message: `Agent ${agent.name} execution queued`,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Execute agent error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Simulated async execution (replace with real Claude API call)
async function executeAgentAsync(
  executionId: string,
  agent: { id: string; name: string },
  taskType: string,
  input: Record<string, unknown>
) {
  // Update to running
  await updateExecution(executionId, {
    status: 'running',
    progress: 10,
  });

  // Simulate work with progress updates
  const progressSteps = [25, 50, 75, 90];
  for (const progress of progressSteps) {
    await new Promise(resolve => setTimeout(resolve, 500));
    await updateExecution(executionId, { progress });
  }

  // Simulate completion (would be real Claude API response)
  await new Promise(resolve => setTimeout(resolve, 1000));

  const mockOutput = generateMockOutput(taskType, input);
  const tokensUsed = Math.floor(Math.random() * 2000) + 500;

  await updateExecution(executionId, {
    status: 'completed',
    progress: 100,
    completedAt: Date.now(),
    duration: Date.now() - (await getExecutionStartTime(executionId)),
    tokensUsed,
    cost: 0, // Plan MAX
    output: mockOutput,
  });
}

async function getExecutionStartTime(executionId: string): Promise<number> {
  const { getExecutions } = await import('@/lib/data-helpers');
  const executions = await getExecutions();
  const execution = executions.find(exec => exec.id === executionId);
  return execution?.startedAt || Date.now();
}

function generateMockOutput(taskType: string, input: Record<string, unknown>) {
  const topic = input.topic as string || 'Marketing';

  switch (taskType) {
    case 'create_linkedin_post':
      return {
        post: `🚀 ${topic} is transforming the industry!\n\nKey insights:\n• Innovation drives growth\n• Data-informed decisions win\n• Customer-first approach matters\n\n#Marketing #Innovation`,
        hashtags: ['#Marketing', '#Innovation', '#BusinessGrowth'],
      };
    case 'create_twitter_thread':
      return {
        thread: [
          `1/ ${topic} - A thread 🧵`,
          `2/ The landscape is changing rapidly...`,
          `3/ Here's what you need to know...`,
          `4/ Key takeaway: Stay informed and adapt.`,
        ],
      };
    case 'write_blog':
      return {
        title: `The Ultimate Guide to ${topic}`,
        content: `Introduction to ${topic}...\n\nSection 1: Understanding the basics...\n\nConclusion: ${topic} is essential for modern business.`,
        wordCount: 1500,
      };
    case 'keyword_research':
      return {
        keywords: [
          { keyword: `${topic} tools`, volume: 5400, difficulty: 65 },
          { keyword: `best ${topic} software`, volume: 3200, difficulty: 58 },
          { keyword: `${topic} strategy`, volume: 2900, difficulty: 52 },
        ],
      };
    case 'email_campaign':
      return {
        subject: `Unlock the Power of ${topic}`,
        preview: `Discover how ${topic} can transform your business...`,
        body: `Hi there,\n\nWe wanted to share some insights about ${topic}...\n\nBest regards,\nThe Team`,
      };
    case 'ad_copy':
      return {
        headline: `Transform Your Business with ${topic}`,
        description: `Join thousands of companies using ${topic} to drive growth.`,
        cta: 'Get Started Today',
      };
    default:
      return {
        result: `Completed ${taskType} for ${topic}`,
      };
  }
}
