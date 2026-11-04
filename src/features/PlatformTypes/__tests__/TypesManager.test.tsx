import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import TypesManager from "../TypesManager";
import { ENDPOINT_ROLE_OPTIONS, ENDPOINT_TYPE_DEFAULT_FIELDS, ENDPOINT_TYPE_DEFAULT_MAPPING } from "../typeRoles";

describe("TypesManager mapping", () => {
  it.each(["Edit Test", "Delete Test"])("closes the %s dialog when permission is lost", async (action) => {
    const props = {
      title: "Endpoint Types",
      singularLabel: "Endpoint Type",
      types: [{ type_id: "test", label: "Test", description: null, fields: {} }],
      isLoading: false,
      onCreate: vi.fn(),
      onUpdate: vi.fn(),
      onDelete: vi.fn(),
    };
    const { rerender } = render(<TypesManager {...props} canWrite />);
    await userEvent.click(screen.getByRole("button", { name: action }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    rerender(<TypesManager {...props} canWrite={false} />);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    for (const button of screen.getAllByRole("button")) {
      expect(button).toBeDisabled();
    }
    expect(props.onUpdate).not.toHaveBeenCalled();
    expect(props.onDelete).not.toHaveBeenCalled();
  });

  it.each(["Endpoint", "Service"])("disables all %s Type actions without write permission", async (kind) => {
    const onCreate = vi.fn();
    const onUpdate = vi.fn();
    const onDelete = vi.fn();
    render(
      <TypesManager
        title={`${kind} Types`}
        singularLabel={`${kind} Type`}
        types={[{ type_id: "test", label: "Test", description: null, fields: {} }]}
        isLoading={false}
        canWrite={false}
        onCreate={onCreate}
        onUpdate={onUpdate}
        onDelete={onDelete}
      />
    );

    for (const button of screen.getAllByRole("button")) {
      expect(button).toBeDisabled();
      await userEvent.click(button);
    }
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(onCreate).not.toHaveBeenCalled();
    expect(onUpdate).not.toHaveBeenCalled();
    expect(onDelete).not.toHaveBeenCalled();
  });

  it("sends mapping on create when roleOptions are set", async () => {
    const onCreate = vi.fn().mockResolvedValue(undefined);
    render(
      <TypesManager
        title="Endpoint Types"
        singularLabel="Endpoint Type"
        types={[]}
        isLoading={false}
        defaultFields={ENDPOINT_TYPE_DEFAULT_FIELDS}
        defaultMapping={ENDPOINT_TYPE_DEFAULT_MAPPING}
        roleOptions={ENDPOINT_ROLE_OPTIONS}
        onCreate={onCreate}
        onUpdate={vi.fn()}
        onDelete={vi.fn()}
      />
    );
    await userEvent.click(screen.getByRole("button", { name: "Add endpoint type" }));
    await userEvent.type(screen.getByPlaceholderText("Human readable name"), "PLC");
    const buttons = screen.getAllByRole("button", { name: "Add endpoint type" });
    await userEvent.click(buttons[buttons.length - 1]);
    expect(onCreate).toHaveBeenCalledWith(expect.objectContaining({ mapping: { ip: "ip", name: "name" } }));
  });

  it("sends no mapping without roleOptions", async () => {
    const onCreate = vi.fn().mockResolvedValue(undefined);
    render(<TypesManager title="Device Types" singularLabel="Device Type" types={[]} isLoading={false} onCreate={onCreate} onUpdate={vi.fn()} onDelete={vi.fn()} />);
    await userEvent.click(screen.getByRole("button", { name: "Add device type" }));
    await userEvent.type(screen.getByPlaceholderText("Human readable name"), "Gateway");
    const buttons = screen.getAllByRole("button", { name: "Add device type" });
    await userEvent.click(buttons[buttons.length - 1]);
    expect(onCreate.mock.calls[0][0]).not.toHaveProperty("mapping");
  });
});
