import Badge, { BadgeColor } from "../../components/Typography/Badge";
import { useNavigate, useParams } from "react-router-dom";
import { DeviceCardsProps } from "./Devices.types";
import FilterDetails from "./FilterDetails";
import DebouncedInput from "@/components/Input/DebouncedInput";
import DeviceManageDialog from "./DeviceManageDialog";

export function DeviceCards({
  table,
  globalFilter,
  data,
}: DeviceCardsProps) {
  const navigate = useNavigate();
  const { deviceId } = useParams();

  const deviceItems = table.getRowModel().rows.map((row) => {
    const device = row.original;
    return (
      <div
        key={device.deviceId}
        className={`cursor-pointer rounded-lg border p-3 shadow-xs transition-colors hover:bg-slate-50 ${deviceId === device.deviceId ? "border-blue-200 bg-blue-50" : "bg-background"}`}
      >
        <div className="flex flex-row items-center gap-4">
          <div onClick={() => navigate(`/devices/${device.deviceId}`)}>
            <div className="flex flex-row gap-1">
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
        </div>
      </div>
    );
  });

  return (
    <div className="space-y-3 p-4">
      <div className="sticky top-0 z-10 space-y-2 rounded-lg border bg-background p-3 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <FilterDetails
            totalRows={data.length}
            filteredRows={table.getRowModel().rows.length}
          />
          <DeviceManageDialog />
        </div>

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
    </div>
  );
}
