import { components } from "@/generated/edge-administration/types";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import Toggle from "./Toggle";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

// Radix Select can't hold an empty-string item, so "no selection" is represented by this sentinel.
const NO_SELECTION = "__none__";

export type FieldDefinitionLike = Pick<
  components["schemas"]["FieldDefinition"],
  "type" | "ui" | "options" | "validation"
> & Partial<Pick<components["schemas"]["FieldDefinition"], "item_fields" | "item_order">>;
type FieldDefinition = components["schemas"]["FieldDefinition"];
type FieldValidation = NonNullable<FieldDefinitionLike["validation"]>;

// Mirrors the shadcn <Input> styles for native elements (select, textarea) that have no shadcn wrapper here.
export const inputClass =
  "w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs transition-colors placeholder:text-muted-foreground focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50";

/** Same as inputClass, but for h-8 contexts (e.g. next to a "sm" button) - py-2 doesn't leave
 * enough room for a line of text at a fixed 32px height, so this uses tighter py-1 instead. */
export const compactInputClass = inputClass.replace("py-2", "py-1") + " h-8";

/** Read-only counterpart to the input widget above: formats a value for display, driven by the same FieldDefinition. */
export function formatMetadataValue(value: unknown, definition: Pick<FieldDefinitionLike, "type">): string {
  if (value === null || value === undefined || value === "") return "";
  if (definition.type === "boolean") return value ? "Yes" : "No";
  if (definition.type === "list") return Array.isArray(value) ? `${value.length} ${value.length === 1 ? "item" : "items"}` : "";
  return String(value);
}

/**
 * Mirrors the backend's field_validation.py:validate_value - the single source of truth for
 * whether a (non-empty) value satisfies a field's `validation` constraints and `options` list.
 * `required`/emptiness is intentionally not checked here (see `validateFields` below), since an
 * empty value is either fine (optional field) or a distinct "is required" error, not a
 * pattern/length/bounds violation.
 */
export function validateFieldValue(label: string, value: unknown, definition: FieldDefinitionLike): string | null {
  if (value === null || value === undefined || value === "") return null;

  const { type } = definition;
  if (type === "boolean" && typeof value !== "boolean") return `"${label}" must be a boolean`;
  if (type === "integer" && (typeof value !== "number" || !Number.isInteger(value))) {
    return `"${label}" must be an integer`;
  }
  if (type === "number" && typeof value !== "number") return `"${label}" must be a number`;
  if (type === "string" && typeof value !== "string") return `"${label}" must be a string`;
  if (type === "list") {
    if (!Array.isArray(value) || !value.every((item) => item !== null && typeof item === "object" && !Array.isArray(item))) {
      return `"${label}" must be a list of objects`;
    }
    for (const [index, item] of value.entries()) {
      for (const [key, field] of Object.entries(definition.item_fields ?? {})) {
        const itemValue = (item as Record<string, unknown>)[key];
        const isEmpty = itemValue === null || itemValue === undefined || itemValue === "";
        if (field.required && isEmpty) return `"${label}" item ${index + 1}: "${field.label}" is required`;
        if (!isEmpty) {
          const error = validateFieldValue(`${label} item ${index + 1}: ${field.label}`, itemValue, field);
          if (error) return error;
        }
      }
    }
    return null;
  }

  const validation: Partial<FieldValidation> = definition.validation ?? {};

  if (type === "string" && typeof value === "string") {
    if (validation.pattern) {
      let matches: boolean;
      try {
        // Python's re.fullmatch requires the whole string to match - `^(?:...)$` mirrors that.
        matches = new RegExp(`^(?:${validation.pattern})$`).test(value);
      } catch {
        matches = true; // an invalid pattern shouldn't block the user here - it's caught at
        // field-definition save time instead (see TypeFormDialog's handleSave).
      }
      if (!matches) return `"${label}" does not match the required pattern`;
    }
    if (validation.min_length != null && value.length < validation.min_length) {
      return `"${label}" must be at least ${validation.min_length} characters long`;
    }
    if (validation.max_length != null && value.length > validation.max_length) {
      return `"${label}" must be at most ${validation.max_length} characters long`;
    }
  } else if ((type === "integer" || type === "number") && typeof value === "number") {
    if (validation.minimum != null) {
      const violates = validation.exclusive_minimum ? value <= validation.minimum : value < validation.minimum;
      if (violates) {
        return validation.exclusive_minimum
          ? `"${label}" must be greater than ${validation.minimum}`
          : `"${label}" must be at least ${validation.minimum}`;
      }
    }
    if (validation.maximum != null) {
      const violates = validation.exclusive_maximum ? value >= validation.maximum : value > validation.maximum;
      if (violates) {
        return validation.exclusive_maximum
          ? `"${label}" must be less than ${validation.maximum}`
          : `"${label}" must be at most ${validation.maximum}`;
      }
    }
    if (validation.multiple_of != null && value % validation.multiple_of !== 0) {
      return `"${label}" must be a multiple of ${validation.multiple_of}`;
    }
  }

  if (definition.options && !definition.options.includes(value as string)) {
    return `"${label}" must be one of ${definition.options.join(", ")}`;
  }

  return null;
}

