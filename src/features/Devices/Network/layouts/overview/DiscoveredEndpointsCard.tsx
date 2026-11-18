import type { ReactNode } from "react";
import { Accordion } from "@/components/ui/accordion";
import EndpointAccordionItem from "./EndpointAccordionItem";
import EndpointActions from "./EndpointActions";
import { MappedEndpoint } from "@/generated/edge-administration/hooks/network/usePostNetworkOverview";
import { endpointListKey } from "./overviewMerge";

interface props {
  endpoints: MappedEndpoint[];
  deviceId: string;
  onScan: () => void;
  isScanning: boolean;
  scanDisabled?: boolean;
  scanAvailable?: boolean;
  onAddEndpoint: () => void;
  onEndpointCreated: () => void;
  onOpenDetails: (endpointId: string) => void;
  onOpenServiceDetails: (serviceId: string) => void;
  viewToggle?: ReactNode;
  // The endpoint to scroll to and flash (e.g. when arriving from the device search).
  highlightedEndpointId?: string | null;
  onHighlightDone?: () => void;
}

export default function DiscoveredEndpointsCard({
  endpoints,
  deviceId,
  onScan,
  isScanning,
  scanDisabled,
  scanAvailable,
  onAddEndpoint,
  onEndpointCreated,
  onOpenDetails,
  onOpenServiceDetails,
  viewToggle,
  highlightedEndpointId,
  onHighlightDone,
}: props) {
  return (
    <div className="space-y-3 px-3">
      <div className="flex flex-wrap items-start justify-between gap-4 border-t border-slate-100 pt-3.5">
        <div className="min-w-0">
          <span className="block text-[10px] font-semibold uppercase tracking-wider text-blue-700">Endpoints</span>
          <p className="mt-[3px] text-xs text-muted-foreground">
            Physical machines and systems discovered on the network. Expand each endpoint to view its services.
          </p>
        </div>
        <EndpointActions deviceId={deviceId} onScan={onScan} isScanning={isScanning} scanDisabled={scanDisabled} scanAvailable={scanAvailable} onAddEndpoint={onAddEndpoint} leading={viewToggle} />
      </div>

      <div>
        {endpoints.length === 0 ? (
          <div className="rounded-md border border-dashed border-slate-300 bg-white px-4 py-8 text-center">
            <p className="text-sm font-medium text-slate-800">No endpoints discovered yet</p>
            <p className="mt-1 text-sm text-muted-foreground">Scan the network or add an endpoint to start modelling this device.</p>
          </div>
        ) : (
          <Accordion type="single" collapsible className="w-full">
            {endpoints.map((endpoint) => (
              <EndpointAccordionItem
                key={endpointListKey(endpoint)}
                endpoint={endpoint}
                deviceId={deviceId}
                onCreated={onEndpointCreated}
                onOpenDetails={onOpenDetails}
                onOpenServiceDetails={onOpenServiceDetails}
                highlighted={endpoint.endpoint_id != null && endpoint.endpoint_id === highlightedEndpointId}
                onHighlightDone={onHighlightDone}
              />
            ))}
          </Accordion>
        )}
      </div>
    </div>
  );
}
