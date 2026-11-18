import { useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import { AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronDown, HelpCircle, Pencil, Plus, Server, Trash2 } from "lucide-react";
import { EndpointStatus } from "@/features/Devices/Network/components";
import { MappedEndpoint, MappedPort } from "@/generated/edge-administration/hooks/network/usePostNetworkOverview";
import { EndpointDialogs, EndpointPrimaryAction, PortActions, } from "./endpointShared";
import { BrowseTarget, portNeedsAssignment, useEndpointDisplay } from "./endpointLogic";
import { endpointListKey, portListKey } from "./overviewMerge";
import { useShowConnectionState } from "./connectionStateContext";
import { validateFields } from "@/features/PlatformTypes/FieldValueInput";
import InlineMetadataField from "./InlineMetadataField";
import InlineCustomFieldAdder from "./InlineCustomFieldAdder";
import useGetEndpointTypes from "@/generated/edge-administration/hooks/endpoint_types/useGetEndpointTypes";
import useGetServiceTypes from "@/generated/edge-administration/hooks/service_types/useGetServiceTypes";
import { useUpdateEndpoint } from "@/generated/edge-administration/hooks/endpoints/useUpdateEndpoint";
import { useUpdateService } from "@/generated/edge-administration/hooks/services/useUpdateService";
import { useDeleteEndpoint } from "@/generated/edge-administration/hooks/endpoints/useDeleteEndpoint";
import { useDeleteService } from "@/generated/edge-administration/hooks/services/useDeleteService";
import { withPermissionRequiredTooltip } from "@/features/authorization/permissions/withPermissionRequiredTooltip";
import { PERMISSION_KEYS } from "@/features/authorization/permissions/permission-keys";
import AssignServiceDialog from "./AssignServiceDialog";
import ConfirmDeleteDialog from "./ConfirmDeleteDialog";

interface props {
  endpoint: MappedEndpoint;
  deviceId: string;
  onCreated: () => void;
  onOpenDetails: (endpointId: string) => void;
  onOpenServiceDetails: (serviceId: string) => void;
  highlighted?: boolean;
  onHighlightDone?: () => void;
}

const HIGHLIGHT_DURATION_MS = 4000;
const GuardedButton = withPermissionRequiredTooltip(Button);

function readValues(data: Record<string, { value?: unknown }> | null | undefined): Record<string, unknown> {
  return Object.fromEntries(Object.entries(data ?? {}).map(([key, resolved]) => [key, resolved.value ?? null]));
}

export default function EndpointAccordionItem({ endpoint, deviceId, onCreated, onOpenDetails, onOpenServiceDetails, highlighted = false, onHighlightDone }: props) {
  const display = useEndpointDisplay(endpoint);
  const showState = useShowConnectionState();
  const { data: endpointTypes } = useGetEndpointTypes();
  const { data: serviceTypes } = useGetServiceTypes();
  const { updateEndpoint, isPending: isSavingEndpoint } = useUpdateEndpoint();
  const { updateService, isPending: isSavingService } = useUpdateService();
  const { deleteEndpoint, isPending: isDeletingEndpoint } = useDeleteEndpoint();
  const { deleteService, isPending: isDeletingService } = useDeleteService();
  const { needsAssignment, isConfigured } = display;
  const [assignEndpointOpen, setAssignEndpointOpen] = useState(false);
  const [assignPort, setAssignPort] = useState<MappedPort | null>(null);
  const [browsing, setBrowsing] = useState<BrowseTarget | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [activePortKey, setActivePortKey] = useState<string | null>(null);
  const [editingEndpoint, setEditingEndpoint] = useState(false);
  const [endpointValues, setEndpointValues] = useState<Record<string, unknown>>({});
  const [deletedEndpointKeys, setDeletedEndpointKeys] = useState<Set<string>>(new Set());
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [serviceValues, setServiceValues] = useState<Record<string, unknown>>({});
  const [deletedServiceKeys, setDeletedServiceKeys] = useState<Set<string>>(new Set());
  const [addServiceOpen, setAddServiceOpen] = useState(false);
  const [deleteEndpointOpen, setDeleteEndpointOpen] = useState(false);
  const [deleteServiceOpen, setDeleteServiceOpen] = useState(false);
  const rowRef = useRef<HTMLDivElement>(null);
  const onHighlightDoneRef = useRef(onHighlightDone);
  const activePort = endpoint.ports.find((port) => portListKey(port) === activePortKey) ?? endpoint.ports[0];
  const endpointType = endpointTypes?.find((type) => type.type_id === endpoint.type_id);
  const serviceType = serviceTypes?.find((type) => type.type_id === activePort?.type_id);
  const endpointFields = endpointType?.fields ?? {};
  const serviceFields = serviceType?.fields ?? {};
  const servicePortKey = Object.entries(serviceType?.mapping ?? {}).find(([, role]) => role === "port")?.[0];
  const servicePortField = servicePortKey ? serviceFields[servicePortKey] : undefined;
  const ipFieldKey = Object.entries(endpointType?.mapping ?? {}).find(([, role]) => role === "ip")?.[0];
  const servicePortData = servicePortKey ? activePort?.service_data?.[servicePortKey] : undefined;
  const serviceCustomFields = Object.entries(activePort?.service_data ?? {}).filter(([key]) => !(key in serviceFields));
  const endpointDraftCustomFields = editingEndpoint
    ? Object.entries(endpointValues).filter(([key]) => !(key in endpointFields) && !(key in (endpoint.endpoint_data ?? {})))
    : [];
  const serviceDraftCustomFields = editingServiceId === activePort?.service_id
    ? Object.entries(serviceValues).filter(([key]) => !(key in serviceFields) && !(key in (activePort?.service_data ?? {})))
    : [];
  const endpointData = endpoint.endpoint_data ?? {};
  const endpointFacts = [
    ...Object.entries(endpointData)
      .map(([key, resolved]) => [key, { ...resolved, field: resolved.field ?? endpointFields[key] ?? null }] as const)
      .filter(([key, resolved]) =>
        key !== ipFieldKey && (
          endpointFields[key]?.type === "list" ||
          (resolved.value !== null && resolved.value !== undefined && resolved.value !== "")
        ),
      ),
    ...Object.entries(endpointFields)
      .filter(([key, definition]) => key !== ipFieldKey && definition.type === "list" && !(key in endpointData))
      .map(([key, field]) => [key, { value: null, field }] as const),
  ];
  const subtitleParts = display.subtitle.split(" · ").filter((part) => part && part !== endpoint.type_label);
  const hasFallbackTitle = display.title === endpoint.type_label || display.title === `${endpoint.type_label} · ${endpoint.ip}`;
  const endpointSubtitle = hasFallbackTitle ? subtitleParts.filter((part) => part !== endpoint.ip) : subtitleParts;

  const startEndpointEdit = () => {
    setEndpointValues(readValues(endpoint.endpoint_data));
    setDeletedEndpointKeys(new Set());
    setDetailsOpen(true);
    setEditingEndpoint(true);
  };

  const cancelEndpointEdit = () => {
    setEndpointValues({});
    setDeletedEndpointKeys(new Set());
    setEditingEndpoint(false);
  };

  const setEndpointValue = (key: string, value: unknown) => {
    setEndpointValues((current) => ({ ...current, [key]: value }));
    setDeletedEndpointKeys((current) => {
      if (!current.has(key)) return current;
      const next = new Set(current);
      next.delete(key);
      return next;
    });
  };

  const deleteEndpointValue = (key: string) => {
    setEndpointValues((current) => {
      const next = { ...current };
      delete next[key];
      return next;
    });
    setDeletedEndpointKeys((current) => new Set(current).add(key));
  };

  const saveEndpointEdit = async () => {
    if (!endpoint.endpoint_id) return;
    const fieldsToValidate = Object.fromEntries(Object.entries(endpointFields).filter(([key]) => !deletedEndpointKeys.has(key)));
    const validationError = validateFields(endpointValues, fieldsToValidate);
    if (validationError) return toast.error(validationError);

    const payload: Record<string, unknown> = { ...endpointValues };
    for (const key of deletedEndpointKeys) payload[key] = null;
    try {
      await updateEndpoint({ endpointId: endpoint.endpoint_id, body: { endpoint_data: payload } });
      setEditingEndpoint(false);
      setDeletedEndpointKeys(new Set());
      toast.success("Endpoint updated");
      onCreated();
    } catch {
      toast.error("Failed to update endpoint");
    }
  };

  const startServiceEdit = (port: MappedPort) => {
    if (!port.service_id) return;
    setActivePortKey(portListKey(port));
    setServiceValues(readValues(port.service_data));
    setDeletedServiceKeys(new Set());
    setEditingServiceId(port.service_id);
  };

  const cancelServiceEdit = () => {
    setServiceValues({});
    setDeletedServiceKeys(new Set());
    setEditingServiceId(null);
  };

  const setServiceValue = (key: string, value: unknown) => {
    setServiceValues((current) => ({ ...current, [key]: value }));
    setDeletedServiceKeys((current) => {
      if (!current.has(key)) return current;
      const next = new Set(current);
      next.delete(key);
      return next;
    });
  };

  const deleteServiceValue = (key: string) => {
    setServiceValues((current) => {
      const next = { ...current };
      delete next[key];
      return next;
    });
    setDeletedServiceKeys((current) => new Set(current).add(key));
  };

  const saveServiceEdit = async () => {
    if (!activePort?.service_id || editingServiceId !== activePort.service_id) return;
    const fieldsToValidate = Object.fromEntries(Object.entries(serviceFields).filter(([key]) => !deletedServiceKeys.has(key)));
    const validationError = validateFields(serviceValues, fieldsToValidate);
    if (validationError) return toast.error(validationError);

    const payload: Record<string, unknown> = { ...serviceValues };
    for (const key of deletedServiceKeys) payload[key] = null;
    try {
      await updateService({ serviceId: activePort.service_id, body: { service_data: payload } });
      setEditingServiceId(null);
      setDeletedServiceKeys(new Set());
      toast.success("Service updated");
      onCreated();
    } catch {
      toast.error("Failed to update service");
    }
  };

  const confirmDeleteEndpoint = async () => {
    if (!endpoint.endpoint_id) return;
    try {
      await deleteEndpoint(endpoint.endpoint_id);
      setDeleteEndpointOpen(false);
      toast.success("Endpoint removed");
      onCreated();
    } catch {
      toast.error("Failed to remove endpoint");
    }
  };

  const confirmDeleteService = async () => {
    if (!activePort?.service_id) return;
    try {
      await deleteService(activePort.service_id);
      setDeleteServiceOpen(false);
      toast.success("Service removed");
      onCreated();
    } catch {
      toast.error("Failed to remove service");
    }
  };

  useEffect(() => {
    onHighlightDoneRef.current = onHighlightDone;
  }, [onHighlightDone]);

  // Scroll to the row and flash it for a few seconds, once.
  useEffect(() => {
    if (!highlighted) return;
    rowRef.current?.scrollIntoView?.({ block: "center", behavior: "smooth" });
    const timer = setTimeout(() => onHighlightDoneRef.current?.(), HIGHLIGHT_DURATION_MS);
    return () => clearTimeout(timer);
  }, [highlighted]);

  return (
    <AccordionItem value={endpointListKey(endpoint)} className="mb-2.5 overflow-hidden rounded-md border border-slate-200 bg-white last:mb-0 last:border-b">
      <div
        ref={rowRef}
        data-highlighted={highlighted || undefined}
        className={`flex min-h-14.5 items-center gap-3 pr-3 ${needsAssignment ? "bg-amber-50" : display.isUnidentified ? "bg-orange-50/40" : "bg-white"} ${highlighted ? "animate-search-highlight" : ""}`}
      >
        <div className="flex-1">
          <AccordionTrigger className="gap-3 px-3.5 py-3 text-left hover:no-underline hover:bg-slate-50">
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <span className={`grid h-8.5 w-8.5 shrink-0 place-items-center rounded-md ${display.isUnidentified ? "bg-orange-100 text-orange-700" : needsAssignment ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-600"}`}>
                {display.isUnidentified ? <HelpCircle className="h-4.5 w-4.5" /> : <Server className="h-4.5 w-4.5" />}
              </span>
              <div className="min-w-0 flex-1">
                <span className={`block text-[10px] font-semibold uppercase tracking-wide ${display.isUnidentified ? "text-orange-700" : "text-blue-700"}`}>
                  Endpoint · {endpoint.type_label ?? "Unidentified"}
                </span>
                <div className="flex min-w-0 items-center gap-2">
                  <strong className={`truncate text-[13px] ${display.isUnidentified ? "font-medium text-orange-700" : needsAssignment ? "font-medium text-amber-700" : "font-semibold text-slate-900"}`}>
                    {display.title}
                  </strong>
                  {needsAssignment && <Badge variant="outline" className="shrink-0 border-amber-400 bg-amber-100 text-amber-700">Not assigned</Badge>}
                </div>
                {endpointSubtitle.length > 0 && <span className="block truncate text-[11px] text-muted-foreground">{endpointSubtitle.join(" · ")}</span>}
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2.5">
              {showState && (
                <span className="flex w-21 justify-center">
                  <EndpointStatus value={endpoint.status} type="text" />
                </span>
              )}
              <span className="w-24 rounded bg-slate-100 px-2 py-0.5 text-center text-[11px] text-muted-foreground">
                {endpoint.ports.length} {endpoint.ports.length === 1 ? "service" : "services"}
              </span>
            </div>
          </AccordionTrigger>
        </div>
        {!isConfigured && (
          <div className="ml-2 flex shrink-0 items-center gap-2">
            <EndpointPrimaryAction
              endpoint={endpoint}
              display={display}
              deviceId={deviceId}
              onOpenDetails={onOpenDetails}
              onAssign={() => setAssignEndpointOpen(true)}
            />
          </div>
        )}
      </div>
      <AccordionContent className="border-t border-slate-100 bg-white px-4 sm:px-6">
        <section className="border-b border-slate-100 py-3">
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              className="flex min-w-0 items-center gap-2 text-left"
              aria-expanded={detailsOpen || editingEndpoint}
              disabled={editingEndpoint}
              onClick={() => setDetailsOpen((open) => !open)}
            >
              <ChevronDown className={`h-4 w-4 shrink-0 text-slate-500 transition-transform ${detailsOpen || editingEndpoint ? "" : "-rotate-90"}`} />
              <span className="text-[10px] font-semibold uppercase tracking-wider text-blue-700">Endpoint details</span>
            </button>
            {isConfigured && endpoint.endpoint_id && (
              <div className="flex shrink-0 items-center gap-2">
                {editingEndpoint ? (
                  <>
                    <Button variant="outline" size="sm" disabled={isSavingEndpoint} onClick={cancelEndpointEdit}>
                      Cancel
                    </Button>
                    <GuardedButton
                      deviceId={deviceId}
                      permissionKey={PERMISSION_KEYS.DEVICE_ENDPOINT_WRITE}
                      size="sm"
                      disabled={isSavingEndpoint}
                      onClick={saveEndpointEdit}
                    >
                      {isSavingEndpoint ? "Saving..." : "Save"}
                    </GuardedButton>
                    <GuardedButton
                      deviceId={deviceId}
                      permissionKey={PERMISSION_KEYS.DEVICE_ENDPOINT_WRITE}
                      variant="destructive"
                      size="sm"
                      aria-label="Remove endpoint"
                      onClick={() => setDeleteEndpointOpen(true)}
                    >
                      <Trash2 /> Remove
                    </GuardedButton>
                  </>
                ) : (
                  <GuardedButton
                    deviceId={deviceId}
                    permissionKey={PERMISSION_KEYS.DEVICE_ENDPOINT_WRITE}
                    variant="outline"
                    size="sm"
                    aria-label="Edit endpoint details"
                    disabled={!endpointType}
                    onClick={startEndpointEdit}
                  >
                    <Pencil /> Edit
                  </GuardedButton>
                )}
              </div>
            )}
          </div>
          {(detailsOpen || editingEndpoint) && (
            <dl className="grid gap-x-6 gap-y-3 border-t border-slate-100 py-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="min-w-0">
                <dt className="text-[11px] text-muted-foreground">Endpoint type</dt>
                <dd className="mt-1 min-h-8 pt-1 text-[13px] font-medium">{endpoint.type_label ?? "Unidentified"}</dd>
              </div>
              <div className="min-w-0">
                <dt className="text-[11px] text-muted-foreground">IP address</dt>
                <dd className="mt-1 min-h-8 break-all pt-1 font-mono text-xs">{endpoint.ip ?? "-"}</dd>
              </div>
              {showState && (
                <div className="min-w-0">
                  <dt className="text-[11px] text-muted-foreground">Last status change</dt>
                  <dd className="mt-1 min-h-8 pt-1 text-[13px] font-medium">{endpoint.lastStatusChange ?? "-"}</dd>
                </div>
              )}
              {endpointFacts.map(([key, resolved]) => (
                <InlineMetadataField
                  key={key}
                  label={resolved.field?.label ?? key}
                  value={editingEndpoint ? endpointValues[key] : resolved.value}
                  definition={resolved.field}
                  editing={editingEndpoint}
                  onChange={(value) => setEndpointValue(key, value)}
                  onDelete={editingEndpoint && !resolved.field?.required ? () => deleteEndpointValue(key) : undefined}
                />
              ))}
              {endpointDraftCustomFields.map(([key, value]) => (
                <InlineMetadataField
                  key={key}
                  label={key}
                  value={value}
                  editing
                  onChange={(next) => setEndpointValue(key, next)}
                  onDelete={() => deleteEndpointValue(key)}
                />
              ))}
            </dl>
          )}
          {editingEndpoint && (
            <InlineCustomFieldAdder existingKeys={Object.keys(endpointValues)} onAdd={setEndpointValue} />
          )}
        </section>

        <div className="flex flex-wrap items-end justify-between gap-3 pt-3">
          <div>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-blue-700">Services</span>
            <p className="mt-1 text-xs text-muted-foreground">Protocols exposed by this endpoint.</p>
          </div>
          <div className="flex items-center gap-2">
            {endpoint.ports.length === 0 && <p className="text-xs text-muted-foreground">No services detected.</p>}
            {isConfigured && endpoint.endpoint_id && (
              <GuardedButton
                deviceId={deviceId}
                permissionKey={PERMISSION_KEYS.DEVICE_ENDPOINT_WRITE}
                size="sm"
                onClick={() => setAddServiceOpen(true)}
              >
                <Plus /> Add Service
              </GuardedButton>
            )}
          </div>
        </div>
        {endpoint.ports.length > 0 && (
          <>
            <div className="mt-3 flex flex-wrap gap-1 border-b border-slate-200" role="tablist" aria-label={`${display.title} services`}>
              {endpoint.ports.map((port) => {
                const key = portListKey(port);
                const selected = activePort === port;
                return (
                  <button
                    key={key}
                    type="button"
                    role="tab"
                    aria-selected={selected}
                    className={`-mb-px flex shrink-0 items-center gap-2 rounded-t-md border border-b-0 border-t-2 px-3.5 py-2 text-xs transition-colors ${selected ? "border-slate-200 border-t-[#5b96ee] bg-white font-semibold text-slate-900" : "border-transparent border-t-transparent bg-transparent text-muted-foreground hover:text-slate-900"}`}
                    onClick={() => {
                      cancelServiceEdit();
                      setActivePortKey(key);
                    }}
                  >
                    <span className={`h-2 w-2 rounded-full ${port.status === "online" ? "bg-green-600" : port.status === "offline" ? "bg-red-500" : "bg-slate-400"}`} />
                    {port.type_label ?? "Unidentified"}
                    <span className="font-mono text-[11px] text-slate-500">{port.port ?? "-"}</span>
                  </button>
                );
              })}
            </div>
            {activePort && (
              <div className="rounded-b-md border border-t-0 border-slate-200 bg-white px-3.5 pb-3.5 pt-3" role="tabpanel">
                <header className="flex flex-wrap items-center gap-3 border-b border-slate-100 pb-2.5">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-[#5b96ee] text-white">
                    <Server className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <span className="block text-[10px] font-semibold uppercase tracking-wider text-[#5b96ee]">Service · {activePort.type_label ?? "Unidentified"}</span>
                    <strong className="block text-[13px] font-semibold">{activePort.type_label ?? "Unidentified"}</strong>
                  </div>
                  {activePort.service_id && (
                    editingServiceId === activePort.service_id ? (
                      <>
                        <Button variant="outline" size="sm" disabled={isSavingService} onClick={cancelServiceEdit}>
                          Cancel
                        </Button>
                        <GuardedButton
                          deviceId={deviceId}
                          permissionKey={PERMISSION_KEYS.DEVICE_ENDPOINT_WRITE}
                          size="sm"
                          disabled={isSavingService}
                          onClick={saveServiceEdit}
                        >
                          {isSavingService ? "Saving..." : "Save"}
                        </GuardedButton>
                        <GuardedButton
                          deviceId={deviceId}
                          permissionKey={PERMISSION_KEYS.DEVICE_ENDPOINT_WRITE}
                          variant="destructive"
                          size="sm"
                          aria-label="Remove service"
                          onClick={() => setDeleteServiceOpen(true)}
                        >
                          <Trash2 /> Remove
                        </GuardedButton>
                      </>
                    ) : activePort.source === "configured" ? (
                      <GuardedButton
                        deviceId={deviceId}
                        permissionKey={PERMISSION_KEYS.DEVICE_ENDPOINT_WRITE}
                        variant="outline"
                        size="sm"
                        aria-label="Edit service"
                        disabled={!serviceType}
                        onClick={() => startServiceEdit(activePort)}
                      >
                        <Pencil /> Edit
                      </GuardedButton>
                    ) : null
                  )}
                  {showState && <EndpointStatus value={endpoint.status} type="text" />}
                  {activePort.service_id && editingServiceId !== activePort.service_id && (
                    <Button variant="ghost" size="sm" onClick={() => onOpenServiceDetails(activePort.service_id!)}>
                      Details
                    </Button>
                  )}
                  {portNeedsAssignment(activePort) && isConfigured && (
                    <Badge variant="outline" className="border-amber-400 bg-amber-100 text-amber-700">Not assigned</Badge>
                  )}
                  <PortActions
                    endpoint={endpoint}
                    port={activePort}
                    deviceId={deviceId}
                    isConfigured={isConfigured}
                    onAssignPort={setAssignPort}
                    onBrowse={setBrowsing}
                  />
                </header>
                <dl className="grid grid-cols-1 gap-x-6 gap-y-3 pt-3 sm:grid-cols-2 lg:grid-cols-4">
                  <InlineMetadataField label="Service type" value={activePort.type_label ?? "Unidentified"} editing={false} />
                  <InlineMetadataField
                    label={servicePortField?.label ?? "Port"}
                    value={editingServiceId === activePort.service_id && servicePortKey ? serviceValues[servicePortKey] : servicePortData?.value ?? activePort.port}
                    definition={servicePortField}
                    editing={editingServiceId === activePort.service_id && Boolean(servicePortKey)}
                    onChange={(value) => servicePortKey && setServiceValue(servicePortKey, value)}
                  />
                  <InlineMetadataField label="Endpoint" value={display.title} editing={false} />
                  {showState && <InlineMetadataField label="Last status change" value={endpoint.lastStatusChange ?? "-"} editing={false} />}
                  {Object.entries(serviceFields)
                    .filter(([key]) => key !== servicePortKey)
                    .map(([key, definition]) => {
                      const resolved = activePort.service_data?.[key];
                      return (
                        <InlineMetadataField
                          key={key}
                          label={definition.label}
                          value={editingServiceId === activePort.service_id ? serviceValues[key] : resolved?.value}
                          definition={definition}
                          editing={editingServiceId === activePort.service_id}
                          onChange={(value) => setServiceValue(key, value)}
                          onDelete={editingServiceId === activePort.service_id && !definition.required ? () => deleteServiceValue(key) : undefined}
                        />
                      );
                    })}
                  {serviceCustomFields.map(([key, resolved]) => (
                    <InlineMetadataField
                      key={key}
                      label={resolved.field?.label ?? key}
                      value={editingServiceId === activePort.service_id ? serviceValues[key] : resolved.value}
                      definition={resolved.field}
                      editing={editingServiceId === activePort.service_id}
                      onChange={(value) => setServiceValue(key, value)}
                      onDelete={editingServiceId === activePort.service_id ? () => deleteServiceValue(key) : undefined}
                    />
                  ))}
                  {serviceDraftCustomFields.map(([key, value]) => (
                    <InlineMetadataField
                      key={key}
                      label={key}
                      value={value}
                      editing
                      onChange={(next) => setServiceValue(key, next)}
                      onDelete={() => deleteServiceValue(key)}
                    />
                  ))}
                </dl>
                {activePort.service_id && editingServiceId === activePort.service_id && (
                  <InlineCustomFieldAdder existingKeys={Object.keys(serviceValues)} onAdd={setServiceValue} />
                )}
              </div>
            )}
          </>
        )}
      </AccordionContent>

      <EndpointDialogs
        endpoint={endpoint}
        deviceId={deviceId}
        onCreated={onCreated}
        assignEndpointOpen={assignEndpointOpen}
        setAssignEndpointOpen={setAssignEndpointOpen}
        assignPort={assignPort}
        setAssignPort={setAssignPort}
        browsing={browsing}
        setBrowsing={setBrowsing}
      />
      {endpoint.endpoint_id && (
        <AssignServiceDialog
          open={addServiceOpen}
          onOpenChange={setAddServiceOpen}
          endpointId={endpoint.endpoint_id}
          onCreated={onCreated}
        />
      )}
      <ConfirmDeleteDialog
        open={deleteEndpointOpen}
        onOpenChange={setDeleteEndpointOpen}
        title="Remove endpoint"
        description={`This removes "${display.title}" and all of its services. This cannot be undone.`}
        onConfirm={confirmDeleteEndpoint}
        isPending={isDeletingEndpoint}
      />
      <ConfirmDeleteDialog
        open={deleteServiceOpen}
        onOpenChange={setDeleteServiceOpen}
        title="Remove service"
        description={`This removes "${activePort?.type_label ?? "service"}" from this endpoint. This cannot be undone.`}
        onConfirm={confirmDeleteService}
        isPending={isDeletingService}
      />
    </AccordionItem>
  );
}
