export class WorkflowStepError extends Error {
  constructor(
    readonly step: string,
    cause: unknown,
  ) {
    super(`workflow step "${step}" failed`, { cause });
    this.name = "WorkflowStepError";
  }
}

export class DependencyResolutionError extends Error {
  constructor(
    readonly dependency: string,
    cause: unknown,
  ) {
    super(`dependency "${dependency}" could not be resolved`, { cause });
    this.name = "DependencyResolutionError";
  }
}

/**
 * Runs a workflow step; any failure, sync or async, is rethrown as a
 * `WorkflowStepError` whose `cause` is the original error.
 */
export function runStep<T>(step: string, fn: () => T): T {
  try {
    const result = fn();
    if (result instanceof Promise) {
      // The cast is safe: the wrapped promise resolves to the same value as `result`.
      return result.catch((e: unknown) => {
        throw new WorkflowStepError(step, e);
      }) as T;
    }
    return result;
  } catch (e) {
    throw new WorkflowStepError(step, e);
  }
}
