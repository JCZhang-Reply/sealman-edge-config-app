import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { components } from "@/generated/edge-administration/types";
import { useState, useContext } from "react";
import { DeviceNatConfigRulesContext } from "./context";
import { DeleteNatRule } from "./DeleteNatRule";
import { parseRuleName } from "@/utils/parseRuleName";
import { RuleRow } from "../RuleConfigSection";

export default function NatRule({ index, rule }: {index: number, rule: components["schemas"]["NatRule"]}) {
  const { updateRule }  = useContext(DeviceNatConfigRulesContext)
  const [nameError, setNameError] = useState<string | null>(null)

  const handleOnChange = ({name, value}: {name: keyof components["schemas"]["NatRule"], value: string}) => {
    if (name === "name") {
      const { value: parsed, error } = parseRuleName(value)
      setNameError(error)
      updateRule({
        index,
        rule: {
          ...rule,
          name: error ? value : parsed,
        }
      })
    } else {
      updateRule({
        index,
        rule: {
          ...rule,
          [name]: value
        }
      })
    }
  }

  return (
    <RuleRow onDelete={<DeleteNatRule index={index}/>}>
      <div className="space-y-1.5">
        <Label htmlFor={`name-${index}`}>Name</Label>
        <Input
          id={`name-${index}`}
          value={rule.name}
          className={nameError ? "border-destructive" : undefined}
          aria-invalid={!!nameError}
          onChange={e => handleOnChange({
            name: "name",
            value: (e.target as HTMLInputElement).value
          })}
        />
        {nameError && <p className="text-xs text-destructive">{nameError}</p>}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor={`extIp-${index}`}>External IP</Label>
        <Input id={`extIp-${index}`} value={rule.extIp} placeholder="e.g. 10.0.0.10" onChange={e => handleOnChange({
          name: "extIp",
          value: (e.target as HTMLInputElement).value
        })}/>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor={`intIp-${index}`}>Internal IP</Label>
        <Input id={`intIp-${index}`} value={rule.intIp} placeholder="e.g. 192.168.1.100" onChange={e => handleOnChange({
          name: "intIp",
          value: (e.target as HTMLInputElement).value
        })}/>
      </div>
    </RuleRow>
  )
}
