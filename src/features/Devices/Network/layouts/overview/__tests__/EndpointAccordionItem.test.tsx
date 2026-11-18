import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Accordion } from "@/components/ui/accordion";
import type { MappedEndpoint } from "@/generated/edge-administration/hooks/network/usePostNetworkOverview";
import EndpointAccordionItem from "../EndpointAccordionItem";
import { endpointListKey } from "../overviewMerge";
import { ShowConnectionStateContext } from "../connectionStateContext";

const { typesRef, updateEndpoint, updateService, deleteEndpoint, deleteService } = vi.hoisted(() => ({
  typesRef: { current: [] as unknown[] },
  updateEndpoint: vi.fn(),
  updateService: vi.fn(),
  deleteEndpoint: vi.fn(),
  deleteService: vi.fn(),
}));

vi.mock("@/generated/edge-administration/hooks/endpoint_types/useGetEndpointTypes", () => ({
  default: () => ({ data: typesRef.current }),
}));
vi.mock("@/generated/edge-administration/hooks/service_types/useGetServiceTypes", () => ({
  default: () => ({ data: [{ type_id: "opcua", label: "OPC UA", fields: { path: { ...STRING, label: "Path" } } }] }),
}));
vi.mock("@/generated/edge-administration/hooks/endpoints/useUpdateEndpoint", () => ({
  useUpdateEndpoint: () => ({ updateEndpoint, isPending: false }),
}));
vi.mock("@/generated/edge-administration/hooks/services/useUpdateService", () => ({
  useUpdateService: () => ({ updateService, isPending: false }),
}));
vi.mock("@/generated/edge-administration/hooks/endpoints/useDeleteEndpoint", () => ({
  useDeleteEndpoint: () => ({ deleteEndpoint, isPending: false }),
}));
vi.mock("@/generated/edge-administration/hooks/services/useDeleteService", () => ({
  useDeleteService: () => ({ deleteService, isPending: false }),
}));
vi.mock("@/features/authorization/permissions/use-permissions", () => ({
  usePermissions: () => ({ hasPermission: true }),
}));
vi.mock("../AssignEndpointDialog", () => ({ default: () => null }));
vi.mock("../AssignServiceDialog", () => ({ default: () => null }));
vi.mock("../BrowseDialog", () => ({ default: () => null }));

const STRING = { type: "string", ui: "input", required: false, changeable: true, show_in_list: true, default: null } as const;

function renderItem(endpoint: MappedEndpoint) {
  return render(
    <Accordion type="single" defaultValue={endpointListKey(endpoint)}>
      <EndpointAccordionItem endpoint={endpoint} deviceId="dev-1" onCreated={() => {}} onOpenDetails={() => {}} onOpenServiceDetails={() => {}} />
    </Accordion>
  );
}

