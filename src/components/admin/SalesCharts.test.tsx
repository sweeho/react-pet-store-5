import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import SalesCharts from "./SalesCharts";

const REVENUE = [
  { name: "Fish", value: "60.00" },
  { name: "Dogs", value: "140.00" },
];

describe("SalesCharts", () => {
  it("[SWHR-C-0321] defaults the range to 01/01/2001 - 12/31/2002", () => {
    render(<SalesCharts revenue={REVENUE} orders={[]} onGetData={vi.fn()} />);
    expect(screen.getByLabelText("Start Date")).toHaveValue("01/01/2001");
    expect(screen.getByLabelText("End Date")).toHaveValue("12/31/2002");
  });

  it("[SWHR-C-0320] shows the format message and requests nothing for '2001-01-01'", async () => {
    const onGetData = vi.fn();
    const user = userEvent.setup();
    render(<SalesCharts revenue={REVENUE} orders={[]} onGetData={onGetData} />);

    const start = screen.getByLabelText("Start Date");
    await user.clear(start);
    await user.type(start, "2001-01-01");
    await user.click(screen.getByRole("button", { name: "Get Data" }));

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Dates must be in the format of MM/dd/yyyy",
    );
    expect(onGetData).not.toHaveBeenCalled();
  });

  it("[SWHR-C-0337] shows Fish as 30% and Dogs as 70% in the pie chart", () => {
    render(<SalesCharts revenue={REVENUE} orders={[]} onGetData={vi.fn()} />);
    expect(screen.getByRole("img", { name: /pie chart/i })).toBeInTheDocument();
    expect(screen.getByRole("row", { name: /Fish/ })).toHaveTextContent("30%");
    expect(screen.getByRole("row", { name: /Dogs/ })).toHaveTextContent("70%");
  });

  it("[SWHR-C-0322] draws only the named group when one has no name", () => {
    render(
      <SalesCharts
        revenue={[
          { name: "", value: "10.00" },
          { name: "Fish", value: "60.00" },
        ]}
        orders={[]}
        onGetData={vi.fn()}
      />,
    );
    expect(screen.getAllByTestId("legend-name").map((el) => el.textContent)).toEqual(["Fish"]);
  });

  it("[SWHR-C-0338] requests the range and redraws the bar chart with the returned counts", async () => {
    const onGetData = vi.fn();
    const user = userEvent.setup();
    const { rerender } = render(
      <SalesCharts revenue={REVENUE} orders={[]} onGetData={onGetData} />,
    );

    await user.click(screen.getByRole("tab", { name: "Bar Chart" }));
    const start = screen.getByLabelText("Start Date");
    const end = screen.getByLabelText("End Date");
    await user.clear(start);
    await user.type(start, "01/01/2002");
    await user.clear(end);
    await user.type(end, "06/30/2002");
    await user.click(screen.getByRole("button", { name: "Get Data" }));

    expect(onGetData).toHaveBeenCalledWith("01/01/2002", "06/30/2002");

    rerender(
      <SalesCharts
        revenue={REVENUE}
        orders={[
          { name: "Fish", value: "4" },
          { name: "Dogs", value: "9" },
        ]}
        onGetData={onGetData}
      />,
    );
    const bars = screen.getAllByTestId("bar");
    expect(bars.map((bar) => bar.getAttribute("data-name"))).toEqual(["Fish", "Dogs"]);
    expect(within(bars[1]).getByText("9")).toBeInTheDocument();
  });
});
