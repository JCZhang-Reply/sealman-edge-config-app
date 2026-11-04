
import { components } from "@/generated/edge-administration/types";
import {  NatConfigRulesContextType } from "../context";

export const saveNat = vi.fn()
export const addNatRule = vi.fn()
export const updateRule = vi.fn()
export const deleteRule = vi.fn()
export const postConfig = vi.fn()


export const ctx: NatConfigRulesContextType = {
  addNatRule,
  natConfig:  {
    nat_enabled: false,
    nat_rules: [{extIp: "1", intIp: "1", name: "name"}]
  } as components["schemas"]["NatConfig"],
  updateRule,
  deleteRule,
  postConfig,
  isLoading: false,
  postIsPending: false,
  deviceId: "deviceId",
  
}
