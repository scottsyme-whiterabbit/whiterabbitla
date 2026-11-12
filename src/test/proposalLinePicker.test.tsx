import { afterEach, describe, expect, it, vi } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { addLinesCascading } from "@/lib/proposalTiers";
import { StandardLinePicker } from "@/components/admin/StandardLinePicker";

let root: Root | undefined;
function render(element: React.ReactNode) {
  const container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  act(() => root?.render(element));
}
afterEach(() => { act(() => root?.unmount()); root = undefined; document.body.innerHTML = ""; });

const checkbox = (name: string) => Array.from(document.querySelectorAll<HTMLElement>('[role="checkbox"]')).find(el => el.textContent === name)!;
const button = (pattern: RegExp | string) => Array.from(document.querySelectorAll<HTMLButtonElement>("button")).find(el => typeof pattern === "string" ? el.textContent?.trim() === pattern : pattern.test(el.textContent ?? ""))!;
const click = (el: HTMLElement) => act(() => { el.click(); });
const checkboxCount = () => document.querySelectorAll('[role="checkbox"]').length;

const emptyTiers = () => [0, 1, 2].map(i => ({ name: `Tier ${i + 1}`, price: "$3,000", items: [] as string[] }));
const LINES = [
  { group: "Planning", text: "Planning call" },
  { group: "Planning", text: "Venue coordination" },
  { group: "The Magic", text: "Mind reading" },
];

describe("adding several picked lines at once", () => {
  it("adds every confirmed line to the package", () => {
    const result = addLinesCascading(emptyTiers(), 2, ["Planning call", "Mind reading"]);
    expect(result[2].items).toEqual(["Planning call", "Mind reading"]);
  });
  it("still copies picked lines upward into every higher package only", () => {
    expect(addLinesCascading(emptyTiers(), 1, ["A", "B"]).map(t => t.items)).toEqual([[], ["A", "B"], ["A", "B"]]);
    expect(addLinesCascading(emptyTiers(), 0, ["A", "B"]).map(t => t.items)).toEqual([["A", "B"], ["A", "B"], ["A", "B"]]);
  });
  it("removing a line from one package leaves the others alone", () => {
    const result = addLinesCascading(emptyTiers(), 0, ["A", "B"]);
    result[1] = { ...result[1], items: result[1].items.filter((_, j) => j !== 0) };
    expect(result.map(t => t.items)).toEqual([["A", "B"], ["B"], ["A", "B"]]);
  });
  it("never duplicates a line already present, but fills packages missing it", () => {
    const tiers = [{ items: ["A"] }, { items: [] as string[] }, { items: [" a ", "B"] }];
    expect(addLinesCascading(tiers, 0, ["A", "B"]).map(t => t.items)).toEqual([["A", "B"], ["A", "B"], [" a ", "B"]]);
  });
  it("adding a line to a lower package when a higher one already has it", () => {
    const tiers = [{ items: [] as string[] }, { items: [] as string[] }, { items: ["A"] }];
    expect(addLinesCascading(tiers, 0, ["A"]).map(t => t.items)).toEqual([["A"], ["A"], ["A"]]);
  });
});

describe("standard line menu", () => {
  const open = () => click(button(/standard line/i));

  it("stays open while several lines are ticked, then adds them all on confirm", () => {
    const onAdd = vi.fn();
    render(<StandardLinePicker lines={LINES} onAdd={onAdd} />);
    open();
    click(checkbox("Mind reading"));
    click(checkbox("Planning call"));
    expect(checkbox("Planning call")).toHaveAttribute("aria-checked", "true");
    expect(onAdd).not.toHaveBeenCalled();
    click(button("Add selected (2)"));
    expect(onAdd).toHaveBeenCalledTimes(1);
    expect(onAdd).toHaveBeenCalledWith(["Planning call", "Mind reading"]);
    expect(checkboxCount()).toBe(0);
  });
  it("unticking a line leaves it out", () => {
    const onAdd = vi.fn();
    render(<StandardLinePicker lines={LINES} onAdd={onAdd} />);
    open();
    click(checkbox("Planning call"));
    click(checkbox("Venue coordination"));
    click(checkbox("Planning call"));
    click(button("Add selected (1)"));
    expect(onAdd).toHaveBeenCalledWith(["Venue coordination"]);
  });
  it("cancel adds nothing and clears the selection", () => {
    const onAdd = vi.fn();
    render(<StandardLinePicker lines={LINES} onAdd={onAdd} />);
    open();
    click(checkbox("Planning call"));
    click(button("Cancel"));
    expect(onAdd).not.toHaveBeenCalled();
    open();
    expect(checkbox("Planning call")).toHaveAttribute("aria-checked", "false");
  });
  it("closing with Escape or by tapping outside adds nothing", () => {
    const onAdd = vi.fn();
    render(<div><p id="outside">outside</p><StandardLinePicker lines={LINES} onAdd={onAdd} /></div>);
    open();
    click(checkbox("Planning call"));
    act(() => { document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" })); });
    expect(checkboxCount()).toBe(0);
    open();
    click(checkbox("Planning call"));
    act(() => { document.getElementById("outside")!.dispatchEvent(new MouseEvent("mousedown", { bubbles: true })); });
    expect(checkboxCount()).toBe(0);
    expect(onAdd).not.toHaveBeenCalled();
  });
});
