import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import FieldValueInput, { formatMetadataValue } from "@/features/PlatformTypes/FieldValueInput";
import type { components } from "@/generated/edge-administration/types";

type FieldDefinition = components["schemas"]["FieldDefinition"];

interface InlineMetadataFieldProps {
  label: string;
  value: unknown;
  editing: boolean;
  definition?: FieldDefinition | null;
  onChange?: (value: unknown) => void;
  onDelete?: () => void;
}

function inputValue(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string" || typeof value === "number") return String(value);
  return JSON.stringify(value);
}

function displayValue(value: unknown): string {
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "string" || typeof value === "number") return String(value);
  return value == null ? "" : JSON.stringify(value);
}

function listItemValues(item: Record<string, unknown>, definition: FieldDefinition) {
  const fields = definition.item_fields ?? {};
  const order = definition.item_order ?? Object.keys(fields);
  const keys = [
    ...order.filter((key) => key in item),
    ...Object.keys(item).filter((key) => key !== "id" && !order.includes(key)),
  ];
  return keys
    .map((key) => ({ key, label: fields[key]?.label ?? key, value: displayValue(item[key]) }))
    .filter(({ value }) => value !== "");
}

function ListMetadataValue({ value, definition }: { value: unknown; definition: FieldDefinition }) {
  const items = Array.isArray(value)
    ? value.filter((item): item is Record<string, unknown> => item !== null && typeof item === "object" && !Array.isArray(item))
    : [];

  if (items.length === 0) {
    return <span className="text-xs font-normal text-muted-foreground">No items</span>;
  }

  return (
    <ul aria-label={`${definition.label} items`} className="max-h-32 space-y-1 overflow-y-auto py-1">
      {items.map((item, index) => {
        const values = listItemValues(item, definition);
        return (
          <li key={typeof item.id === "string" ? item.id : index} className="border-l-2 border-slate-200 pl-2 text-xs font-normal">
            {values.length > 0 ? (
              <div className="flex flex-wrap gap-x-3 gap-y-0.5">
                {values.map(({ key, label, value }) => (
                  <span key={key} className="break-words">
                    <span className="text-muted-foreground">{label}:</span> {value}
                  </span>
                ))}
              </div>
            ) : (
              <span className="text-muted-foreground">Item {index + 1}</span>
            )}
          </li>
        );
      })}
    </ul>
  );
}

export default function InlineMetadataField({ label, value, editing, definition, onChange, onDelete }: InlineMetadataFieldProps) {
  return (
    <div className="min-w-0 space-y-0.5">
      <dt className="truncate text-xs text-muted-foreground">{label}</dt>
      <dd className="min-w-0 text-[13px] font-medium">
        {editing ? (
          <div className="flex min-w-0 items-center gap-1.5">
            <div className="min-w-0 flex-1">
              {definition ? (
                <FieldValueInput definition={definition} value={value ?? null} onChange={(next) => onChange?.(next)} />
              ) : (
                <input
                  aria-label={label}
                  className="h-8 w-full min-w-0 rounded-md border border-input bg-transparent px-2 text-sm font-normal shadow-xs focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring"
                  value={inputValue(value)}
                  onChange={(event) => onChange?.(event.target.value)}
                />
              )}
            </div>
            {onDelete && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                aria-label={`Remove ${label}`}
                onClick={onDelete}
              >
                <Trash2 />
              </Button>
            )}
          </div>
        ) : (
          definition?.type === "list" ? (
            <div className="min-h-8 min-w-0 pt-1">
              <ListMetadataValue value={value} definition={definition} />
            </div>
          ) : (
            <span className="block min-h-8 truncate pt-1 text-[13px] font-medium" title={formatMetadataValue(value, definition ?? { type: "string" })}>
              {formatMetadataValue(value, definition ?? { type: "string" }) || "-"}
            </span>
          )
        )}
      </dd>
    </div>
  );
}
