import { useContext } from "react"
import { DeviceNatConfigRulesContext } from "./context"
import { DeleteRuleButton } from "../RuleConfigSection";


export function DeleteNatRule({index}: {index: number}) {
  const { deleteRule }  = useContext(DeviceNatConfigRulesContext)

  return <DeleteRuleButton onClick={() => deleteRule(index)} />
}