describe("EndpointAccordionItem", () => {
  beforeEach(() => {
    updateEndpoint.mockReset().mockResolvedValue(undefined);
    updateService.mockReset().mockResolvedValue(undefined);
    deleteEndpoint.mockReset().mockResolvedValue(undefined);
    deleteService.mockReset().mockResolvedValue(undefined);
    typesRef.current = [
      { type_id: "plc", label: "PLC", description: null, fields: { title: { ...STRING, label: "Asset name" } }, mapping: { title: "name", addr: "ip" } },
      { type_id: "sensor", label: "Sensor", description: null, fields: {}, mapping: {} },
    ];
  });

  it("uses the name-role value as title", () => {
    renderItem({
      endpoint_id: "e1", type_id: "plc", type_label: "PLC", ip: "10.0.0.1", status: "online", source: "configured", ports: [],
      endpoint_data: {
        title: { value: "Press 1", field: { ...STRING, label: "Title" } },
        addr: { value: "10.0.0.1", field: { ...STRING, label: "Address" } },
      },
    });
    expect(screen.getByText("Press 1")).toBeInTheDocument();
  });

  it("shows endpoint metadata when its details disclosure is opened", async () => {
    renderItem({
      endpoint_id: "e-details", type_id: "plc", type_label: "PLC", ip: "10.0.0.1", status: "online", source: "configured", ports: [],
      endpoint_data: { title: { value: "Press 1", field: { ...STRING, label: "Asset name" } } },
    });
    expect(screen.queryByText("Asset name")).not.toBeInTheDocument();
    screen.getByRole("button", { name: "Endpoint details" }).click();
    expect(await screen.findByText("Asset name")).toBeInTheDocument();
    expect(screen.getAllByText("Press 1")).toHaveLength(2);
  });

  it("shows and lets users edit an empty list field on a scan-assigned endpoint", async () => {
    const user = userEvent.setup();
    typesRef.current = [{
      type_id: "plc",
      label: "PLC",
      description: null,
      mapping: {},
      fields: {
        equipments: {
          type: "list",
          label: "Equipments",
          required: false,
          ui: null,
          default: null,
          changeable: true,
          show_in_list: true,
          item_fields: {
            serial: {
              type: "string",
              label: "Serial Number",
              required: true,
              ui: "input",
              default: null,
              changeable: true,
              show_in_list: true,
            },
          },
        },
      },
    }];

    renderItem({
      endpoint_id: "e-list",
      type_id: "plc",
      type_label: "PLC",
      ip: "10.0.0.1",
      status: "online",
      source: "configured",
      ports: [],
      endpoint_data: {},
    });

    await user.click(screen.getByRole("button", { name: "Endpoint details" }));
    expect(await screen.findByText("Equipments")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Edit endpoint details" }));
    expect(screen.getByRole("button", { name: "Add item" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Add item" }));
    expect(screen.getByText("Serial Number")).toBeInTheDocument();
  });

  it("shows list item values instead of an item count", async () => {
    const user = userEvent.setup();
    const equipmentField = {
      type: "list",
      label: "Equipments",
      required: false,
      ui: null,
      default: null,
      changeable: true,
      show_in_list: true,
      item_fields: {
        serial: { type: "string", label: "Serial Number", required: true, ui: "input", changeable: true, show_in_list: true },
        model: { type: "string", label: "Model", required: false, ui: "input", changeable: true, show_in_list: true },
      },
      item_order: ["serial", "model"],
    };
    typesRef.current = [{
      type_id: "plc",
      label: "PLC",
      description: null,
      fields: { equipments: equipmentField },
      mapping: {},
    }];

    renderItem({
      endpoint_id: "e-list-values",
      type_id: "plc",
      type_label: "PLC",
      ip: "10.0.0.1",
      status: "online",
      source: "configured",
      ports: [],
      endpoint_data: {
        equipments: {
          value: [{ id: "item-1", serial: "SN-42", model: "Panel X" }],
          field: equipmentField,
        },
      },
    });

    await user.click(screen.getByRole("button", { name: "Endpoint details" }));

    expect(await screen.findByText("Serial Number:")).toBeInTheDocument();
    expect(screen.getByText("SN-42")).toBeInTheDocument();
    expect(screen.getByText("Model:")).toBeInTheDocument();
    expect(screen.getByText("Panel X")).toBeInTheDocument();
    expect(screen.queryByText("1 item")).not.toBeInTheDocument();
  });

  it("shows a mapped IP field only in the dedicated IP address row", async () => {
    const user = userEvent.setup();
    typesRef.current = [{
      type_id: "plc",
      label: "PLC",
      description: null,
      fields: { addr: { ...STRING, label: "Address" } },
      mapping: { addr: "ip" },
    }];

    renderItem({
      endpoint_id: "e-ip-detail",
      type_id: "plc",
      type_label: "PLC",
      ip: "10.0.0.8",
      status: "online",
      source: "configured",
      ports: [],
      endpoint_data: { addr: { value: "10.0.0.8", field: { ...STRING, label: "Address" } } },
    });

    await user.click(screen.getByRole("button", { name: "Endpoint details" }));

    expect(screen.getByText("IP address")).toBeInTheDocument();
    expect(screen.queryByText("Address")).not.toBeInTheDocument();
    expect(screen.getAllByText("10.0.0.8", { exact: true })).toHaveLength(1);
  });

  it("edits and saves endpoint fields inline", async () => {
    const user = userEvent.setup();
    renderItem({
      endpoint_id: "e-edit", type_id: "plc", type_label: "PLC", ip: "10.0.0.1", status: "online", source: "configured", ports: [],
      endpoint_data: { title: { value: "Press 1", field: { ...STRING, label: "Asset name" } } },
    });
    await user.click(screen.getByRole("button", { name: "Endpoint details" }));
    const viewCellCount = document.querySelectorAll('[role="region"] dl > div').length;
    await user.click(screen.getByRole("button", { name: "Edit endpoint details" }));
    expect(document.querySelectorAll('[role="region"] dl > div')).toHaveLength(viewCellCount);
    const input = screen.getByDisplayValue("Press 1");
    await user.clear(input);
    await user.type(input, "Press 2");
    await user.click(screen.getByRole("button", { name: "Save" }));
    expect(updateEndpoint).toHaveBeenCalledWith({ endpointId: "e-edit", body: { endpoint_data: { title: "Press 2" } } });
  });

  it("cancels endpoint edits without saving", async () => {
    const user = userEvent.setup();
    renderItem({
      endpoint_id: "e-cancel", type_id: "plc", type_label: "PLC", ip: "10.0.0.1", status: "online", source: "configured", ports: [],
      endpoint_data: { title: { value: "Press 1", field: { ...STRING, label: "Asset name" } } },
    });
    await user.click(screen.getByRole("button", { name: "Edit endpoint details" }));
    const input = screen.getByDisplayValue("Press 1");
    await user.clear(input);
    await user.type(input, "Draft");
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(updateEndpoint).not.toHaveBeenCalled();
    expect(screen.queryByDisplayValue("Draft")).not.toBeInTheDocument();
  });

  it("keeps a newly added endpoint custom field visible and saves it", async () => {
    const user = userEvent.setup();
    renderItem({
      endpoint_id: "e-custom", type_id: "plc", type_label: "PLC", ip: "10.0.0.1", status: "online", source: "configured", ports: [],
      endpoint_data: { title: { value: "Press 1", field: { ...STRING, label: "Asset name" } } },
    });
    await user.click(screen.getByRole("button", { name: "Edit endpoint details" }));
    await user.click(screen.getByRole("button", { name: "Add custom field" }));
    await user.type(screen.getByLabelText("Field name"), "Area");
    await user.type(screen.getByLabelText("Value"), "Line 1");
    await user.click(screen.getByRole("button", { name: "Add Field" }));

    expect(screen.getByRole("textbox", { name: "Area" })).toHaveValue("Line 1");
    await user.click(screen.getByRole("button", { name: "Save" }));
    expect(updateEndpoint).toHaveBeenCalledWith({
      endpointId: "e-custom",
      body: { endpoint_data: { title: "Press 1", Area: "Line 1" } },
    });
  });

  it("shows a field called ip without the ip role as extra info", () => {
    renderItem({
      endpoint_id: "e2", type_id: "sensor", type_label: "Sensor", status: "unknown", source: "configured", ports: [],
      endpoint_data: { ip: { value: "192.168.9.9", field: { ...STRING, label: "Old IP" } } },
    });
    expect(screen.getByText(/192\.168\.9\.9/)).toBeInTheDocument();
  });

  it("has no leading separator in the subtitle of an IP-less endpoint with extra info", () => {
    renderItem({
      endpoint_id: "e8", type_id: "sensor", type_label: "Sensor", status: "unknown", source: "configured", ports: [],
      endpoint_data: { foo: { value: "bar", field: { ...STRING, label: "Foo" } } },
    });
    expect(screen.getByText(/bar/).textContent).toBe("bar");
  });

  it("hides role fields from the extra info", () => {
    renderItem({
      endpoint_id: "e3", type_id: "plc", type_label: "PLC", ip: "10.0.0.3", status: "online", source: "configured", ports: [],
      endpoint_data: { title: { value: "Press 3", field: { ...STRING, label: "Title" } }, addr: { value: "10.0.0.3", field: { ...STRING, label: "Address" } } },
    });
    expect(screen.queryByText(/Press 3 ·/)).not.toBeInTheDocument();
  });

  it("lists an endpoint without IP with the type label as title and unknown services", () => {
    renderItem({
      endpoint_id: "e4", type_id: "sensor", type_label: "Sensor", status: "unknown", source: "configured",
      endpoint_data: {},
      ports: [{ status: "unknown", source: "configured", service_id: "s1", type_label: "Modbus" }],
    });
    expect(screen.getAllByText("Sensor")).toHaveLength(2);
    expect(screen.getByRole("button", { name: "Details" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Edit endpoint details" })).toBeInTheDocument();
    expect(screen.getAllByText("Unknown")).toHaveLength(2);
    expect(screen.getByRole("tab", { name: /Modbus/ })).toBeInTheDocument();
  });

  it("shows Browse for a service with a browser, an ip and a port", () => {
    renderItem({
      endpoint_id: "e5", type_id: "sensor", type_label: "Sensor", ip: "10.0.0.5", status: "online", source: "configured", endpoint_data: {},
      ports: [{ port: 4840, status: "online", source: "configured", service_id: "s5", type_label: "OPC UA", browser_kind: "opcua" }],
    });
    expect(screen.getByRole("button", { name: "Browse" })).toBeInTheDocument();
  });

  it("confirms before removing a service", async () => {
    const user = userEvent.setup();
    renderItem({
      endpoint_id: "e-remove-service", type_id: "sensor", type_label: "Sensor", ip: "10.0.0.5", status: "online", source: "configured", endpoint_data: {},
      ports: [{
        port: 4840, status: "online", source: "configured", service_id: "s-remove", type_id: "opcua", type_label: "OPC UA",
      }],
    });
    expect(screen.queryByRole("button", { name: "Remove service" })).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Edit service" }));
    await user.click(screen.getByRole("button", { name: "Remove service" }));
    expect(deleteService).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "Delete" }));
    expect(deleteService).toHaveBeenCalledWith("s-remove");
  });

  it("offers Add Service on a configured endpoint", () => {
    renderItem({
      endpoint_id: "e-add-service", type_id: "sensor", type_label: "Sensor", ip: "10.0.0.6", status: "online", source: "configured", endpoint_data: {},
      ports: [],
    });
    expect(screen.getByRole("button", { name: "Add Service" })).toBeInTheDocument();
  });

  it("confirms before removing an endpoint", async () => {
    const user = userEvent.setup();
    renderItem({
      endpoint_id: "e-remove", type_id: "sensor", type_label: "Sensor", ip: "10.0.0.6", status: "online", source: "configured", endpoint_data: {},
      ports: [],
    });
    expect(screen.queryByRole("button", { name: "Remove endpoint" })).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Edit endpoint details" }));
    await user.click(screen.getByRole("button", { name: "Remove endpoint" }));
    expect(deleteEndpoint).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "Delete" }));
    expect(deleteEndpoint).toHaveBeenCalledWith("e-remove");
  });

  it("edits and saves service fields inline", async () => {
    const user = userEvent.setup();
    renderItem({
      endpoint_id: "e-service", type_id: "sensor", type_label: "Sensor", ip: "10.0.0.5", status: "online", source: "configured", endpoint_data: {},
      ports: [{
        port: 4840, status: "online", source: "configured", service_id: "s-service", type_id: "opcua", type_label: "OPC UA", browser_kind: "opcua",
        service_data: { path: { value: "/old", field: { ...STRING, label: "Path" } } },
      }],
    });
    const panel = screen.getByRole("tabpanel");
    const viewCellCount = panel.querySelectorAll("dl > div").length;
    await user.click(screen.getByRole("button", { name: "Edit service" }));
    expect(screen.getByRole("tabpanel").querySelectorAll("dl > div")).toHaveLength(viewCellCount);
    const input = screen.getByDisplayValue("/old");
    await user.clear(input);
    await user.type(input, "/new");
    await user.click(screen.getByRole("button", { name: "Save" }));
    expect(updateService).toHaveBeenCalledWith({ serviceId: "s-service", body: { service_data: { path: "/new" } } });
  });

  it("cancels service edits without saving", async () => {
    const user = userEvent.setup();
    renderItem({
      endpoint_id: "e-service-cancel", type_id: "sensor", type_label: "Sensor", ip: "10.0.0.5", status: "online", source: "configured", endpoint_data: {},
      ports: [{
        port: 4840, status: "online", source: "configured", service_id: "s-service-cancel", type_id: "opcua", type_label: "OPC UA",
        service_data: { path: { value: "/old", field: { ...STRING, label: "Path" } } },
      }],
    });
    await user.click(screen.getByRole("button", { name: "Edit service" }));
    const input = screen.getByDisplayValue("/old");
    await user.clear(input);
    await user.type(input, "/draft");
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(updateService).not.toHaveBeenCalled();
    expect(screen.queryByDisplayValue("/draft")).not.toBeInTheDocument();
  });

  it("keeps a newly added service custom field visible and saves it", async () => {
    const user = userEvent.setup();
    renderItem({
      endpoint_id: "e-service-custom", type_id: "sensor", type_label: "Sensor", ip: "10.0.0.5", status: "online", source: "configured", endpoint_data: {},
      ports: [{
        port: 4840, status: "online", source: "configured", service_id: "s-service-custom", type_id: "opcua", type_label: "OPC UA",
        service_data: { path: { value: "/old", field: { ...STRING, label: "Path" } } },
      }],
    });
    await user.click(screen.getByRole("button", { name: "Edit service" }));
    await user.click(screen.getByRole("button", { name: "Add custom field" }));
    await user.type(screen.getByLabelText("Field name"), "Namespace");
    await user.type(screen.getByLabelText("Value"), "line/1");
    await user.click(screen.getByRole("button", { name: "Add Field" }));

    expect(screen.getByRole("textbox", { name: "Namespace" })).toHaveValue("line/1");
    await user.click(screen.getByRole("button", { name: "Save" }));
    expect(updateService).toHaveBeenCalledWith({
      serviceId: "s-service-custom",
      body: { service_data: { path: "/old", Namespace: "line/1" } },
    });
  });

  it("shows no Browse without an ip", () => {
    renderItem({
      endpoint_id: "e6", type_id: "sensor", type_label: "Sensor", status: "unknown", source: "configured", endpoint_data: {},
      ports: [{ port: 4840, status: "unknown", source: "configured", service_id: "s6", type_label: "OPC UA", browser_kind: "opcua" }],
    });
    expect(screen.queryByRole("button", { name: "Browse" })).not.toBeInTheDocument();
  });

  it("shows no Browse without a port", () => {
    renderItem({
      endpoint_id: "e7", type_id: "sensor", type_label: "Sensor", ip: "10.0.0.7", status: "online", source: "configured", endpoint_data: {},
      ports: [{ status: "unknown", source: "configured", service_id: "s7", type_label: "OPC UA", browser_kind: "opcua" }],
    });
    expect(screen.queryByRole("button", { name: "Browse" })).not.toBeInTheDocument();
  });

  it("shows no connection states and keeps Browse usable while the network scan is disabled", () => {
    render(
      <ShowConnectionStateContext.Provider value={false}>
        <Accordion type="single" defaultValue="id:e9">
          <EndpointAccordionItem
            endpoint={{
              endpoint_id: "e9", type_id: "sensor", type_label: "Sensor", ip: "10.0.0.9", status: "offline", source: "configured", endpoint_data: {},
              ports: [{ port: 4840, status: "offline", source: "configured", service_id: "s9", type_label: "OPC UA", browser_kind: "opcua" }],
            }}
            deviceId="dev-1" onCreated={() => {}} onOpenDetails={() => {}} onOpenServiceDetails={() => {}}
          />
        </Accordion>
      </ShowConnectionStateContext.Provider>
    );
    expect(screen.getByRole("tab", { name: /OPC UA/ })).toBeInTheDocument();
    expect(screen.queryByText("Offline")).not.toBeInTheDocument();
    expect(screen.queryByText("Status")).not.toBeInTheDocument();
    expect(screen.queryByText("Last status change")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Browse" })).toBeEnabled();
  });
});
