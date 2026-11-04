import { components } from "@/generated/edge-administration/types";
import { createContext } from "react";

export interface NatConfigRulesContextType {
  natConfig?: components["schemas"]["NatConfig"];
  smartEmsData?: components["schemas"]["SemsFirmwareStatus"],
  addNatRule: (rule: components["schemas"]["NatRule"]) => void;
  updateRule: ({index, rule}: {index: number, rule: components["schemas"]["NatRule"]}) => void
  deleteRule: (index: number) => void,
  postConfig: () => Promise<void>,
  isLoading: boolean,
  postIsPending: boolean,
  deviceId: string,
}

export const DeviceNatConfigRulesContext = createContext({} as NatConfigRulesContextType)
