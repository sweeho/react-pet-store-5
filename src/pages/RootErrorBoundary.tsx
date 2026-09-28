import { Component, Fragment, type ReactNode } from "react";

import { ErrorState } from "@/components/state";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  resetKey: number;
}

/**
 * Catches a render error thrown by the routed page and shows the shared
 * error frame (design.md § "State frames API"). "Try again" re-mounts the
 * page: the boundary already discards the failed subtree when it catches,
 * so clearing `hasError` — under a fresh `key` — creates a new instance
 * rather than re-rendering the one that threw.
 */
export default class RootErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, resetKey: 0 };

  static getDerivedStateFromError(): Partial<State> {
    return { hasError: true };
  }

  private handleRetry = (): void => {
    this.setState((prev) => ({ hasError: false, resetKey: prev.resetKey + 1 }));
  };

  render(): ReactNode {
    if (this.state.hasError) {
      return <ErrorState onRetry={this.handleRetry} />;
    }

    return <Fragment key={this.state.resetKey}>{this.props.children}</Fragment>;
  }
}
