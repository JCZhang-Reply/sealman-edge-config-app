import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import InlineCustomFieldAdder from "./InlineCustomFieldAdder";

const toastError = vi.hoisted(() => vi.fn());

vi.mock("react-toastify", () => ({ toast: { error: toastError } }));

describe("InlineCustomFieldAdder", () => {
  beforeEach(() => toastError.mockReset());

  it("shows the add button before revealing custom field inputs", () => {
    render(<InlineCustomFieldAdder existingKeys={[]} onAdd={vi.fn()} />);

    expect(screen.getByRole("button", { name: "Add custom field" })).toBeInTheDocument();
    expect(screen.queryByLabelText("Field name")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Value")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Add custom field" }));

    expect(screen.getByLabelText("Field name")).toBeInTheDocument();
    expect(screen.getByLabelText("Value")).toBeInTheDocument();
  });

  it("adds the field and collapses the inputs", () => {
    const onAdd = vi.fn();
    render(<InlineCustomFieldAdder existingKeys={[]} onAdd={onAdd} />);

    fireEvent.click(screen.getByRole("button", { name: "Add custom field" }));
    fireEvent.change(screen.getByLabelText("Field name"), { target: { value: "Area" } });
    fireEvent.change(screen.getByLabelText("Value"), { target: { value: "Line 1" } });
    fireEvent.click(screen.getByRole("button", { name: "Add Field" }));

    expect(onAdd).toHaveBeenCalledWith("Area", "Line 1");
    expect(screen.getByRole("button", { name: "Add custom field" })).toBeInTheDocument();
    expect(screen.queryByLabelText("Field name")).not.toBeInTheDocument();
  });
});
