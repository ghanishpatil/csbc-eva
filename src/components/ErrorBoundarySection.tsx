import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  sectionName?: string;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Section-level Error Boundary
 * Catches errors in specific sections without crashing the entire app
 */
export class ErrorBoundarySection extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    if (import.meta.env.DEV) {
      console.error(`[ErrorBoundarySection] ${this.props.sectionName || 'Section'} error:`, error, errorInfo);
    }
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="bg-cyber-bg-darker border-2 border-red-500/50 rounded-lg p-6 my-4">
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0">
              <div className="h-10 w-10 rounded-full bg-red-500/20 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-red-500" />
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-red-400 mb-2">
                {this.props.sectionName ? `${this.props.sectionName} Error` : 'Section Error'}
              </h3>
              <p className="text-gray-400 text-sm mb-4">
                An error occurred in this section. The rest of the application continues to work.
              </p>
              {this.state.error && import.meta.env.DEV && (
                <div className="bg-slate-900 rounded-lg p-3 mb-4">
                  <p className="text-red-400 text-xs font-mono break-all">
                    {this.state.error.message}
                  </p>
                </div>
              )}
              <button
                onClick={this.handleReset}
                className="flex items-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm font-semibold"
              >
                <RefreshCw className="h-4 w-4" />
                <span>Retry Section</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

