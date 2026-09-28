import { Component, type ReactNode } from "react";

import { ErrorState } from "@/components/state";

import { ScreenNotFoundError } from "./screens";

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

/**
 * Catches `ScreenNotFoundError` from a page's `useScreen()` call and shows
 * the specific "Definition for screen <name> not found" message (D3,
 * SWHR-R-0013.04; mockup "page definition not found"). Any other render
 * error is not this boundary's to handle — re-thrown during render so it
 * reaches the outer RootErrorBoundary's generic frame instead.
 */
export default class ScreenBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: unknown): Partial<State> {
    return { error: error instanceof Error ? error : new Error(String(error)) };
  }

  render(): ReactNode {
    const { error } = this.state;

    if (error instanceof ScreenNotFoundError) {
      return (
        <ErrorState
          title="This page could not be loaded"
          description={error.message}
          onRetry={() => this.setState({ error: null })}
        />
      );
    }

    if (error) {
      throw error;
    }

    return this.props.children;
  }
}
