import React from 'react';

interface NonCriticalLazyBoundaryProps {
  children?: React.ReactNode | ((attempt: number) => React.ReactNode);
  resetKey?: string | number | boolean;
}

interface NonCriticalLazyBoundaryState {
  hasError: boolean;
  attempt: number;
  lastResetKey: NonCriticalLazyBoundaryProps['resetKey'];
}

export class NonCriticalLazyBoundary extends React.Component<
  NonCriticalLazyBoundaryProps,
  NonCriticalLazyBoundaryState
> {
  override state: NonCriticalLazyBoundaryState = {
    hasError: false,
    attempt: 0,
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
      attempt: state.hasError ? state.attempt + 1 : state.attempt,
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
    this.setState((state) => ({
      hasError: false,
      attempt: state.attempt + 1,
    }));
  };

  override render() {
    if (this.state.hasError) return null;
    if (typeof this.props.children === 'function') {
      return this.props.children(this.state.attempt);
    }
    return this.props.children;
  }
}
