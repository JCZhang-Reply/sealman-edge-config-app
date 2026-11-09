import useGetModuleTwinConfig from "@/generated/edge-administration/hooks/useGetModuleTwinConfig";
import { NetworkDiscoverTwinConfig } from "@/api/edgeConfig/networkDiscover/networkDiscoverInterfaces";
import { NETWORK_DISCOVER_MODULE_NAME } from "@/api/edgeConfig/moduleNames";
import { ApiError } from "@/generated/edge-administration/api";
import { useEffect , useState } from "react";
import { useNetworkPageStore, useScanDefinitionStore, useTwinConfigStore } from "./stores";
import { NetworkMainLayout } from "@/features/Devices/Network/layouts";
import { loadNetworkMeta , isMetaLoaded } from "./api/networkMeta"
import { MissingModulePanel } from "./MissingModulePanel";

interface props {
  deviceId: string
}

function isModuleNotDeployedError(error: unknown): error is ApiError {
  return error instanceof ApiError && error.statusCode === 404;
}

export default function Page({ deviceId }: props) {
  const setDeviceId = useNetworkPageStore(s => s.setDeviceId)
  const setTwinConfigState = useTwinConfigStore(s => s.setTwinConfigState)
  const setScanDefinition = useScanDefinitionStore(s => s.setScanDefinition)
  const [metaReady, setMetaReady] = useState(isMetaLoaded());
  const [_metaError, setMetaError] = useState<string | null>(null);
  const [dismissedModuleDeviceId, setDismissedModuleDeviceId] = useState<string | null>(null);

  if (!deviceId) {
    throw Error("NO DEVICE ID")
  }

  setDeviceId(deviceId)

  const { data, isError, error } = useGetModuleTwinConfig(deviceId, NETWORK_DISCOVER_MODULE_NAME)
  const isMissingRequiredModule = isError && isModuleNotDeployedError(error)

  useEffect(() => {
  async function bootstrap() {
    try {
      if (!isMetaLoaded()) {
        await loadNetworkMeta();
      }
      setMetaReady(true);
    } catch (err) {
      setMetaError("Failed to load network configuration.");
      setMetaReady(true);
    }
  }

  bootstrap();
}, []);


useEffect(() => {
  if (!metaReady || !data) return;

  const typedData = data as unknown as NetworkDiscoverTwinConfig;

  setTwinConfigState(typedData);
  setScanDefinition(typedData.scanDefinition);
}, [metaReady, data]);

  useEffect(() => {
    return () => {
      useTwinConfigStore.setState(useTwinConfigStore.getInitialState())
      useScanDefinitionStore.setState(useScanDefinitionStore.getInitialState())
    }
  }, [])

  if (isMissingRequiredModule && dismissedModuleDeviceId !== deviceId) {
    return (
      <MissingModulePanel
        moduleName={NETWORK_DISCOVER_MODULE_NAME}
        onDismiss={() => setDismissedModuleDeviceId(deviceId)}
      />
    )
  }

  // Render immediately rather than blocking on the twin config / network meta fetches -
  // Overview (the default view) doesn't need either, and legacy views that do (the sidebar's
  // status switch, the endpoint sidebar's "Configure network scan" sheet, etc.) update
  // reactively once their data arrives.
  return <NetworkMainLayout />
}
