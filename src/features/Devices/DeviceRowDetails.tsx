import type { DeviceData } from "@/api/edgeConfig/edgeConfigApiHooks";
import useGetEndpoints from "@/generated/edge-administration/hooks/endpoints/useGetEndpoints";
import { getErrorMessage } from "@/lib/errors";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

function displayValue(value: unknown): string {
  if (value === null || value === undefined || value === "") return "Not set";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  return typeof value === "object" ? JSON.stringify(value) : String(value);
}

function InformationFields({ fields }: { fields: Record<string, { value?: unknown }> }) {
  return Object.entries(fields).map(([key, field]) => (
    <div key={key} className="grid min-w-0 grid-cols-2 gap-3 py-1.5 text-sm">
      <dt className="min-w-0 wrap-anywhere text-muted-foreground">{key}</dt>
      <dd className="min-w-0 wrap-anywhere">{displayValue(field.value)}</dd>
    </div>
  ));
}

export default function DeviceRowDetails({ device }: { device: DeviceData }) {
  const { data: endpoints, isLoading, isError, error, refetch } = useGetEndpoints({ deviceId: device.deviceId });

  return (
    <div className="grid min-w-0 gap-6 p-4 md:grid-cols-2 md:p-6">
      <section className="min-w-0" aria-label="Device information">
        <h2 className="mb-3 text-sm font-semibold">Device information</h2>
        <dl className="divide-y">
          <InformationFields fields={{
            "Device ID": { value: device.deviceId },
            "Device type": { value: device.typeId },
            "Edge runtime": { value: device.iotEdgeRuntime },
            ...(device.deviceMetadata ?? {}),
          }} />
        </dl>
      </section>
      <section className="min-w-0" aria-label="Device endpoints">
        <h2 className="mb-3 text-sm font-semibold">Endpoints{endpoints ? ` (${endpoints.length})` : ""}</h2>
        {isLoading ? (
          <p role="status" className="text-sm text-muted-foreground">Loading endpoints...</p>
        ) : isError ? (
          <div role="alert" className="space-y-2">
            <p className="wrap-anywhere text-sm text-destructive">Could not load endpoints: {getErrorMessage(error)}</p>
            <Button type="button" variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw aria-hidden="true" />
              Retry
            </Button>
          </div>
        ) : endpoints?.length ? (
          <ul className="divide-y">
            {endpoints.map((endpoint) => (
              <li key={endpoint.endpoint_id} className="min-w-0 py-3 first:pt-0">
                <h3 className="wrap-anywhere text-sm font-medium">{endpoint.type_label}</h3>
                <p className="mt-0.5 break-all text-xs text-muted-foreground">{endpoint.endpoint_id}</p>
                <dl className="mt-2">
                  <InformationFields fields={endpoint.endpoint_data} />
                </dl>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">No endpoints configured.</p>
        )}
      </section>
    </div>
  );
}