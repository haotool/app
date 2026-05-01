import React from 'react';

interface NonCriticalLazyBoundaryProps {
  children?: React.ReactNode;
  resetKey?: string | number | boolean;
}

interface NonCriticalLazyBoundaryState {
  hasError: boolean;
  lastResetKey: NonCriticalLazyBoundaryProps['resetKey'];
}

export class NonCriticalLazyBoundary extends React.Component<
  NonCriticalLazyBoundaryProps,
  NonCriticalLazyBoundaryState
> {
  override state: NonCriticalLazyBoundaryState = {
    hasError: false,
    lastResetKey: this.props.resetKey,
  };

  static getDerivedStateFromError(): Partial<NonCriticalLazyBoundaryState> {
    return { hasError: true };
  }

  static getDerivedStateFromProps(
    props: NonCriticalLazyBoundaryProps,
    state: NonCriticalLazyBoundaryState,
  ): Partial<NonCriticalLazyBoundaryState> | null {
    if (props.resetKey === state.lastResetKey) return null;

    return {
      hasError: false,
      lastResetKey: props.resetKey,
    };
  }

  override componentDidMount() {
    if (typeof window === 'undefined') return;
    window.addEventListener('online', this.handleOnline);
  }

  override componentWillUnmount() {
    if (typeof window === 'undefined') return;
    window.removeEventListener('online', this.handleOnline);
  }

  private handleOnline = () => {
    if (!this.state.hasError) return;
    this.setState({ hasError: false });
  };

  override render() {
    if (this.state.hasError) return null;
    return this.props.children;
  }
}
