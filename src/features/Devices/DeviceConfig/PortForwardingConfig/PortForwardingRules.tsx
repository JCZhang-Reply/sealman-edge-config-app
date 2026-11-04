import { usePortForwardingConfig } from "./useContext";
import PortForwardingRule from "./PortForwardingRule";

export default function PortForwardingRules() {
  const { config } = usePortForwardingConfig();

  if (!config?.rules?.length) {
    return null;
  }

  return (
    <>
      {config.rules.map((rule, index) => (
        <PortForwardingRule
          key={index}
          index={index}
          rule={rule}
        />
      ))}
    </>
  );
}
