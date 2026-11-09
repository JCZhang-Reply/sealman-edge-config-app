import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/auth";
import { edgeConfigApi } from "@/api/edgeConfig/edgeConfigApi";
import { PERMISSION_KEYS } from "./permission-keys";
import type { UsePermissionsOutput } from "./use-permissions";

export function useDeviceCreatePermission(): UsePermissionsOutput {
  const auth = useAuth();
  const { data, isLoading, isError, error } = useQuery<{ permissions: string[] }>({
    queryKey: ["permissions", "device-create", auth.user?.iss, auth.user?.sub],
    queryFn: ({ signal }) => edgeConfigApi.getDeviceCreatePermissions(signal),
    enabled: auth.isAuthenticated,
    gcTime: 0,
  });

  const hasPermission = !isError && (data?.permissions?.includes(PERMISSION_KEYS.DEVICE_CREATE) ?? false);
  return { hasPermission, isLoading, isError, error };
}