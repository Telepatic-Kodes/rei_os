'use client';

import { useState } from 'react';
import type { Handoff } from '@/lib/types/command';
import { toast } from 'sonner';

interface HandoffQueueProps {
  handoffs: Handoff[];
  onHandoffUpdated?: () => void;
}

export function HandoffQueue({ handoffs, onHandoffUpdated }: HandoffQueueProps) {
  const [processing, setProcessing] = useState<string | null>(null);

  const handleAccept = async (handoffId: string) => {
    setProcessing(handoffId);

    try {
      const res = await fetch('/api/command/handoffs/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ handoffId }),
      });

      if (!res.ok) throw new Error('Failed to accept handoff');

      toast.success('Handoff accepted');
      onHandoffUpdated?.();
    } catch (error) {
      toast.error('Failed to accept handoff');
      console.error(error);
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (handoffId: string) => {
    setProcessing(handoffId);

    try {
      const res = await fetch('/api/command/handoffs/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          handoffId,
          reason: 'Manual rejection from Command Center',
        }),
      });

      if (!res.ok) throw new Error('Failed to reject handoff');

      toast.warning('Handoff rejected');
      onHandoffUpdated?.();
    } catch (error) {
      toast.error('Failed to reject handoff');
      console.error(error);
    } finally {
      setProcessing(null);
    }
  };

  return (
    <div className="border-2 border-yellow-400 bg-zinc-950 p-6 relative">
      {/* Panel Label */}
      <div className="absolute -top-3 left-4 bg-black px-2 text-yellow-400 text-xs tracking-widest">
        ▐ HANDOFF QUEUE ▌
      </div>

      {handoffs.length === 0 ? (
        <div className="text-gray-500 text-center py-6">
          NO PENDING HANDOFFS
          <div className="text-xs mt-2">Agent handoffs will appear here</div>
        </div>
      ) : (
        <div className="space-y-3">
          {handoffs.map(handoff => (
            <div
              key={handoff.id}
              className="flex items-center justify-between border-2 border-yellow-400/30 p-4 bg-black hover:border-yellow-400 transition-colors"
            >
              <div className="flex-1 space-y-1">
                {/* Handoff Flow */}
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-yellow-400 font-bold uppercase">
                    {handoff.fromAgent}
                  </span>
                  <span className="text-gray-400">→</span>
                  <span className="text-yellow-400 font-bold uppercase">
                    {handoff.toAgent}
                  </span>
                </div>

                {/* Reason */}
                <div className="text-xs text-gray-400">
                  <span className="text-gray-400">Reason:</span> &quot;{handoff.reason}&quot;
                </div>

                {/* Timestamp */}
                <div className="text-xs text-gray-400">
                  {new Date(handoff.createdAt).toLocaleString()}
                </div>

                {/* Payload Preview */}
                {handoff.payload && Object.keys(handoff.payload).length > 0 && (
                  <details className="text-xs mt-2">
                    <summary className="text-cyan-400 cursor-pointer hover:text-cyan-300">
                      View payload
                    </summary>
                    <pre className="mt-2 p-2 bg-zinc-900 border border-gray-800 text-gray-400 overflow-x-auto">
                      {JSON.stringify(handoff.payload, null, 2)}
                    </pre>
                  </details>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-2 ml-4">
                <button
                  onClick={() => handleAccept(handoff.id)}
                  disabled={processing === handoff.id}
                  className="border-2 border-green-400 text-green-400 px-6 py-2 font-bold uppercase text-sm hover:bg-green-400 hover:text-black transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {processing === handoff.id ? '...' : 'ACCEPT'}
                </button>
                <button
                  onClick={() => handleReject(handoff.id)}
                  disabled={processing === handoff.id}
                  className="border-2 border-red-400 text-red-400 px-6 py-2 font-bold uppercase text-sm hover:bg-red-400 hover:text-black transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {processing === handoff.id ? '...' : 'REJECT'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
