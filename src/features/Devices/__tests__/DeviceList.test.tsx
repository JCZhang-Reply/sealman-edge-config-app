import { fireEvent, within } from "@testing-library/react";
import { MemoryRouter, useLocation } from "react-router-dom";
import { render } from "@/utils/test-utils";
import DeviceList from "../DeviceList";

const { getEndpoints } = vi.hoisted(() => ({ getEndpoints: vi.fn() }));

vi.mock("@/generated/edge-administration/hooks/endpoints/useGetEndpoints", () => ({
  default: getEndpoints,
}));

vi.mock("@/generated/edge-administration/hooks/useGetDevices/useGetDevices", () => ({
  default: () => ({
    isLoading: false,
    isError: false,
    isSuccess: true,
    data: [
      {
        deviceId: "online-device", typeId: "gateway", iotEdgeRuntime: "Connected",
        deviceMetadata: {
          serialNumber: { value: "SN-123" },
          enabled: { value: false },
          counter: { value: 0 },
        },
      },
      { deviceId: "offline-device", iotEdgeRuntime: "Disconnected", deviceMetadata: {} },
    ],
  }),
}));

vi.mock("@/features/PlatformTypes/useDeviceMetadataFields", () => ({
  default: () => ({ fields: [] }),
}));

vi.mock("../DeviceManageDialog", () => ({
  default: () => null,
  DeleteDeviceDialog: () => null,
}));

function LocationProbe() {
  return <span data-testid="location">{useLocation().pathname}</span>;
}

function renderDeviceTable() {
  const view = render(<MemoryRouter initialEntries={["/devices"]}><DeviceList /><LocationProbe /></MemoryRouter>);
  return { ...within(view.getByRole("table")), location: view.getByTestId("location") };
}

describe("Devices status filters", () => {
  it("updates badge colours and device rows when selecting and toggling status filters", () => {
    const { getByRole } = render(<MemoryRouter><DeviceList /></MemoryRouter>);
    const all = getByRole("button", { name: "2 Devices" });
    const online = getByRole("button", { name: "1 Online" });
    const offline = getByRole("button", { name: "1 Offline" });
    const table = within(getByRole("table"));

    expect(all).toHaveAttribute("aria-pressed", "true");

    fireEvent.click(online);

    expect(online).toHaveAttribute("aria-pressed", "true");
    expect(online).toHaveClass("bg-green-50", "text-green-700");
    expect(all).toHaveAttribute("aria-pressed", "false");
    expect(table.getByText("online-device")).toBeInTheDocument();
    expect(table.queryByText("offline-device")).not.toBeInTheDocument();

    fireEvent.click(online);

    expect(all).toHaveAttribute("aria-pressed", "true");
    expect(online).toHaveAttribute("aria-pressed", "false");
    expect(online).not.toHaveClass("bg-green-50");
    expect(table.getByText("offline-device")).toBeInTheDocument();

    fireEvent.click(offline);

    expect(offline).toHaveAttribute("aria-pressed", "true");
    expect(offline).toHaveClass("bg-red-50", "text-red-700");
    expect(table.getByText("offline-device")).toBeInTheDocument();
    expect(table.queryByText("online-device")).not.toBeInTheDocument();

    fireEvent.click(all);

    expect(all).toHaveAttribute("aria-pressed", "true");
    expect(offline).toHaveAttribute("aria-pressed", "false");
    expect(offline).not.toHaveClass("bg-red-50");
    expect(table.getByText("online-device")).toBeInTheDocument();
    expect(table.getByText("offline-device")).toBeInTheDocument();
  });
});

