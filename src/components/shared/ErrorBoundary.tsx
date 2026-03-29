"use client";

import { Component, type ReactNode } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="flex flex-col items-center justify-center min-h-75 text-center p-8">
          <AlertTriangle className="w-12 h-12 text-red-400 mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">
            Something went wrong
          </h3>
          <p className="text-sm text-[#8888AA] mb-4 max-w-md">
            {this.state.error?.message || "An unexpected error occurred"}
          </p>
          <Button
            onClick={() => this.setState({ hasError: false, error: null })}
            variant="outline"
            className="border-[#2A2A3E] text-white"
          >
            Try Again
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
