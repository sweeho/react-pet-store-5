import type { ReactElement } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAdminStrings } from "@/i18n/admin/useAdminStrings";
import { cn } from "@/utils";

import {
  fill,
  formatAmount,
  isValidReportDate,
  percentShares,
  type ReportGroup,
  validGroups,
} from "./orderData";

export const DEFAULT_START_DATE = "01/01/2001";
export const DEFAULT_END_DATE = "12/31/2002";

export interface SalesChartsProps {
  /** Revenue groups as the server sent them; invalid groups are dropped here. */
  revenue: { name?: unknown; value?: unknown }[];
  /** Order-count groups as the server sent them. */
  orders: { name?: unknown; value?: unknown }[];
  /** Range the shown data was requested for, used in the captions. */
  range?: { start: string; end: string };
  disabled?: boolean;
  onGetData: (start: string, end: string) => void;
}

// Series colours in chart-* token order (DESIGN.md §Charts). chart-1 and chart-2
// are near-white tints of the brand blue, so the sequence starts at chart-primary.
const SERIES = [
  { fill: "fill-chart-primary", swatch: "bg-chart-primary" },
  { fill: "fill-chart-5", swatch: "bg-chart-5" },
  { fill: "fill-chart-6", swatch: "bg-chart-6" },
  { fill: "fill-chart-7", swatch: "bg-chart-7" },
  { fill: "fill-chart-3", swatch: "bg-chart-3" },
  { fill: "fill-chart-4", swatch: "bg-chart-4" },
  { fill: "fill-chart-9", swatch: "bg-chart-9" },
  { fill: "fill-chart-10", swatch: "bg-chart-10" },
];

function series(index: number) {
  return SERIES[index % SERIES.length];
}

const PIE_SIZE = 300;
const PIE_RADIUS = 140;

function point(angle: number): string {
  const x = PIE_SIZE / 2 + PIE_RADIUS * Math.sin(angle);
  const y = PIE_SIZE / 2 - PIE_RADIUS * Math.cos(angle);
  return `${x.toFixed(1)} ${y.toFixed(1)}`;
}

function PieChart({ groups, label }: { groups: ReportGroup[]; label: string }): ReactElement {
  const total = groups.reduce((sum, group) => sum + group.amount, 0);
  const shares = percentShares(groups);
  const slices = groups.map((group, index) => {
    const before = groups.slice(0, index).reduce((sum, g) => sum + g.amount, 0);
    const start = total > 0 ? (before / total) * 2 * Math.PI : 0;
    const sweep = total > 0 ? (group.amount / total) * 2 * Math.PI : 0;
    return { group, index, start, end: start + sweep, sweep, percent: shares[index].percent };
  });
  const center = PIE_SIZE / 2;

  return (
    <svg
      width={PIE_SIZE}
      height={PIE_SIZE}
      viewBox={`0 0 ${PIE_SIZE} ${PIE_SIZE}`}
      role="img"
      aria-label={label}
    >
      {slices.map(({ group, index, start, end, sweep, percent }) => {
        if (sweep <= 0) {
          return null;
        }
        const title = <title>{`${group.name}: ${percent} · ${formatAmount(group.value)}`}</title>;
        const common = { className: cn(series(index).fill, "stroke-white"), strokeWidth: 2 };
        if (sweep >= 2 * Math.PI - 1e-9) {
          return (
            <circle key={group.name} cx={center} cy={center} r={PIE_RADIUS} {...common}>
              {title}
            </circle>
          );
        }
        const large = sweep > Math.PI ? 1 : 0;
        const d = `M${center} ${center}L${point(start)}A${PIE_RADIUS} ${PIE_RADIUS} 0 ${large} 1 ${point(end)}Z`;
        return (
          <path key={group.name} d={d} {...common} strokeLinejoin="round">
            {title}
          </path>
        );
      })}
      <g className="fill-white font-bold" fontSize={12}>
        {slices
          .filter(({ sweep }) => sweep > 0.3)
          .map(({ group, start, sweep, percent }) => {
            const mid = start + sweep / 2;
            const x = center + PIE_RADIUS * 0.62 * Math.sin(mid);
            const y = center - PIE_RADIUS * 0.62 * Math.cos(mid);
            return (
              <text key={group.name} x={x} y={y} textAnchor="middle" dominantBaseline="middle">
                {percent}
              </text>
            );
          })}
      </g>
    </svg>
  );
}

