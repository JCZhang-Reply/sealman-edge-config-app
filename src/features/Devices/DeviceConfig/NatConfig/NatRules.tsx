import React, { useContext } from "react";
import { DeviceNatConfigRulesContext } from "./context";
import NatRule from "./NatRule";
import SaveNat from "./SaveNatConfig";
import { RuleConfigSection } from "../RuleConfigSection";

export default function NatRules() {
  const { natConfig, addNatRule } = useContext(DeviceNatConfigRulesContext)
  const rules = natConfig?.nat_rules ?? []

  const handleOnClick = () => {
    addNatRule({extIp: "10.0.0.1", intIp: "127.0.0.1", name:"new_rule_name"})
  }

  return (
    <RuleConfigSection
      title="1:1 NAT"
      description="Map an external IP on LAN 2 to a machine IP on LAN 3. NAT is enabled automatically as soon as at least one rule is defined."
      onAdd={handleOnClick}
      isEmpty={rules.length === 0}
      emptyMessage="No NAT rules defined – 1:1 NAT is disabled."
      footer={<SaveNat />}
    >
      {rules.map((r, i) => (
        <React.Fragment key={i}>
          <NatRule index={i} rule={r}/>
        </React.Fragment>
      ))}
    </RuleConfigSection>
  )
}
