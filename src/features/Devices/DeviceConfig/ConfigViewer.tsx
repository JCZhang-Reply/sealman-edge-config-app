import { useState } from "react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";

type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

const SECRET_KEY_PATTERN = /(password|secret|token|connection_string|sharedaccesskey|primarykey|^auth$)/i;

const humanize = (key: string) =>
  key
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/^\w/, (c) => c.toUpperCase());

const isObject = (value: JsonValue): value is { [key: string]: JsonValue } =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isPrimitive = (value: JsonValue) => value === null || typeof value !== "object";

function PrimitiveValue({ name, value }: { name: string; value: JsonValue }) {
  if (value === null || value === "") return <span className="text-muted-foreground">—</span>;
  if (SECRET_KEY_PATTERN.test(name)) return <span className="font-mono text-muted-foreground">••••••••</span>;
  if (typeof value === "boolean") {
    return (
      <Badge
        variant="outline"
        className={value ? "border-green-300 bg-green-50 text-green-700" : "border-slate-300 bg-slate-50 text-slate-600"}
      >
        {value ? "Yes" : "No"}
      </Badge>
    );
  }
  if (typeof value === "string" && value.includes("\n")) {
    return <pre className="max-h-48 overflow-auto whitespace-pre-wrap rounded-md bg-muted p-2 font-mono text-xs">{value}</pre>;
  }
  return <span className="break-all font-mono text-xs">{String(value)}</span>;
}

function ConfigNode({ name, value }: { name: string; value: JsonValue }) {
  if (isPrimitive(value)) return <PrimitiveValue name={name} value={value} />;

  if (Array.isArray(value)) {
    if (value.length === 0) return <span className="text-muted-foreground">None</span>;
    if (value.every(isPrimitive)) {
      return (
        <div className="flex flex-wrap gap-1.5">
          {value.map((item, i) => (
            <Badge key={i} variant="outline" className="font-mono text-xs font-normal">
              {SECRET_KEY_PATTERN.test(name) ? "••••••••" : String(item)}
            </Badge>
          ))}
        </div>
      );
    }
    return (
      <div className="space-y-2">
        {value.map((item, i) => (
          <div key={i} className="rounded-md border p-3">
            <p className="mb-2 text-xs font-medium text-muted-foreground">#{i + 1}</p>
            <ConfigNode name={name} value={item} />
          </div>
        ))}
      </div>
    );
  }

  const entries = Object.entries(value);
  if (entries.length === 0) return <span className="text-muted-foreground">Not configured</span>;

  const fields = entries.filter(([, v]) => isPrimitive(v) || Array.isArray(v));
  const groups = entries.filter(([, v]) => isObject(v));

  return (
    <div className="space-y-3">
      {fields.length > 0 && (
        <dl className="divide-y rounded-md border">
          {fields.map(([key, v]) => (
            <div key={key} className="grid grid-cols-1 gap-1 px-3 py-2 sm:grid-cols-[minmax(10rem,1fr)_2fr] sm:gap-4">
              <dt className="text-muted-foreground">{humanize(key)}</dt>
              <dd className="min-w-0">
                <ConfigNode name={key} value={v} />
              </dd>
            </div>
          ))}
        </dl>
      )}
      {groups.map(([key, v]) => (
        <div key={key} className="space-y-2 border-l-2 border-muted pl-3">
          <p className="font-medium">{humanize(key)}</p>
          <ConfigNode name={key} value={v} />
        </div>
      ))}
    </div>
  );
}

export function ConfigViewer({ data }: { data: JsonValue }) {
  const [view, setView] = useState<"overview" | "json">("overview");
  const sections = isObject(data) ? Object.entries(data) : [["config", data] as [string, JsonValue]];

  return (
    <div className="space-y-3">
      <div role="radiogroup" aria-label="Config view" className="inline-flex rounded-md border bg-muted p-1 text-sm">
        {(["overview", "json"] as const).map((option) => (
          <button
            key={option}
            type="button"
            role="radio"
            aria-checked={view === option}
            onClick={() => setView(option)}
            className={`rounded px-3 py-1.5 font-medium transition-colors ${
              view === option ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {option === "overview" ? "Overview" : "JSON"}
          </button>
        ))}
      </div>

      <div className="max-h-[60vh] overflow-auto rounded-md border">
        {view === "json" ? (
          <pre className="whitespace-pre-wrap break-all bg-muted/40 p-3 font-mono text-xs">{JSON.stringify(data, null, 2)}</pre>
        ) : (
          <Accordion type="multiple" className="px-3">
            {sections.map(([key, value]) => (
              <AccordionItem key={key} value={key} className="last:border-b-0">
                <AccordionTrigger className="hover:no-underline">{humanize(key)}</AccordionTrigger>
                <AccordionContent>
                  <ConfigNode name={key} value={value} />
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </div>
    </div>
  );
}
