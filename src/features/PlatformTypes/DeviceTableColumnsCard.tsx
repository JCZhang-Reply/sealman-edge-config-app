import Toggle from "./Toggle";
import useDeviceMetadataFields from "./useDeviceMetadataFields";
import useDeviceTableColumnsStore, { defaultFieldVisible } from "./deviceTableColumnsStore";

/**
 * Lets an admin choose which device metadata fields show up as searchable
 * columns in the devices table. Every field is on by default, except
 * geo-location-like fields which default to off.
 */
export default function DeviceTableColumnsCard({ canEdit = true }: { canEdit?: boolean }) {
  const { fields, isLoading } = useDeviceMetadataFields();
  const overrides = useDeviceTableColumnsStore((s) => s.overrides);
  const setFieldVisible = useDeviceTableColumnsStore((s) => s.setFieldVisible);

  return (
    <div className="bg-card border rounded-lg p-4 space-y-4">
      <div>
        <h3 className="text-lg font-semibold">Devices Table Columns</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Choose which device metadata fields show as searchable columns in the devices table. Hidden fields
          remain visible and editable on each device&apos;s detail page.
        </p>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading fields...</p>
      ) : fields.length === 0 ? (
        <p className="text-sm text-muted-foreground italic">
          No device type fields defined yet. Add fields to a device type above first.
        </p>
      ) : (
        <div className="border rounded-md divide-y divide-gray-100 overflow-hidden">
          {fields.map(([key, field]) => (
            <div key={key} className="flex items-center justify-between px-4 py-2.5">
              <div>
                <div className="text-sm font-medium">{field.label}</div>
                <div className="text-xs text-muted-foreground font-mono">{key}</div>
              </div>
              <Toggle
                checked={overrides[key] ?? defaultFieldVisible(key)}
                disabled={!canEdit}
                onChange={(visible) => setFieldVisible(key, visible)}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
