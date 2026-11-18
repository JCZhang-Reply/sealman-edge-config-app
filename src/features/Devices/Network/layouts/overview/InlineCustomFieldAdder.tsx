import { useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "react-toastify";
import { Button } from "@/components/ui/button";
import { compactInputClass } from "@/features/PlatformTypes/FieldValueInput";

interface InlineCustomFieldAdderProps {
  existingKeys: string[];
  onAdd: (key: string, value: unknown) => void;
}

export default function InlineCustomFieldAdder({ existingKeys, onAdd }: InlineCustomFieldAdderProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [key, setKey] = useState("");
  const [value, setValue] = useState("");

  const addField = () => {
    const normalizedKey = key.trim();
    if (!normalizedKey) return toast.error("Enter a field name");
    if (existingKeys.includes(normalizedKey)) return toast.error(`"${normalizedKey}" already exists`);
    onAdd(normalizedKey, value);
    setKey("");
    setValue("");
    setIsAdding(false);
  };

  return (
    <div className="border-t border-slate-100 pt-2">
      {isAdding ? (
        <div className="flex flex-wrap items-end gap-2">
          <label className="min-w-32 flex-1 text-[11px] text-muted-foreground">
            Field name
            <input autoFocus className={`${compactInputClass} mt-1 font-mono`} value={key} onChange={(event) => setKey(event.target.value)} />
          </label>
          <label className="min-w-32 flex-1 text-[11px] text-muted-foreground">
            Value
            <input className={`${compactInputClass} mt-1`} value={value} onChange={(event) => setValue(event.target.value)} />
          </label>
          <Button type="button" variant="outline" size="sm" onClick={addField}>
            <Plus /> Add Field
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={() => setIsAdding(false)}>
            Cancel
          </Button>
        </div>
      ) : (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="border-dashed text-blue-700"
          aria-expanded={false}
          onClick={() => setIsAdding(true)}
        >
          <Plus /> Add custom field
        </Button>
      )}
    </div>
  );
}
