import { useState } from "react";
import { toast } from "react-toastify";
import { ChevronDown, Cpu, Pencil } from "lucide-react";
import { WaterLoader } from "@/components/ui/water-loader";
import { Button } from "@/components/ui/button";
import { validateFields } from "@/features/PlatformTypes/FieldValueInput";
import InlineMetadataField from "@/features/Devices/Network/layouts/overview/InlineMetadataField";
import InlineCustomFieldAdder from "@/features/Devices/Network/layouts/overview/InlineCustomFieldAdder";
import { withPermissionRequiredTooltip } from "@/features/authorization/permissions/withPermissionRequiredTooltip";
import { PERMISSION_KEYS } from "@/features/authorization/permissions/permission-keys";
import useGetDeviceMetadata from "@/generated/edge-administration/hooks/device_metadata/useGetDeviceMetadata";
import usePatchDeviceMetadata from "@/generated/edge-administration/hooks/device_metadata/usePatchDeviceMetadata";
import useGetDeviceTypes from "@/generated/edge-administration/hooks/device_types/useGetDeviceTypes";
import { getErrorMessage } from "@/lib/errors";

const GuardedButton = withPermissionRequiredTooltip(Button);

const isEmpty = (value: unknown) => value === null || value === undefined || value === "";

/**
 * The device is the gateway the endpoints and services on the Assets tab hang off, so its type is
 * displayed and its metadata edited here, right above them.
 */
