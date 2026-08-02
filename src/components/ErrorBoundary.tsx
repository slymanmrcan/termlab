import { Component, type ErrorInfo, type ReactNode } from "react";

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[TermLab] Uncaught error:", error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <main className="flex min-h-screen items-center justify-center bg-background px-4">
          <div className="max-w-md rounded-[1.25rem] border border-rose-400/15 bg-[linear-gradient(180deg,rgba(13,17,20,0.96),rgba(10,13,16,0.95))] p-6 font-mono text-sm shadow-[0_18px_50px_rgba(0,0,0,0.2)]">
            <p className="text-[0.64rem] uppercase tracking-[0.22em] text-rose-500">
              fatal error
            </p>
            <p className="mt-3 leading-7 text-zinc-300">
              Something went wrong while rendering the terminal.
            </p>
            <p className="mt-2 break-words rounded-md border border-white/[0.06] bg-slate-950/40 px-3 py-2 text-[0.72rem] leading-6 text-zinc-500">
              {this.state.error.message}
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-4 rounded-md border border-emerald-400/25 bg-emerald-400/10 px-3 py-1.5 text-[0.64rem] text-emerald-200 transition-all duration-150 hover:border-emerald-400/40 hover:bg-emerald-400/15"
            >
              [reload session]
            </button>
          </div>
        </main>
      );
    }

    return this.props.children;
  }
}
