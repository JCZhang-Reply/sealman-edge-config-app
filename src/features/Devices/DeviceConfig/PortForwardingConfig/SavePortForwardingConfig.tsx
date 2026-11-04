import { Button } from "@/components/ui/button";
import { WaterLoader } from "@/components/ui/water-loader";
import { withPermissionRequiredTooltip } from "@/features/authorization/permissions/withPermissionRequiredTooltip";
import { PERMISSION_KEYS } from "@/features/authorization/permissions/permission-keys";
import { usePortForwardingConfig } from "./useContext";
import { useSavePortForwardingConfig } from "./useSavePortForwardingConfig";
import { toast } from "react-toastify";

const GuardedButton = withPermissionRequiredTooltip(Button);

export default function SavePortForwardingConfig({
  deviceId,
}: {
  deviceId: string;
}) {
  const { config } = usePortForwardingConfig();
  const mutation = useSavePortForwardingConfig();

  if (!config) return null;

  return (
    <GuardedButton
      deviceId={deviceId}
      permissionKey={PERMISSION_KEYS.DEVICE_NETWORK_WRITE}
      disabled={mutation.isPending}
      onClick={() =>
        mutation.mutate(
          {
            params: {
              path: {
                device: deviceId,
              },
            },
            body: {
              rules:
                config.rules
                  ?.filter(
                    (r) =>
                      r.srcPort !== undefined &&
                      r.destPort !== undefined &&
                      r.destAddr &&
                      r.name.trim() !== ""
                  )
                  .map((r) => ({
                    name: r.name,
                    interface: r.interface as "lan1" | "lan2" | "lan3",
                    srcPort: r.srcPort!,
                    destAddr: r.destAddr!,
                    destPort: r.destPort!,
                  })) ?? null,
            },
          },
          {
            onSuccess: () => toast.success("Configuration saved"),
            onError: () => toast.error("Could not save the configuration"),
          }
        )
      }
    >
      {mutation.isPending && <WaterLoader />}
      Save
    </GuardedButton>
  );
}
