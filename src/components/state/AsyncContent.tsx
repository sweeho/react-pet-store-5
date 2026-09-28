import type { ReactNode } from "react";

import ErrorState from "./ErrorState";
import LoadingState from "./LoadingState";

export interface AsyncContentProps<T> {
  load: () => Promise<T>;
  isEmpty?: (data: T) => boolean;
  empty: ReactNode;
  children: (data: T) => ReactNode;
}

type AsyncState<T> = { status: "loading" } | { status: "error" } | { status: "success"; data: T };

/**
 * Picks between LoadingState, ErrorState and the caller's empty/children
 * views for one `load` call (design.md § "State frames API"). `retryCount`
 * drives the fetch effect so retrying re-invokes `load` without the effect
 * itself calling setState synchronously; the effect's own cleanup — run
 * before a superseding retry's effect, and on unmount — discards a result
 * that is no longer current.
 */
export default function AsyncContent<T>({ load, isEmpty, empty, children }: AsyncContentProps<T>) {
  const [state, setState] = useState<AsyncState<T>>({ status: "loading" });
  const [retryCount, setRetryCount] = useState(0);
  const loadRef = useRef(load);

  useEffect(() => {
    loadRef.current = load;
  });

  useEffect(() => {
    let cancelled = false;

    loadRef.current().then(
      (data) => {
        if (!cancelled) setState({ status: "success", data });
      },
      () => {
        if (!cancelled) setState({ status: "error" });
      },
    );

    return () => {
      cancelled = true;
    };
  }, [retryCount]);

  const retry = useCallback(() => {
    setState({ status: "loading" });
    setRetryCount((count) => count + 1);
  }, []);

  if (state.status === "loading") {
    return <LoadingState />;
  }

  if (state.status === "error") {
    return <ErrorState onRetry={retry} />;
  }

  if (isEmpty?.(state.data)) {
    return <>{empty}</>;
  }

  return <>{children(state.data)}</>;
}
