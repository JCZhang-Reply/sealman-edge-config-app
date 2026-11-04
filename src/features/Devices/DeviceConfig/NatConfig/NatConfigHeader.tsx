import { useContext, useMemo } from "react";
import { DeviceNatConfigRulesContext } from "./context";
import isVersionEligible from "@/utils/isVersionEligible";
import { WaterLoader } from "@/components/ui/water-loader";

interface props {
  children?: React.ReactNode
}

export default function NatConfigHeader({children}: props) {
  const { isLoading, smartEmsData } = useContext(DeviceNatConfigRulesContext)
  const elligible = useMemo(() => isVersionEligible(
    smartEmsData?.deviceFirmwareVersion ?? "", "1.6.0"),
  [smartEmsData?.deviceFirmwareVersion])

  const Message = ({ msg, loading }: { msg: string, loading?: boolean }) => (
    <div className="space-y-4 rounded-lg border bg-background p-4">
      <h2 className="text-lg font-semibold leading-none tracking-tight">1:1 NAT</h2>
      <p className="flex items-center gap-2 text-sm text-muted-foreground">
        {loading && <WaterLoader className="h-4 w-4" />}
        {msg}
      </p>
    </div>
  )

  if (isLoading) {
    return <Message msg="Loading..." loading />
  }

  if (!elligible) {
    return <Message msg="Your firmware version is not compatible for 1:1 NAT Configuration" />
  }

  return <>{children}</>
}
