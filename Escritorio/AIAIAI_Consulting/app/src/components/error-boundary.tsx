"use client";

import React, { Component, ReactNode, ErrorInfo } from "react";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

/**
 * Error boundary component for catching React errors
 * Shows brutalist-styled error UI with reload option
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: undefined };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="p-8 border-4 border-red-400 bg-zinc-950 text-center min-h-[400px] flex flex-col items-center justify-center">
          <h2 className="text-3xl font-bold text-red-400 uppercase tracking-wider mb-4 font-[family-name:var(--font-space)]">
            ⚠ System Error
          </h2>
          <p className="text-gray-400 font-mono text-sm mb-2">
            A component failed to render
          </p>
          <pre className="text-gray-500 font-mono text-xs mb-6 max-w-2xl overflow-auto p-4 bg-black/50 border border-red-400/30">
            {this.state.error?.message || "Unknown error"}
          </pre>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 border-2 border-cyan-400 text-cyan-400 uppercase tracking-widest hover:bg-cyan-400 hover:text-black transition-all font-[family-name:var(--font-jetbrains)]"
          >
            Reload Dashboard
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
