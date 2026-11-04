import { WaterLoader } from "@/components/ui/water-loader";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { getErrorMessage } from "@/lib/errors";
import { edgeConfigApi } from "@/api/edgeConfig/edgeConfigApi";
import { CMD_PROXY_MODULE_NAME } from "@/api/edgeConfig/moduleNames";
import { Button } from "@/components/ui/button";
import { withPermissionAndModuleRequiredTooltip } from "@/features/authorization/permissions/withPermissionAndModuleRequiredTooltip";
import { PERMISSION_KEYS } from "@/features/authorization/permissions/permission-keys";

const PermissionAndModuleGuardedButton = withPermissionAndModuleRequiredTooltip(Button);

interface ActivateConfigButtonProps {
  /** True while a saved setting is waiting to be activated on the device. */
  hasPendingChanges: boolean;
}

export function ActivateConfigButton({ hasPendingChanges }: ActivateConfigButtonProps) {
  const { deviceId } = useParams();
  const queryClient = useQueryClient();

  const { mutate, isPending } = useMutation({
    mutationFn: async () => {
      let resp = await edgeConfigApi.getDeviceCmdStatus(deviceId);

      if (resp.moduleStatus === "Disconnected") {
        toast.warning(`This action requires a connected '${CMD_PROXY_MODULE_NAME}' module. Check Applications.`);
        resp.showSuccess = false;
      } else {
        resp = await edgeConfigApi.postDeviceCmdSmartemsCheck(deviceId);
        resp.showSuccess = true;
      }
      return resp;
    },

    onError: (error: unknown) => {
      toast.error(`Could not activate the config: ${getErrorMessage(error)}`);
    },

    onSuccess: (resp: any) => {
      if (resp.showSuccess) {
        toast.success("Config activation started. See Activity for the result.");
        queryClient.invalidateQueries({ queryKey: ["getSmartEmsStatus", deviceId] });
      }
    },
  });

  return (
    <PermissionAndModuleGuardedButton
      deviceId={deviceId}
      permissionKey={PERMISSION_KEYS.DEVICE_READ}
      requiredModuleName={CMD_PROXY_MODULE_NAME}
      disabled={isPending || !hasPendingChanges}
      onClick={() => mutate()}
    >
      {isPending && <WaterLoader />}
      Activate Config
    </PermissionAndModuleGuardedButton>
  );
}