describe("Device row expansion", () => {
  beforeEach(() => {
    getEndpoints.mockReset();
    getEndpoints.mockReturnValue({
      data: [{
        endpoint_id: "endpoint-1",
        type_label: "PLC",
        endpoint_data: { ip_address: { value: "192.168.10.5" } },
      }],
      isLoading: false,
      isError: false,
    });
  });

  it("loads endpoints only for expanded rows and hides details on collapse", () => {
    const { getByRole, queryByRole, location } = renderDeviceTable();

    expect(getEndpoints).not.toHaveBeenCalled();
    expect(queryByRole("region", { name: "Device information" })).not.toBeInTheDocument();

    fireEvent.click(getByRole("button", { name: "Expand online-device" }));

    expect(getEndpoints).toHaveBeenCalledWith({ deviceId: "online-device" });
    expect(getEndpoints).not.toHaveBeenCalledWith({ deviceId: "offline-device" });
    expect(getByRole("button", { name: "Collapse online-device" })).toHaveAttribute("aria-expanded", "true");
    const information = within(getByRole("region", { name: "Device information" }));
    for (const value of ["online-device", "gateway", "serialNumber", "SN-123", "No", "0"]) {
      expect(information.getByText(value)).toBeInTheDocument();
    }
    expect(within(getByRole("region", { name: "Device endpoints" })).getByText("192.168.10.5")).toBeInTheDocument();
    expect(location).toHaveTextContent("/devices");

    fireEvent.click(getByRole("button", { name: "Collapse online-device" }));

    expect(queryByRole("region", { name: "Device endpoints" })).not.toBeInTheDocument();
    expect(getByRole("button", { name: "Expand online-device" })).toHaveAttribute("aria-expanded", "false");
  });

  it("expands devices independently and preserves row navigation", () => {
    const { getByRole, getAllByRole, getByText, location } = renderDeviceTable();

    fireEvent.click(getByRole("button", { name: "Expand online-device" }));
    fireEvent.click(getByRole("button", { name: "Expand offline-device" }));

    expect(getAllByRole("region", { name: "Device information" })).toHaveLength(2);

    fireEvent.click(getByRole("button", { name: "Collapse online-device" }));

    expect(getByRole("button", { name: "Collapse offline-device" })).toHaveAttribute("aria-expanded", "true");
    expect(getAllByRole("region", { name: "Device information" })).toHaveLength(1);
    expect(location).toHaveTextContent("/devices");

    fireEvent.click(getByText("online-device"));

    expect(location).toHaveTextContent("/devices/online-device");
  });

  it("opens the selected device's Assets page from a table row without expanding it", () => {
    const { getByRole, location } = renderDeviceTable();

    const assets = getByRole("button", { name: "View assets for online-device" });
    expect(assets.closest("td")).toHaveClass("sticky", "right-0");
    fireEvent.click(assets);

    expect(location.textContent).toBe("/devices/online-device/assets");
    expect(getEndpoints).not.toHaveBeenCalled();
    expect(getByRole("button", { name: "Expand online-device" })).toHaveAttribute("aria-expanded", "false");
  });

  it("opens the selected device's Assets page from a mobile card", () => {
    const view = render(<MemoryRouter initialEntries={["/devices"]}><DeviceList /><LocationProbe /></MemoryRouter>);
    const cards = within(view.getByRole("region", { name: "Device cards" }));

    const assets = cards.getByRole("button", { name: "View assets for offline-device" });
    expect(assets).toHaveClass("h-8", "w-8", "shrink-0");
    expect(assets.parentElement).toHaveClass("grid", "grid-cols-[auto_minmax(0,1fr)_auto]");
    expect(assets).toHaveAttribute("title", "View device assets");
    fireEvent.click(assets);

    expect(view.getByTestId("location").textContent).toBe("/devices/offline-device/assets");
    expect(getEndpoints).not.toHaveBeenCalled();
  });

  it("keeps device information visible while endpoints load", () => {
    getEndpoints.mockReturnValue({ isLoading: true, isError: false });
    const { getByRole } = renderDeviceTable();

    fireEvent.click(getByRole("button", { name: "Expand online-device" }));

    expect(getByRole("region", { name: "Device information" })).toBeInTheDocument();
    expect(getByRole("status")).toHaveTextContent("Loading endpoints...");
  });

  it("shows an empty state when a device has no endpoints", () => {
    getEndpoints.mockReturnValue({ data: [], isLoading: false, isError: false });
    const { getByRole } = renderDeviceTable();

    fireEvent.click(getByRole("button", { name: "Expand online-device" }));

    expect(getByRole("region", { name: "Device endpoints" })).toHaveTextContent("No endpoints configured.");
  });

  it("shows endpoint read errors and allows retrying", () => {
    const refetch = vi.fn();
    getEndpoints.mockReturnValue({ isLoading: false, isError: true, error: new Error("Forbidden"), refetch });
    const { getByRole } = renderDeviceTable();

    fireEvent.click(getByRole("button", { name: "Expand online-device" }));

    expect(getByRole("alert")).toHaveTextContent("Could not load endpoints: Forbidden");
    fireEvent.click(getByRole("button", { name: "Retry" }));
    expect(refetch).toHaveBeenCalledOnce();
  });

  it("expands device details in the mobile cards", () => {
    const view = render(<MemoryRouter><DeviceList /></MemoryRouter>);
    const cards = within(view.getByRole("region", { name: "Device cards" }));

    expect(getEndpoints).not.toHaveBeenCalled();
    fireEvent.click(cards.getByRole("button", { name: "Expand online-device" }));

    expect(getEndpoints).toHaveBeenCalledWith({ deviceId: "online-device" });
    expect(cards.getByRole("region", { name: "Device endpoints" })).toHaveTextContent("192.168.10.5");

    fireEvent.click(cards.getByRole("button", { name: "Collapse online-device" }));
    expect(cards.queryByRole("region", { name: "Device endpoints" })).not.toBeInTheDocument();
  });
});