import { Cloud, Cpu, Router, ShieldCheck } from "lucide-react";
import type { ComponentType } from "react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { components } from "@/generated/edge-administration/types";
import { getErrorMessage } from "@/lib/errors";

type DeviceDetailConnectionStatus = components["schemas"]["DeviceDetailConnectionStatus"];

interface DeviceHeaderProps {
  deviceId?: string;
  connectionStatus?: DeviceDetailConnectionStatus;
  customer?: unknown;
  connectedMachines?: string[];
  isLoading: boolean;
  isError: boolean;
  error?: unknown;
}

interface StatusIconProps {
  label: string;
  state?: string;
  icon: ComponentType<{ className?: string }>;
}

function StatusIcon({ label, state, icon: Icon }: StatusIconProps) {
  const connected = state === "Connected";
  const text = `${label}: ${connected ? "Connected" : "Disconnected"}`;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          role="img"
          aria-label={text}
          className={`flex h-7 w-7 items-center justify-center rounded border ${
            connected
              ? "border-green-200 bg-green-50 text-green-600"
              : "border-red-200 bg-red-50 text-red-600"
          }`}
        >
          <Icon className="h-4 w-4" />
        </span>
      </TooltipTrigger>
      <TooltipContent>{text}</TooltipContent>
    </Tooltip>
  );
}

type HeaderState = "online" | "offline" | "partial" | "unknown";

function overallState(status?: DeviceDetailConnectionStatus): HeaderState {
  if (!status) return "unknown";
  const states = [status.iotEdgeRuntime, status.iotHub, status.sems];
  if (states.every((s) => s === "Connected")) return "online";
  if (states.every((s) => s === "Disconnected")) return "offline";
  return "partial";
}

const STATE_STYLE: Record<HeaderState, { label: string; tint: string; dot: string; chip: string; sweep: string }> = {
  online: {
    label: "Online",
    tint: "from-green-50 via-transparent",
    dot: "bg-green-500",
    chip: "border-green-200 bg-green-50 text-green-700",
    sweep: "via-green-300/30",
  },
  offline: {
    label: "Offline",
    tint: "from-red-50 via-transparent",
    dot: "bg-red-500",
    chip: "border-red-200 bg-red-50 text-red-700",
    sweep: "",
  },
  partial: {
    label: "Degraded",
    tint: "from-yellow-50 via-transparent",
    dot: "bg-yellow-500",
    chip: "border-yellow-200 bg-yellow-50 text-yellow-700",
    sweep: "",
  },
  unknown: {
    label: "Unknown",
    tint: "from-slate-50 via-transparent",
    dot: "bg-slate-400",
    chip: "border-slate-200 bg-slate-50 text-slate-600",
    sweep: "",
  },
};

function StatusOrb({ state }: { state: HeaderState }) {
  const { dot } = STATE_STYLE[state];
  return (
    <span className="relative flex h-3 w-3 shrink-0" aria-hidden="true">
      {state === "online" && (
        <span className={`absolute inline-flex h-full w-full rounded-full ${dot} opacity-60 motion-safe:animate-ping`} />
      )}
      <span
        className={`relative inline-flex h-3 w-3 rounded-full ${dot} ${
          state === "offline" || state === "partial" ? "motion-safe:animate-breathe" : ""
        }`}
      />
    </span>
  );
}

export default function DeviceHeader({ deviceId, connectionStatus, customer, connectedMachines = [], isLoading, isError, error }: DeviceHeaderProps) {
  const state = overallState(connectionStatus);
  const style = STATE_STYLE[state];
  const customerText = customer == null || customer === "" ? "-" : String(customer);
  const connectedText = connectedMachines.length ? connectedMachines.join(", ") : "-";

  return (
    <div className={`flex flex-wrap items-center justify-between gap-x-6 gap-y-3 overflow-hidden rounded-md border border-l-4 bg-white px-4 py-3 ${
      state === "online" ? "border-l-green-600" : state === "offline" ? "border-l-red-600" : state === "partial" ? "border-l-amber-500" : "border-l-slate-400"
    }`}>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Device</p>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="truncate text-lg font-semibold leading-6">{deviceId}</h1>
          {!isLoading && (
            <span
              className={`inline-flex shrink-0 items-center gap-2 rounded border px-2.5 py-1 text-[11px] font-semibold ${style.chip}`}
            >
              <StatusOrb state={state} />
              {style.label}
            </span>
          )}
        </div>
        <dl className="mt-2 flex flex-wrap gap-x-7 gap-y-1 text-xs">
          <div className="flex items-baseline gap-1.5">
            <dt className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Customer</dt>
            <dd className="font-medium text-slate-800">{customerText}</dd>
          </div>
          <div className="flex min-w-0 items-baseline gap-1.5">
            <dt className="shrink-0 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Connected machines</dt>
            <dd className="min-w-0 font-medium text-slate-800">{connectedText}</dd>
          </div>
        </dl>
      </div>

      {isLoading && <div className="h-7 w-32 animate-pulse rounded bg-slate-200" />}

      {isError && <p className="text-sm text-destructive">Could not load the device: {getErrorMessage(error)}</p>}

      {connectionStatus && (
        <TooltipProvider delayDuration={100}>
          <div className="flex shrink-0 items-center gap-2">
            <StatusIcon label="IoT-Edge Runtime" state={connectionStatus.iotEdgeRuntime} icon={Cpu} />
            <StatusIcon label="IoT-Hub" state={connectionStatus.iotHub} icon={Cloud} />
            <StatusIcon label="Smart-EMS" state={connectionStatus.sems} icon={Router} />
            {connectionStatus.vpn !== undefined && (
              <StatusIcon label="VPN" state={connectionStatus.vpn ?? undefined} icon={ShieldCheck} />
            )}
          </div>
        </TooltipProvider>
      )}
    </div>
  );
}
