import { CircleHelp } from "lucide-react";
import { Accordion } from "@/components/ui/accordion";
import EndpointAccordionItem from "./EndpointAccordionItem";
import { MappedEndpoint } from "@/generated/edge-administration/hooks/network/usePostNetworkOverview";
import { endpointListKey } from "./overviewMerge";

interface props {
  endpoints: MappedEndpoint[];
  deviceId: string;
  onEndpointCreated: () => void;
}

export default function UnidentifiedEndpointsCard({ endpoints, deviceId, onEndpointCreated }: props) {
  if (endpoints.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3 px-3">
      <div className="flex flex-wrap items-start justify-between gap-4 border-t border-orange-200 pt-3.5">
        <div className="min-w-0">
          <span className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-orange-700">
            <CircleHelp className="h-3.5 w-3.5" /> Unidentified Endpoints
          </span>
          <p className="mt-0.75 text-xs text-muted-foreground">
            Devices discovered on the network that haven&apos;t been identified yet. Assign them a type.
          </p>
        </div>
      </div>

      <div>
        <Accordion type="single" collapsible className="w-full">
          {endpoints.map((endpoint) => (
            <EndpointAccordionItem
              key={endpointListKey(endpoint)}
              endpoint={endpoint}
              deviceId={deviceId}
              onCreated={onEndpointCreated}
              onOpenDetails={() => {}}
              onOpenServiceDetails={() => {}}
            />
          ))}
        </Accordion>
      </div>
    </div>
  );
}
