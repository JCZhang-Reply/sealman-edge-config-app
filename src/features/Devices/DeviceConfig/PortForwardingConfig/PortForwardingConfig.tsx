import { usePortForwardingConfig } from "./useContext";
import PortForwardingRules from "./PortForwardingRules";
import { RuleConfigSection } from "../RuleConfigSection";


export default function PortForwardingConfig({ footer }: { footer?: React.ReactNode }) {
  const { config, addRule } = usePortForwardingConfig();

  return (
    <RuleConfigSection
      title="Port Forwarding"
      description="Forward incoming traffic on a port of an interface to a port of a device in the network."
      onAdd={() =>
        addRule({
          name: "",
          interface: "",
          srcPort: 0,
          destAddr: "",
          destPort: 0,
        })
      }
      isEmpty={!config?.rules?.length}
      emptyMessage="No port forwarding rules defined."
      footer={footer}
    >
      <PortForwardingRules />
    </RuleConfigSection>
  );
}