const BAR_WIDTH = 56;
const BAR_GAP = 24;
const BAR_HEIGHT = 220;

function BarChart({ groups, label }: { groups: ReportGroup[]; label: string }): ReactElement {
  const max = Math.max(1, ...groups.map((group) => group.amount));
  const width = Math.max(1, groups.length) * (BAR_WIDTH + BAR_GAP) + BAR_GAP;
  return (
    <svg
      width={width}
      height={BAR_HEIGHT + 56}
      viewBox={`0 0 ${width} ${BAR_HEIGHT + 56}`}
      role="img"
      aria-label={label}
    >
      {groups.map((group, index) => {
        const height = (group.amount / max) * BAR_HEIGHT;
        const x = BAR_GAP + index * (BAR_WIDTH + BAR_GAP);
        return (
          <g key={group.name} data-testid="bar" data-name={group.name} data-value={group.value}>
            <rect
              x={x}
              y={24 + BAR_HEIGHT - height}
              width={BAR_WIDTH}
              height={height}
              rx={4}
              className={series(index).fill}
            >
              <title>{`${group.name}: ${formatAmount(group.value)}`}</title>
            </rect>
            <text
              x={x + BAR_WIDTH / 2}
              y={16 + BAR_HEIGHT - height}
              textAnchor="middle"
              fontSize={12}
              className="fill-foreground font-semibold"
            >
              {formatAmount(group.value)}
            </text>
            <text
              x={x + BAR_WIDTH / 2}
              y={BAR_HEIGHT + 44}
              textAnchor="middle"
              fontSize={12}
              className="fill-muted-foreground-2"
            >
              {group.name}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

/** The Sales view (SWHR-R-0182 to SWHR-R-0184, SWHR-R-0190). */
export default function SalesCharts({
  revenue,
  orders,
  range,
  disabled = false,
  onGetData,
}: SalesChartsProps): ReactElement {
  const strings = useAdminStrings();
  const [chart, setChart] = useState<"pie" | "bar">("pie");
  const [start, setStart] = useState(DEFAULT_START_DATE);
  const [end, setEnd] = useState(DEFAULT_END_DATE);
  const [invalid, setInvalid] = useState(false);

  const getData = () => {
    if (!isValidReportDate(start) || !isValidReportDate(end)) {
      setInvalid(true);
      return;
    }
    setInvalid(false);
    onGetData(start, end);
  };

  const shown = range ?? { start: DEFAULT_START_DATE, end: DEFAULT_END_DATE };
  const pieGroups = validGroups(revenue);
  const barGroups = validGroups(orders);
  const groups = chart === "pie" ? pieGroups : barGroups;
  const shares = percentShares(pieGroups);
  const total = pieGroups.reduce((sum, group) => sum + group.amount, 0);
  const barTotal = barGroups.reduce((sum, group) => sum + group.amount, 0);
  const title = chart === "pie" ? strings.pieTitle.label : strings.barTitle.label;
  const caption = fill(
    chart === "pie" ? strings.pieCaption.label : strings.barCaption.label,
    shown,
  );
  const chartLabel = `${chart === "pie" ? strings.pieTab.label : strings.barTab.label}: ${title}`;

  return (
    <section className="bg-background border-line-2 rounded-xl border">
      <div role="tablist" className="border-line-2 flex gap-4 border-b px-5">
        {(["pie", "bar"] as const).map((kind) => (
          <button
            key={kind}
            type="button"
            role="tab"
            aria-selected={chart === kind}
            onClick={() => setChart(kind)}
            className={cn(
              "-mb-px h-12 border-b-2 border-transparent px-1 font-medium",
              chart === kind
                ? "text-primary border-primary"
                : "text-muted-foreground-1 hover:text-foreground",
            )}
          >
            {kind === "pie" ? strings.pieTab.label : strings.barTab.label}
          </button>
        ))}
      </div>

      <div className="border-line-2 flex flex-wrap items-end gap-4 border-b p-5">
        <div>
          <Input
            label={strings.startDateLabel.label}
            value={start}
            inputMode="numeric"
            placeholder="MM/dd/yyyy"
            disabled={disabled}
            onChange={(event) => setStart(event.target.value)}
          />
        </div>
        <div>
          <Input
            label={strings.endDateLabel.label}
            value={end}
            inputMode="numeric"
            placeholder="MM/dd/yyyy"
            disabled={disabled}
            onChange={(event) => setEnd(event.target.value)}
          />
        </div>
        <Button type="button" disabled={disabled} onClick={getData}>
          {strings.getDataButton.label}
        </Button>
        <span className="text-muted-foreground-1 mb-2.5 text-xs">{strings.dateHint.label}</span>
      </div>
      {invalid ? (
        <p role="alert" className="text-destructive border-line-2 border-b px-5 py-3 text-sm">
          {strings.dateFormatMessage.label}
        </p>
      ) : null}

      <div className="grid items-center gap-12 px-10 py-6 lg:grid-cols-2">
        <div className="flex flex-col items-center gap-4">
          <div className="self-start">
            <h2 className="text-base font-semibold">{title}</h2>
            <p className="text-muted-foreground-1 text-sm">{caption}</p>
          </div>
          {groups.length === 0 ? (
            <p className="text-muted-foreground-1 text-sm">{strings.noChartData.label}</p>
          ) : chart === "pie" ? (
            <PieChart groups={pieGroups} label={chartLabel} />
          ) : (
            <BarChart groups={barGroups} label={chartLabel} />
          )}
        </div>

        <div>
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="text-muted-foreground-1 text-left text-xs uppercase">
                <th className="h-10 px-2">{strings.columnCategory.label}</th>
                <th className="px-2 text-right">
                  {chart === "pie" ? strings.columnRevenue.label : strings.columnOrders.label}
                </th>
                {chart === "pie" ? (
                  <th className="px-2 text-right">{strings.columnShare.label}</th>
                ) : null}
              </tr>
            </thead>
            <tbody>
              {groups.map((group, index) => (
                <tr key={group.name}>
                  <td className="border-line-1 h-11 border-b px-2">
                    <span className="inline-flex items-center gap-2.5">
                      <span
                        aria-hidden="true"
                        className={cn("size-3 rounded-sm", series(index).swatch)}
                      />
                      <span data-testid="legend-name">{group.name}</span>
                    </span>
                  </td>
                  <td className="border-line-1 border-b px-2 text-right tabular-nums">
                    {formatAmount(group.value)}
                  </td>
                  {chart === "pie" ? (
                    <td className="border-line-1 border-b px-2 text-right font-semibold tabular-nums">
                      {shares[index].percent}
                    </td>
                  ) : null}
                </tr>
              ))}
              {groups.length > 0 ? (
                <tr className="font-semibold">
                  <td className="h-11 px-2">{strings.totalLabel.label}</td>
                  <td className="px-2 text-right tabular-nums">
                    {chart === "pie" ? formatAmount(total.toFixed(2)) : barTotal}
                  </td>
                  {chart === "pie" ? <td className="px-2 text-right">100%</td> : null}
                </tr>
              ) : null}
            </tbody>
          </table>
          {chart === "pie" ? (
            <p className="text-muted-foreground-1 mt-3 text-xs">{strings.currencyNote.label}</p>
          ) : null}
        </div>
      </div>
    </section>
  );
}
