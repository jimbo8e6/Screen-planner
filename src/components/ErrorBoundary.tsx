import { Component, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}
interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div className="h-screen bg-gray-900 flex items-center justify-center p-8">
          <div className="max-w-xl w-full bg-red-900/30 border border-red-700 rounded-xl p-6">
            <h1 className="text-red-400 font-bold text-lg mb-2">Something went wrong</h1>
            <pre className="text-red-300 text-xs overflow-auto whitespace-pre-wrap">
              {this.state.error.message}
              {'\n\n'}
              {this.state.error.stack}
            </pre>
            <button
              onClick={() => this.setState({ error: null })}
              className="mt-4 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded px-3 py-1.5 transition-colors"
            >
              Try again
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
