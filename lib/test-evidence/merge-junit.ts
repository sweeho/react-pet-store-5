export interface JunitReport {
  xml: string;
  pathPrefix?: string;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars -- stub
export function mergeJunitReports(_reports: JunitReport[]): string {
  throw new Error("VortexNotImplemented");
}
