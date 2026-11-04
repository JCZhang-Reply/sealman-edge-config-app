import { useContext, useState } from "react";
import { PortForwardingContext } from "./context";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { PortForwardingRule as Rule } from "./types";
import { isValidIP } from "@/lib/validateIP";
import { parseRuleName } from "@/utils/parseRuleName";
import { DeleteRuleButton, RuleRow } from "../RuleConfigSection";



const INTERFACE_OPTIONS = [
  { label: "LAN1", value: "lan1" },
  { label: "LAN2", value: "lan2" },
  { label: "LAN3", value: "lan3" },
] as const;

export default function PortForwardingRule({
  index,
  rule,
}: {
  index: number;
  rule: Rule;
}) {
  const ctx = useContext(PortForwardingContext);
  const [nameError, setNameError] = useState<string | null>(null);
  
const isInvalidDestAddr = !!rule.destAddr && !isValidIP(String(rule.destAddr).trim());


  if (!ctx) return null;

  const { updateRule, deleteRule } = ctx;

  const onChange = <K extends keyof Rule>(key: K, value: Rule[K]) => {
    if (key === "name") {
      const { value: parsed, error } = parseRuleName(value as string);
      setNameError(error);
      updateRule(index, { ...rule, name: error ? (value as string) : parsed });
    } else {
      updateRule(index, { ...rule, [key]: value });
    }
  };

  return (
    <RuleRow onDelete={<DeleteRuleButton onClick={() => deleteRule(index)} />}>
      <div className="space-y-1.5">
        <Label htmlFor={`pf-name-${index}`}>Name</Label>
        <Input
          id={`pf-name-${index}`}
          value={rule.name}
          className={nameError ? "border-destructive" : undefined}
          aria-invalid={!!nameError}
          onChange={(e) => onChange("name", e.target.value)}
        />
        {nameError && <p className="text-xs text-destructive">{nameError}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor={`pf-interface-${index}`}>Interface</Label>
        <Select
          value={rule.interface ?? ""}
          onValueChange={(value) => onChange("interface", value as Rule["interface"])}
        >
          <SelectTrigger id={`pf-interface-${index}`}>
            <SelectValue placeholder="Select" />
          </SelectTrigger>
          <SelectContent>
            {INTERFACE_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor={`pf-srcPort-${index}`}>Source Port</Label>
        <Input
          id={`pf-srcPort-${index}`}
          type="number"
          value={rule.srcPort}
          onChange={(e) => onChange("srcPort", e.target.value === "" ? undefined : Number(e.target.value))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor={`pf-destAddr-${index}`}>Destination IP</Label>
        <Input
          id={`pf-destAddr-${index}`}
          value={rule.destAddr ?? ""}
          onChange={(e) => onChange("destAddr", e.target.value as typeof rule.destAddr)}
          inputMode="numeric"
          placeholder="e.g. 192.168.1.100"
          className={isInvalidDestAddr ? "border-destructive" : undefined}
          aria-invalid={isInvalidDestAddr}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor={`pf-destPort-${index}`}>Destination Port</Label>
        <Input
          id={`pf-destPort-${index}`}
          type="number"
          value={rule.destPort}
          onChange={(e) => onChange("destPort", e.target.value === "" ? undefined : Number(e.target.value))}
        />
      </div>
    </RuleRow>
  );
}