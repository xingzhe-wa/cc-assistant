import React from 'react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[CC Assistant] Render error:', error, info.componentStack);
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          padding: '32px',
          background: 'var(--bg-primary)',
          color: 'var(--fg-primary)',
          fontFamily: 'var(--font-sans)',
          gap: '12px',
        }}>
          <span className="material-icons-round" style={{ fontSize: '36px', color: 'var(--color-error)' }}>
            error_outline
          </span>
          <div style={{ fontSize: '14px', fontWeight: 600 }}>Something went wrong</div>
          {this.state.error && (
            <pre style={{
              fontSize: '11px',
              color: 'var(--fg-muted)',
              background: 'var(--bg-secondary)',
              padding: '8px 12px',
              borderRadius: '6px',
              maxWidth: '400px',
              overflow: 'auto',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
            }}>
              {this.state.error.message}
            </pre>
          )}
          <button
            onClick={this.handleReload}
            style={{
              padding: '6px 16px',
              fontSize: '12px',
              border: '1px solid var(--border-default)',
              borderRadius: '6px',
              background: 'var(--bg-element)',
              color: 'var(--fg-primary)',
              cursor: 'pointer',
            }}
          >
            Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