/**
 * Validates a full set of instance values against their fields' definitions - required first,
 * then `validateFieldValue` - returning the first error found (or null if all pass). This is the
 * one function every device/endpoint/service instance create/edit form should call before
 * submitting, so bad input is caught locally instead of relying on the backend's generic
 * failure toast.
 */
export function validateFields(
  values: Record<string, unknown>,
  fields: Record<string, FieldDefinition>,
): string | null {
  for (const [key, definition] of Object.entries(fields)) {
    const value = values[key];
    const isEmpty = value === null || value === undefined || value === "" ||
      (definition.type === "list" && Array.isArray(value) && value.length === 0);
    if (definition.required && isEmpty) {
      return `"${definition.label}" is required`;
    }
    if (!isEmpty) {
      const error = validateFieldValue(definition.label, value, definition);
      if (error) return error;
    }
  }
  return null;
}

function defaultUiFor(type: FieldDefinitionLike["type"]) {
  switch (type) {
    case "boolean":
      return "toggle";
    case "integer":
    case "number":
      return "number";
    default:
      return "input";
  }
}

interface FieldValueInputProps {
  definition: FieldDefinitionLike;
  value: unknown;
  onChange: (value: unknown) => void;
  placeholder?: string;
  disabled?: boolean;
}

function itemFieldEntries(definition: FieldDefinitionLike) {
  const fields = definition.item_fields ?? {};
  const order = definition.item_order ?? Object.keys(fields);
  const orderedKeys = [...order.filter((key) => key in fields), ...Object.keys(fields).filter((key) => !order.includes(key))];
  return orderedKeys.map((key) => [key, fields[key]] as const);
}

function defaultListItem(definition: FieldDefinitionLike): Record<string, unknown> {
  return Object.fromEntries(
    itemFieldEntries(definition)
      .filter(([, field]) => field.default !== null && field.default !== undefined)
      .map(([key, field]) => [key, field.default]),
  );
}

