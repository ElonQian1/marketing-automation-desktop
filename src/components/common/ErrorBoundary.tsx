// src/components/common/ErrorBoundary.tsx
// module: ui | layer: ui | role: component
// summary: UI 组件

import React from 'react';

type Props = {
  fallback?: React.ReactNode;
  onReset?: () => void;
  children: React.ReactNode;
};

type State = { hasError: boolean; error?: Error };

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
     
    try { console.error('[ErrorBoundary] caught error:', error, errorInfo); } catch {}
  }

  reset = () => {
    this.setState({ hasError: false, error: undefined });
    this.props.onReset?.();
  };

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <div style={{ padding: 16 }}>
            <div style={{ marginBottom: 8 }}>模块加载失败（可能是开发服务器重启中）。</div>
            <button onClick={this.reset} style={{ padding: '6px 10px', border: '1px solid #ccc', borderRadius: 4 }}>重试</button>
          </div>
        )
      );
    }
    return this.props.children;
  }
}
