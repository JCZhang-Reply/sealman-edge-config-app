import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import DeviceManageDialog, { DeleteDeviceButton } from "./DeviceManageDialog";
import { usePermissions } from "@/features/authorization/permissions/use-permissions";
import { useDeviceCreatePermission } from "@/features/authorization/permissions/use-device-create-permission";

vi.mock("@/features/authorization/permissions/use-device-create-permission", () => ({
  useDeviceCreatePermission: vi.fn(),
}));

vi.mock("@/features/authorization/permissions/use-permissions", () => ({
  usePermissions: vi.fn(),
}));
vi.mock("@tanstack/react-query", () => ({
  useQueryClient: () => ({ invalidateQueries: vi.fn() }),
}));
vi.mock("@/generated/edge-administration/hooks/device_types/useGetDeviceTypes", () => ({
  default: () => ({ data: [], refetch: vi.fn() }),
}));
vi.mock("@/api/edgeConfig/edgeConfigApi", () => ({ edgeConfigApi: {} }));

describe("device management permissions", () => {
  beforeEach(() => {
    vi.mocked(usePermissions).mockReset();
    vi.mocked(useDeviceCreatePermission).mockReset();
  });

  it.each([false, true])("only shows Add Device when create is granted: %s", (hasPermission) => {
    vi.mocked(useDeviceCreatePermission).mockReturnValue({ hasPermission });
    render(<DeviceManageDialog />);

    expect(useDeviceCreatePermission).toHaveBeenCalled();
    expect(usePermissions).not.toHaveBeenCalled();
    const button = screen.queryByRole("button", { name: "Add Device" });
    if (hasPermission) expect(button).toBeInTheDocument();
    else expect(button).not.toBeInTheDocument();
  });

  it.each([false, true])("only shows delete when granted for this device: %s", (hasPermission) => {
    vi.mocked(usePermissions).mockReturnValue({ hasPermission });
    render(<DeleteDeviceButton deviceId="device-123" onDelete={vi.fn()} />);

    expect(usePermissions).toHaveBeenCalledWith({ deviceId: "device-123", permissionKey: "device.delete" });
    const button = screen.queryByRole("button", { name: "Delete device device-123" });
    if (hasPermission) expect(button).toBeInTheDocument();
    else expect(button).not.toBeInTheDocument();
  });

  it("hides both actions while permissions are loading or unavailable", () => {
    vi.mocked(usePermissions).mockReturnValue({ hasPermission: false, isLoading: true });
    vi.mocked(useDeviceCreatePermission).mockReturnValue({ hasPermission: false, isLoading: true });
    const { rerender } = render(<><DeviceManageDialog /><DeleteDeviceButton deviceId="device-123" onDelete={vi.fn()} /></>);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();

    vi.mocked(usePermissions).mockReturnValue({ hasPermission: false, isError: true });
    vi.mocked(useDeviceCreatePermission).mockReturnValue({ hasPermission: false, isError: true });
    rerender(<><DeviceManageDialog /><DeleteDeviceButton deviceId="device-123" onDelete={vi.fn()} /></>);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});