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

export function runStep<T>(step: string, fn: () => T): T {
  void [step, fn];
  throw new Error("VortexNotImplemented");
}
