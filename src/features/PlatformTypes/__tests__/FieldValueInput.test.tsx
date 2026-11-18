import { useState } from "react";
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { components } from "@/generated/edge-administration/types";
import FieldValueInput, { formatMetadataValue, validateFields } from "../FieldValueInput";

type FieldDefinition = components["schemas"]["FieldDefinition"];

const equipmentField: FieldDefinition = {
  type: "list",
  label: "Equipment",
  required: true,
  ui: null,
  default: null,
  changeable: true,
  show_in_list: true,
  item_fields: {
    code: {
      type: "string",
      label: "Code",
      required: true,
      ui: "input",
      default: null,
      changeable: true,
      show_in_list: true,
    },
  },
  item_order: ["code"],
};

describe("FieldValueInput list values", () => {
  it("preserves server IDs and unknown item values while editing rows", async () => {
    const user = userEvent.setup();
    const initial = [{ id: "server-id", code: "OLD", legacy: "keep" }];
    function Harness() {
      const [value, setValue] = useState<unknown>(initial);
      return <FieldValueInput definition={equipmentField} value={value} onChange={setValue} />;
    }

    render(<Harness />);
    await user.click(screen.getByRole("button", { name: "Add item" }));
    const inputs = screen.getAllByRole("textbox");
    await user.type(inputs[1], "NEW");

    expect(screen.getAllByRole("textbox")[0]).toHaveValue("OLD");
    expect(screen.getAllByRole("textbox")[1]).toHaveValue("NEW");
    await user.click(screen.getByRole("button", { name: "Remove item 2" }));
    expect(screen.getAllByRole("textbox")).toHaveLength(1);
    expect(screen.getByRole("textbox")).toHaveValue("OLD");
  });

  it("validates list cardinality and required sub-fields", () => {
    expect(validateFields({ equipment: [] }, { equipment: equipmentField })).toContain('"Equipment" is required');
    expect(validateFields({ equipment: [{}] }, { equipment: equipmentField })).toContain("Code");
    expect(validateFields({ equipment: [{ code: "A-1" }] }, { equipment: equipmentField })).toBeNull();
  });

  it("formats list values compactly for metadata summaries", () => {
    expect(formatMetadataValue([{ code: "A" }, { code: "B" }], equipmentField)).toBe("2 items");
  });
});