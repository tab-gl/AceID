import React from 'react';

interface Props {
  fallback: React.ReactNode;
  children: React.ReactNode;
}

interface State {
  failed: boolean;
}

/**
 * Catches a JS error from a native-backed view (blur, Compose) and renders the
 * fallback instead of taking the whole app down.
 */
export class SafeBoundary extends React.Component<Props, State> {
  state: State = { failed: false };

  static getDerivedStateFromError(): State {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    console.warn('Native glass view failed; using the fallback.', error);
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}
