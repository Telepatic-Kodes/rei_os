'use client';

import type { Execution } from '@/lib/types/command';

interface ExecutionDetailsProps {
  execution: Execution;
  onClose: () => void;
}

export function ExecutionDetails({ execution, onClose }: ExecutionDetailsProps) {
  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-6">
      <div className="bg-zinc-950 border-4 border-cyan-400 max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col relative">
        {/* Header */}
        <div className="border-b-2 border-cyan-400 p-6 bg-black">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold text-cyan-400 uppercase font-[family-name:var(--font-space)] tracking-wider">
                ▐ EXECUTION DETAILS ▌
              </h2>
              <div className="text-sm text-gray-400 mt-2">
                ID: {execution.id}
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-red-400 hover:text-red-300 text-3xl leading-none"
            >
              ×
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Agent Info */}
          <div className="border-2 border-green-400 p-4 bg-black">
            <div className="text-green-400 font-bold uppercase mb-2">Agent Information</div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Agent ID:</span>
                <div className="text-white font-bold">{execution.agentId}</div>
              </div>
              <div>
                <span className="text-gray-500">Agent Name:</span>
                <div className="text-white">{execution.agentName}</div>
              </div>
              <div>
                <span className="text-gray-500">Task Type:</span>
                <div className="text-cyan-400">{execution.taskType.replace(/_/g, ' ')}</div>
              </div>
              <div>
                <span className="text-gray-500">Status:</span>
                <div className={`font-bold ${
                  execution.status === 'completed' ? 'text-green-400' :
                  execution.status === 'failed' ? 'text-red-400' :
                  'text-yellow-400'
                }`}>
                  {execution.status.toUpperCase()}
                </div>
              </div>
            </div>
          </div>

          {/* Timing & Metrics */}
          <div className="border-2 border-yellow-400 p-4 bg-black">
            <div className="text-yellow-400 font-bold uppercase mb-2">Performance Metrics</div>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Started:</span>
                <div className="text-white">{new Date(execution.startedAt).toLocaleString()}</div>
              </div>
              {execution.completedAt && (
                <div>
                  <span className="text-gray-500">Completed:</span>
                  <div className="text-white">{new Date(execution.completedAt).toLocaleString()}</div>
                </div>
              )}
              {execution.duration && (
                <div>
                  <span className="text-gray-500">Duration:</span>
                  <div className="text-green-400 font-bold">{(execution.duration / 1000).toFixed(2)}s</div>
                </div>
              )}
              {execution.tokensUsed && (
                <div>
                  <span className="text-gray-500">Tokens:</span>
                  <div className="text-cyan-400 font-bold">{execution.tokensUsed.toLocaleString()}</div>
                </div>
              )}
              <div>
                <span className="text-gray-500">Cost:</span>
                <div className="text-green-400 font-bold">${execution.cost?.toFixed(2) || '0.00'}</div>
              </div>
              <div>
                <span className="text-gray-500">Progress:</span>
                <div className="text-white">{execution.progress}%</div>
              </div>
            </div>
          </div>

          {/* Input */}
          {execution.input && Object.keys(execution.input).length > 0 && (
            <div className="border-2 border-purple-400 p-4 bg-black">
              <div className="text-purple-400 font-bold uppercase mb-2">Input Data</div>
              <pre className="text-xs text-white bg-zinc-900 p-4 overflow-x-auto border border-purple-400/30">
                {JSON.stringify(execution.input, null, 2)}
              </pre>
            </div>
          )}

          {/* Output */}
          {execution.output && Object.keys(execution.output).length > 0 && (
            <div className="border-2 border-green-400 p-4 bg-black">
              <div className="text-green-400 font-bold uppercase mb-2">Output Result</div>
              <pre className="text-xs text-white bg-zinc-900 p-4 overflow-x-auto border border-green-400/30 whitespace-pre-wrap">
                {JSON.stringify(execution.output, null, 2)}
              </pre>
            </div>
          )}

          {/* Error */}
          {execution.error && (
            <div className="border-2 border-red-400 p-4 bg-black">
              <div className="text-red-400 font-bold uppercase mb-2">Error Details</div>
              <pre className="text-xs text-red-300 bg-zinc-900 p-4 overflow-x-auto border border-red-400/30">
                {execution.error}
              </pre>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t-2 border-cyan-400 p-4 bg-black flex justify-end">
          <button
            onClick={onClose}
            className="bg-cyan-400 text-black font-bold px-6 py-2 uppercase tracking-wider hover:bg-cyan-300 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
