import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-6">
          <div className="bg-slate-800 border-2 border-red-500 rounded-xl p-8 max-w-md w-full">
            <div className="flex items-center justify-center mb-6">
              <div className="h-16 w-16 rounded-full bg-red-600 flex items-center justify-center">
                <AlertTriangle className="h-8 w-8 text-white" />
              </div>
            </div>

            <h1 className="text-2xl font-bold text-white text-center mb-4">
              Something Went Wrong
            </h1>

            <p className="text-gray-400 text-center mb-6">
              An unexpected error occurred. Please try reloading the page.
            </p>

            {this.state.error && (
              <div className="bg-slate-900 rounded-lg p-4 mb-6">
                <p className="text-red-400 text-sm font-mono break-all">
                  {this.state.error.message}
                </p>
              </div>
            )}

            <button
              onClick={this.handleReload}
              className="w-full bg-gradient-to-r from-red-600 to-red-700 text-white px-6 py-3 rounded-lg hover:from-red-700 hover:to-red-800 transition-all font-semibold"
            >
              Reload Page
            </button>

            <p className="text-gray-500 text-xs text-center mt-4">
              If the problem persists, please contact support
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