function ListFieldValueInput({
  definition,
  value,
  onChange,
  disabled,
}: FieldValueInputProps) {
  const items = Array.isArray(value)
    ? value.filter((item): item is Record<string, unknown> => item !== null && typeof item === "object" && !Array.isArray(item))
    : [];
  const fields = itemFieldEntries(definition);

  const updateItem = (index: number, key: string, nextValue: unknown) => {
    onChange(items.map((item, itemIndex) => itemIndex === index ? { ...item, [key]: nextValue } : item));
  };

  return (
    <div className="space-y-2">
      {items.map((item, index) => (
        <div key={typeof item.id === "string" ? item.id : `new-${index}`} className="rounded-md border p-3">
          <div className="mb-2 flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-muted-foreground">Item {index + 1}</span>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
              aria-label={`Remove item ${index + 1}`}
              title={`Remove item ${index + 1}`}
              disabled={disabled}
              onClick={() => onChange(items.filter((_, itemIndex) => itemIndex !== index))}
            >
              <Trash2 />
            </Button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {fields.map(([key, field]) => (
              <div key={key} className="min-w-0 space-y-1">
                <span className="text-xs font-medium text-muted-foreground">{field.label}</span>
                <FieldValueInput
                  definition={field}
                  value={item[key] ?? null}
                  onChange={(next) => updateItem(index, key, next)}
                  disabled={disabled}
                />
              </div>
            ))}
          </div>
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={disabled || fields.length === 0}
        onClick={() => onChange([...items, defaultListItem(definition)])}
      >
        <Plus />
        Add item
      </Button>
    </div>
  );
}

/**
 * Renders the appropriate input widget for a value, driven entirely by a
 * FieldDefinition's `type`/`ui`/`options` — the single source of truth for
 * how any platform-type field should be edited.
 */
export default function FieldValueInput({ definition, value, onChange, placeholder, disabled }: FieldValueInputProps) {
  const ui = definition.ui ?? defaultUiFor(definition.type);
  const options = definition.options ?? [];

  if (definition.type === "list") {
    return <ListFieldValueInput definition={definition} value={value} onChange={onChange} disabled={disabled} />;
  }

  if (ui === "toggle") {
    return <Toggle checked={Boolean(value)} onChange={onChange} disabled={disabled} />;
  }

  if (ui === "checkbox") {
    return (
      <input
        type="checkbox"
        checked={Boolean(value)}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary/30"
      />
    );
  }

  if (ui === "select") {
    return (
      <Select
        value={typeof value === "string" && value !== "" ? value : NO_SELECTION}
        disabled={disabled}
        onValueChange={(v) => onChange(v === NO_SELECTION ? "" : v)}
      >
        <SelectTrigger className="h-8">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={NO_SELECTION}>—</SelectItem>
          {options.map((opt) => (
            <SelectItem key={opt} value={opt}>
              {opt}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  if (ui === "radio") {
    return (
      <div className="flex flex-wrap gap-3">
        {options.length === 0 && <span className="text-xs text-muted-foreground">No options defined</span>}
        {options.map((opt) => (
          <label key={opt} className="inline-flex items-center gap-1.5 text-sm">
            <input
              type="radio"
              checked={value === opt}
              disabled={disabled}
              onChange={() => onChange(opt)}
              className="h-3.5 w-3.5 text-primary focus:ring-primary/30"
            />
            {opt}
          </label>
        ))}
      </div>
    );
  }

  if (ui === "textarea") {
    return (
      <Textarea
        value={typeof value === "string" ? value : ""}
        disabled={disabled}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        rows={2}
        minLength={definition.validation?.min_length ?? undefined}
        maxLength={definition.validation?.max_length ?? undefined}
      />
    );
  }

  if (ui === "password") {
    return (
      <input
        type="password"
        value={typeof value === "string" ? value : ""}
        disabled={disabled}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        pattern={definition.validation?.pattern ?? undefined}
        minLength={definition.validation?.min_length ?? undefined}
        maxLength={definition.validation?.max_length ?? undefined}
        className={compactInputClass}
      />
    );
  }

  if (ui === "slider") {
    const min = definition.validation?.minimum ?? 0;
    const max = definition.validation?.maximum ?? 100;
    const numericValue = typeof value === "number" ? value : min;
    return (
      <div className="flex items-center gap-2">
        <input
          type="range"
          min={min}
          max={max}
          step={definition.validation?.multiple_of ?? (definition.type === "integer" ? 1 : "any")}
          disabled={disabled}
          value={numericValue}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full accent-primary"
        />
        <span className="w-10 text-right text-xs text-muted-foreground tabular-nums">{numericValue}</span>
      </div>
    );
  }

  if (ui === "number" || definition.type === "integer" || definition.type === "number") {
    return (
      <input
        type="number"
        step={definition.validation?.multiple_of ?? (definition.type === "integer" ? 1 : "any")}
        min={definition.validation?.minimum ?? undefined}
        max={definition.validation?.maximum ?? undefined}
        value={typeof value === "number" ? value : ""}
        disabled={disabled}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value === "" ? null : Number(e.target.value))}
        className={compactInputClass}
      />
    );
  }

  // Default: plain text input (ui === "input" or type === "string")
  return (
    <input
      type="text"
      value={typeof value === "string" ? value : ""}
      disabled={disabled}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      pattern={definition.validation?.pattern ?? undefined}
      minLength={definition.validation?.min_length ?? undefined}
      maxLength={definition.validation?.max_length ?? undefined}
      className={compactInputClass}
    />
  );
}
