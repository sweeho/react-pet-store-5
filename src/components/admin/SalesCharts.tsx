/* eslint-disable @typescript-eslint/no-unused-vars -- red-phase stub */
import type { ReactElement } from "react";

export interface SalesChartsProps {
  revenue: { name?: unknown; value?: unknown }[];
  orders: { name?: unknown; value?: unknown }[];
  disabled?: boolean;
  onGetData: (start: string, end: string) => void;
}

export default function SalesCharts(props: SalesChartsProps): ReactElement {
  throw new Error("VortexNotImplemented");
}
