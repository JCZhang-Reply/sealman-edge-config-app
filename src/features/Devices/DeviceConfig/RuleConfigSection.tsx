import { PlusIcon, TrashIcon } from "@heroicons/react/24/outline";
import { Button } from "@/components/ui/button";

interface RuleConfigSectionProps {
  title: string;
  description: string;
  onAdd: () => void;
  isEmpty: boolean;
  emptyMessage: string;
  children?: React.ReactNode;
  footer?: React.ReactNode;
}

/** Shared layout for rule based device config pages (NAT, Port Forwarding). */
export function RuleConfigSection({ title, description, onAdd, isEmpty, emptyMessage, children, footer }: RuleConfigSectionProps) {
  return (
    <div className="space-y-4 rounded-lg border bg-background p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1.5">
          <h2 className="text-lg font-semibold leading-none tracking-tight">{title}</h2>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={onAdd}>
          <PlusIcon />
          Add a rule
        </Button>
      </div>

      {isEmpty ? (
        <div className="rounded-md border border-dashed bg-muted/40 p-6 text-center text-sm text-muted-foreground">
          {emptyMessage}
        </div>
      ) : (
        <div className="divide-y rounded-md border">{children}</div>
      )}

      {footer && <div className="flex justify-end">{footer}</div>}
    </div>
  );
}

export function RuleRow({ children, onDelete }: { children: React.ReactNode; onDelete: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3 p-3 sm:flex-row sm:items-start">
      <div className="grid flex-1 gap-3 sm:grid-cols-[repeat(auto-fit,minmax(9rem,1fr))]">{children}</div>
      <div className="sm:pt-6">{onDelete}</div>
    </div>
  );
}

export function DeleteRuleButton({ onClick }: { onClick: () => void }) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={onClick}
      aria-label="Delete rule"
      title="Delete rule"
      className="text-muted-foreground hover:text-destructive"
    >
      <TrashIcon />
    </Button>
  );
}
