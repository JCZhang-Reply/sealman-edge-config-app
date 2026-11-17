import { DeviceData } from "@/api/edgeConfig/edgeConfigApiHooks";
import { Table as TanstackTable } from "@tanstack/react-table";

export interface DeviceDataDisplay extends DeviceData {
  onlineStatusEdge: string;
}

export interface DeviceListProps {
  table: TanstackTable<DeviceDataDisplay>;
}

export interface DeviceCardsProps extends DeviceListProps {
  globalFilter: string;
  data: DeviceDataDisplay[];
  canCreate: boolean;
}
