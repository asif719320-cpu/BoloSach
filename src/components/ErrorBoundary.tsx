import React, { Component, ErrorInfo, ReactNode } from 'react';
import { RefreshCw, ShieldAlert } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  errorMessage: string;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    errorMessage: '',
  };

  public static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      errorMessage: error.message || 'An unexpected error occurred.',
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('ErrorBoundary caught error:', error, errorInfo);
  }

  private handleReload = (): void => {
    window.location.href = window.location.pathname;
  };

  public render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#F7F7F4] flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white border border-neutral-200 rounded-2xl p-8 text-center">
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center mx-auto mb-4">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <h1 className="text-xl font-bold text-neutral-900 mb-2">Something went wrong</h1>
            <p className="text-sm text-neutral-600 mb-6 break-words">
              {this.state.errorMessage.slice(0, 200)}
            </p>
            <button
              type="button"
              onClick={this.handleReload}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-neutral-900 text-white text-sm font-medium hover:bg-neutral-800 transition-colors cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              Reload BoloSach
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
