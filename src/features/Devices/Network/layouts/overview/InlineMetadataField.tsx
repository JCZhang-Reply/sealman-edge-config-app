import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import FieldValueInput, { formatMetadataValue } from "@/features/PlatformTypes/FieldValueInput";
import type { components } from "@/generated/edge-administration/types";

type FieldDefinition = components["schemas"]["FieldDefinition"];

interface InlineMetadataFieldProps {
  label: string;
  value: unknown;
  editing: boolean;
  definition?: FieldDefinition;
  onChange?: (value: unknown) => void;
  onDelete?: () => void;
}

function inputValue(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string" || typeof value === "number") return String(value);
  return JSON.stringify(value);
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
          <span className="block min-h-8 truncate pt-1 text-[13px] font-medium" title={formatMetadataValue(value, definition ?? { type: "string" })}>
            {formatMetadataValue(value, definition ?? { type: "string" }) || "-"}
          </span>
        )}
      </dd>
    </div>
  );
}
