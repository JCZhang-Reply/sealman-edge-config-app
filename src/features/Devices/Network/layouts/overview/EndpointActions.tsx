import type { ReactNode } from "react";
import { Plus, Search } from "lucide-react";
import { WaterLoader } from "@/components/ui/water-loader";
import { Button } from "@/components/ui/button";
import { withPermissionRequiredTooltip } from "@/features/authorization/permissions/withPermissionRequiredTooltip";
import { PERMISSION_KEYS } from "@/features/authorization/permissions/permission-keys";

const GuardedButton = withPermissionRequiredTooltip(Button);

interface props {
  deviceId: string;
  onScan: () => void;
  isScanning: boolean;
  scanDisabled?: boolean;
  /** False while the network scan is disabled platform-wide: the button is not offered at all then. */
  scanAvailable?: boolean;
  onAddEndpoint: () => void;
  /** Rendered before the buttons, e.g. the view toggle. */
  leading?: ReactNode;
}

/** "Scan Network" and "Add Endpoint" - the same actions in the list and the canvas view. */
export default function EndpointActions({ deviceId, onScan, isScanning, scanDisabled = false, scanAvailable = true, onAddEndpoint, leading }: props) {
  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      {leading}
      {scanAvailable && (
        <Button variant="outline" className="h-8 rounded-[5px] px-3 text-xs" onClick={onScan} disabled={isScanning || scanDisabled}>
          {isScanning ? <WaterLoader /> : <Search />}
          {isScanning ? "Scanning..." : "Scan Network"}
        </Button>
      )}
      <GuardedButton deviceId={deviceId} permissionKey={PERMISSION_KEYS.DEVICE_ENDPOINT_WRITE} className="h-8 rounded-[5px] px-3 text-xs" onClick={onAddEndpoint}>
        <Plus /> Add Endpoint
      </GuardedButton>
    </div>
  );
}