export default function DeviceGatewayCard({ deviceId }: { deviceId: string }) {
  const metadataQuery = useGetDeviceMetadata(deviceId);
  const typesQuery = useGetDeviceTypes();
  const { query: patchMetadata, isPending: isPatchingMetadata } = usePatchDeviceMetadata();

  const [editing, setEditing] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  // Only what the user changed; the stored values underneath stay untouched until saving.
  const [edits, setEdits] = useState<Record<string, unknown>>({});
  const [deletedKeys, setDeletedKeys] = useState<Set<string>>(new Set());

  const metadata = metadataQuery.data;
  const types = typesQuery.data ?? [];
  const defaultType = types.find((t) => t.type_id === "default");
  const currentType = types.find((t) => t.type_id === metadata?.typeId);
  const isSaving = isPatchingMetadata;

  const stored = Object.fromEntries(Object.entries(metadata?.deviceMetadata ?? {}).map(([key, entry]) => [key, entry.value]));
  // The default type's fields apply to every device type; the current type's own definitions win.
  const fields = { ...(defaultType?.fields ?? {}), ...(currentType?.fields ?? {}) };

  const merged: Record<string, unknown> = { ...stored, ...edits };
  for (const key of deletedKeys) delete merged[key];
  const formValues = Object.fromEntries(
    Object.keys(fields).map((key) => [key, merged[key] ?? null]),
  );
  const customValues = Object.fromEntries(Object.entries(merged).filter(([key]) => !(key in fields)));

  const startEditing = () => {
    setEdits({});
    setDeletedKeys(new Set());
    setDetailsOpen(true);
    setEditing(true);
  };

  const cancelEditing = () => {
    setEdits({});
    setDeletedKeys(new Set());
    setEditing(false);
  };

  const setValue = (key: string, value: unknown) => {
    setEdits((prev) => ({ ...prev, [key]: value }));
    setDeletedKeys((prev) => {
      if (!prev.has(key)) return prev;
      const next = new Set(prev);
      next.delete(key);
      return next;
    });
  };

  const deleteValue = (key: string) => {
    setEdits((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
    setDeletedKeys((prev) => new Set(prev).add(key));
  };

  const handleSave = async () => {
    const fieldsToValidate = Object.fromEntries(Object.entries(fields).filter(([key]) => !deletedKeys.has(key)));
    const validationError = validateFields(formValues, fieldsToValidate);
    if (validationError) {
      toast.error(validationError);
      return;
    }

    // In a PATCH, null removes a key - so emptied or deleted fields that were stored are sent as null.
    const payload: Record<string, unknown> = {};
    for (const [key, value] of Object.entries({ ...formValues, ...customValues })) {
      if (!isEmpty(value)) payload[key] = value;
      else if (key in stored) payload[key] = null;
    }
    for (const key of deletedKeys) {
      if (key in stored) payload[key] = null;
    }

    try {
      if (Object.keys(payload).length > 0) await patchMetadata({ deviceId, body: payload });
      toast.success("Gateway updated");
      setEditing(false);
    } catch (error) {
      toast.error(`Could not update the gateway: ${getErrorMessage(error)}`);
    }
  };

  const detailRows = metadata
    ? [
        { key: "__device_type", label: "Device Type", value: currentType?.label ?? metadata.typeId, fixed: true },
        ...Object.entries(fields)
          .map(([key, definition]) => ({ key, label: definition.label, value: merged[key] ?? null, definition }))
          .sort((a, b) => a.label.localeCompare(b.label)),
        ...Object.entries(merged)
          .filter(([key]) => !(key in fields))
          .map(([key, value]) => ({ key, label: metadata.deviceMetadata[key]?.field?.label ?? key, value, definition: metadata.deviceMetadata[key]?.field }))
          .sort((a, b) => a.label.localeCompare(b.label)),
      ]
    : [];

  return (
    <section className="bg-white">
      <header className="flex min-h-14 items-center gap-3 px-3 py-2">
        <div className="flex min-w-0 items-center gap-3">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded bg-[#0b3f8f] text-white">
            <Cpu className="h-5 w-5" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[#0b3f8f]">Device · Edge device</p>
            <h2 className="truncate text-base font-semibold leading-5">{deviceId}</h2>
          </div>
        </div>
      </header>

      <div className="flex min-h-10 items-center justify-between gap-3 border-t border-slate-100 px-3 py-1.5">
        <button
          type="button"
          className="flex items-center gap-2 py-1 text-left text-[10px] font-semibold uppercase tracking-wider text-blue-700"
          aria-expanded={detailsOpen || editing}
          aria-controls="gateway-details"
          disabled={editing}
          onClick={() => setDetailsOpen((open) => !open)}
        >
          <ChevronDown className={`h-4 w-4 transition-transform ${detailsOpen || editing ? "" : "-rotate-90"}`} />
          Device details
        </button>
        <div className="flex shrink-0 items-center gap-2">
          {metadata && editing && (
            <Button variant="outline" size="sm" onClick={cancelEditing} disabled={isSaving}>
              Cancel
            </Button>
          )}
          {metadata && editing && (
            <Button size="sm" onClick={handleSave} disabled={isSaving}>
              {isSaving ? "Saving..." : "Save"}
            </Button>
          )}
          {metadata && !editing && (
            <GuardedButton
              deviceId={deviceId}
              permissionKey={PERMISSION_KEYS.DEVICE_METADATA_WRITE}
              variant="outline"
              size="sm"
              onClick={startEditing}
            >
              <Pencil /> Edit
            </GuardedButton>
          )}
        </div>
      </div>

      <div className={detailsOpen || editing || metadataQuery.isLoading || metadataQuery.isError ? "px-3 pb-3" : "px-3"}>
        {metadataQuery.isLoading && (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <WaterLoader /> Loading gateway...
          </p>
        )}
        {metadataQuery.isError && <p className="text-sm text-destructive">Failed to load the gateway data.</p>}

        {metadata && (detailsOpen || editing) && (
          <div id="gateway-details" className="border-t border-slate-100 py-3">
            <dl className="grid gap-x-8 gap-y-3 sm:grid-cols-2 lg:grid-cols-4">
              {detailRows.map((row) => (
                <InlineMetadataField
                  key={row.key}
                  label={row.label}
                  value={row.value}
                  definition={row.definition}
                  editing={editing && !row.fixed}
                  onChange={(value) => setValue(row.key, value)}
                  onDelete={row.fixed || row.definition?.required ? undefined : () => deleteValue(row.key)}
                />
              ))}
            </dl>
            {editing && <InlineCustomFieldAdder existingKeys={Object.keys(merged)} onAdd={setValue} />}
          </div>
        )}
      </div>
    </section>
  );
}
