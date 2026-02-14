"use client";

import { Component } from "react";
import type { ReactNode, ErrorInfo } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[50vh] px-4">
          <div className="text-5xl mb-4">{"\uD83D\uDD25"}</div>
          <h2 className="text-xl font-bold text-orange-300 mb-2 font-[family-name:var(--font-display)]">
            Something went wrong
          </h2>
          <p className="text-orange-200/60 text-sm mb-6 text-center">
            The roast got a little too hot. Try refreshing.
          </p>
          <button
            onClick={() => this.setState({ hasError: false })}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-orange-600 to-red-600 font-semibold text-sm"
          >
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
