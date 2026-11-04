import Badge, { BadgeColor } from "../../components/Typography/Badge";
import { useNavigate, useParams } from "react-router-dom";
import { DeviceCardsProps } from "./Devices.types";
import FilterDetails from "./FilterDetails";
import DebouncedInput from "@/components/Input/DebouncedInput";
import { useState } from "react";
import { ChevronRight } from "lucide-react";
import { ServerStackIcon } from "@heroicons/react/24/outline";
import { Button } from "@/components/ui/button";
import DeviceRowDetails from "./DeviceRowDetails";

export function DeviceCards({
  table,
  globalFilter,
  data,
}: DeviceCardsProps) {
  const navigate = useNavigate();
  const { deviceId } = useParams();
  const [expandedDeviceIds, setExpandedDeviceIds] = useState<Set<string>>(() => new Set());

  const deviceItems = table.getRowModel().rows.map((row) => {
    const device = row.original;
    const expanded = expandedDeviceIds.has(device.deviceId);
    return (
      <div
        key={device.deviceId}
        className={`rounded-lg border p-3 shadow-xs transition-colors ${deviceId === device.deviceId ? "border-blue-200 bg-blue-50" : "bg-background"}`}
      >
        <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            aria-label={`${expanded ? "Collapse" : "Expand"} ${device.deviceId}`}
            aria-expanded={expanded}
            aria-controls={`device-card-details-${encodeURIComponent(device.deviceId)}`}
            title={expanded ? "Collapse device details" : "Expand device details"}
            onClick={() => setExpandedDeviceIds((current) => {
              const next = new Set(current);
              if (next.has(device.deviceId)) next.delete(device.deviceId);
              else next.add(device.deviceId);
              return next;
            })}
          >
            <ChevronRight aria-hidden="true" className={`transition-transform ${expanded ? "rotate-90" : ""}`} />
          </Button>
          <div className="min-w-0 flex-1 cursor-pointer" onClick={() => navigate(`/devices/${device.deviceId}`)}>
            <div className="flex flex-row flex-wrap gap-1">
                <Badge color={device.deviceStatus === "Connected" ? BadgeColor.Green : BadgeColor.Red}>
                  {device.deviceStatus === "Connected" ? "online" : "offline"}
                </Badge>
              <Badge>{device.deviceMetadata.customer?.value as string}</Badge>
            </div>
            <div className="font-semibold truncate">{device.deviceId}</div>
            <div className="truncate text-sm text-muted-foreground">
              {device.deviceMetadata.description?.value as string}
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-8 w-8 shrink-0"
            aria-label={`View assets for ${device.deviceId}`}
            title="View device assets"
            onClick={() => navigate(`/devices/${encodeURIComponent(device.deviceId)}/assets`)}
          >
            <ServerStackIcon aria-hidden="true" />
          </Button>
        </div>
        {expanded && (
          <div id={`device-card-details-${encodeURIComponent(device.deviceId)}`} className="mt-3 border-t">
            <DeviceRowDetails device={device} />
          </div>
        )}
      </div>
    );
  });

  return (
    <section aria-label="Device cards" className="space-y-3 p-4">
      <div className="sticky top-0 z-10 space-y-2 rounded-lg border bg-background p-3 shadow-xs">
        <FilterDetails
          className="pb-2"
          totalRows={data.length}
          filteredRows={table.getRowModel().rows.length}
        />

        <DebouncedInput
          className="w-full"
          type="text"
          name="filter"
          value={globalFilter}
          onChange={(value) => table.setGlobalFilter(value as string)}
          placeholder="Search"
        />
      </div>
      {deviceItems}
    </section>
  );
}
