import { useState } from "react";
import PageTitle from "@/components/Typography/PageTitle";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const MOCK_REGISTRIES = ["docker.io", "acrsealman.azurecr.io", "ghcr.io"];

const SETTINGS = [
  { key: "allowNetworkScan", label: "Allow Network-Scan", description: "Let the Seal-Agent scan the local network for endpoints." },
  { key: "enableLocalLandingPage", label: "Enable Local Landing Page", description: "Serve a landing page directly on the device." },
  { key: "sendHealthData", label: "Send Health Data", description: "Report health metrics of the Seal-Agent to the platform." },
] as const;

type SettingKey = (typeof SETTINGS)[number]["key"];

// Mock values only - nothing is loaded from or saved to the backend yet.
export default function SealAgentSettings() {
  const [values, setValues] = useState<Record<SettingKey, boolean>>({
    allowNetworkScan: true,
    enableLocalLandingPage: false,
    sendHealthData: true,
  });
  const [registry, setRegistry] = useState(MOCK_REGISTRIES[0]);

  return (
    <div className="space-y-6">
      <PageTitle title="Seal-Agent" description="Default behaviour of the Seal-Agent running on your devices." />

      <div className="divide-y rounded-lg border bg-background shadow-xs">
        <div className="flex items-center justify-between gap-6 px-6 py-4">
          <div className="space-y-1">
            <Label htmlFor="containerRegistry">Container Registry</Label>
            <p className="text-sm text-muted-foreground">Registry the Seal-Agent pulls container images from.</p>
          </div>
          <Select value={registry} onValueChange={setRegistry}>
            <SelectTrigger id="containerRegistry" className="w-64">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MOCK_REGISTRIES.map((r) => (
                <SelectItem key={r} value={r}>
                  {r}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {SETTINGS.map(({ key, label, description }) => (
          <div key={key} className="flex items-center justify-between gap-6 px-6 py-4">
            <div className="space-y-1">
              <Label htmlFor={key} className="cursor-pointer">
                {label}
              </Label>
              <p className="text-sm text-muted-foreground">{description}</p>
            </div>
            <Switch
              id={key}
              checked={values[key]}
              onCheckedChange={(checked) => setValues((previous) => ({ ...previous, [key]: checked }))}
            />
          </div>
        ))}
      </div>

      <p className="text-xs text-muted-foreground">Preview only - these settings are not saved yet.</p>
    </div>
  );
}
