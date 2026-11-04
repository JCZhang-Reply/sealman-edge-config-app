import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import PlatformTypesSettings from "../PlatformTypesSettings";
import { PERMISSION_KEYS } from "@/features/authorization/permissions/permission-keys";

const { permissions } = vi.hoisted(() => ({ permissions: new Set<string>() }));

vi.mock("@/features/authorization/permissions/use-permissions", () => ({
  usePermissions: ({ permissionKey }: { permissionKey: string }) => ({
    hasPermission: permissions.has(permissionKey),
  }),
}));
vi.mock("@/features/Extensions/outlets/useOutletUser", () => ({ useOutletUser: () => null }));
vi.mock("@/features/Extensions/outlets/ExtensionOutlet", () => ({ default: () => null }));
vi.mock("@/features/PlatformTypes/DeviceTableColumnsCard", () => ({ default: () => null }));
vi.mock("@/features/PlatformTypes/DefaultScanPortsCard", () => ({ default: () => null }));
vi.mock("@/features/PlatformTypes/TypesManager", () => ({
  default: ({ title, canWrite = true }: { title: string; canWrite?: boolean }) => (
    <section aria-label={title}><button disabled={!canWrite}>Add {title}</button></section>
  ),
}));
vi.mock("@/generated/edge-administration/hooks/device_types/useGetDeviceTypes", () => ({ default: () => ({ data: [] }) }));
vi.mock("@/generated/edge-administration/hooks/device_types/usePostDeviceType", () => ({ usePostDeviceType: () => ({}) }));
vi.mock("@/generated/edge-administration/hooks/device_types/useUpdateDeviceType", () => ({ useUpdateDeviceType: () => ({}) }));
vi.mock("@/generated/edge-administration/hooks/device_types/useDeleteDeviceType", () => ({ useDeleteDeviceType: () => ({}) }));
vi.mock("@/generated/edge-administration/hooks/endpoint_types/useGetEndpointTypes", () => ({ default: () => ({ data: [] }) }));
vi.mock("@/generated/edge-administration/hooks/endpoint_types/usePostEndpointType", () => ({ usePostEndpointType: () => ({}) }));
vi.mock("@/generated/edge-administration/hooks/endpoint_types/useUpdateEndpointType", () => ({ useUpdateEndpointType: () => ({}) }));
vi.mock("@/generated/edge-administration/hooks/endpoint_types/useDeleteEndpointType", () => ({ useDeleteEndpointType: () => ({}) }));
vi.mock("@/generated/edge-administration/hooks/service_types/useGetServiceTypes", () => ({ default: () => ({ data: [] }) }));
vi.mock("@/generated/edge-administration/hooks/service_types/usePostServiceType", () => ({ usePostServiceType: () => ({}) }));
vi.mock("@/generated/edge-administration/hooks/service_types/useUpdateServiceType", () => ({ useUpdateServiceType: () => ({}) }));
vi.mock("@/generated/edge-administration/hooks/service_types/useDeleteServiceType", () => ({ useDeleteServiceType: () => ({}) }));
vi.mock("@/lib/browserRegistry", () => ({ listRegisteredBrowsers: () => [] }));

describe("PlatformTypesSettings permissions", () => {
  it.each([false, true])("hides endpoint and service cards without read permission even when write is %s", (canWrite) => {
    permissions.clear();
    if (canWrite) permissions.add(PERMISSION_KEYS.DEVICE_ENDPOINT_WRITE);
    render(<PlatformTypesSettings />);

    expect(screen.queryByRole("region", { name: "Endpoint Types" })).not.toBeInTheDocument();
    expect(screen.queryByRole("region", { name: "Service Types" })).not.toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Device Types" })).toBeInTheDocument();
  });

  it.each([false, true])("shows both cards with read permission and write access %s", (canWrite) => {
    permissions.clear();
    permissions.add(PERMISSION_KEYS.DEVICE_ENDPOINT_READ);
    if (canWrite) permissions.add(PERMISSION_KEYS.DEVICE_ENDPOINT_WRITE);
    render(<PlatformTypesSettings />);

    for (const title of ["Endpoint Types", "Service Types"]) {
      expect(screen.getByRole("region", { name: title })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: `Add ${title}` })).toHaveProperty("disabled", !canWrite);
    }
  });
});