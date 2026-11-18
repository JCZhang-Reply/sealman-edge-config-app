import { LayoutGrid, List } from "lucide-react";
import { AssetsViewMode } from "./canvasLayout";

const OPTIONS: { mode: AssetsViewMode; label: string; Icon: typeof List }[] = [
  { mode: "list", label: "List", Icon: List },
  { mode: "canvas", label: "Canvas", Icon: LayoutGrid },
];

/** Switches the Assets page between the list (accordion) view and the free-form canvas view. */
export default function AssetsViewToggle({ value, onChange }: { value: AssetsViewMode; onChange: (mode: AssetsViewMode) => void }) {
  return (
    <div role="group" aria-label="Assets view" className="inline-flex h-8 overflow-hidden rounded-md border border-slate-300 bg-white text-xs text-slate-700">
      {OPTIONS.map(({ mode, label, Icon }) => (
        <button
          key={mode}
          type="button"
          aria-pressed={value === mode}
          onClick={() => onChange(mode)}
          className={`inline-flex items-center gap-1.5 px-3 transition-colors focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring ${
            mode === "canvas" ? "border-l border-slate-200 " : ""
          }${value === mode ? "bg-blue-50 text-blue-700 font-semibold" : "hover:bg-slate-50"}`}
        >
          <Icon className="h-3.5 w-3.5" aria-hidden="true" />
          {label}
        </button>
      ))}
    </div>
  );
}
