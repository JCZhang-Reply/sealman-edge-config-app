import React from "react";
import { CenteredAlertPanel } from "@/components/ui/centered-alert-panel";
import { Button } from "@/components/ui/button";

type MissingModulePanelProps = {
  moduleName: string;
  className?: string;
  onDismiss: () => void;
};

export const MissingModulePanel: React.FC<MissingModulePanelProps> = ({
  moduleName,
  className = "",
  onDismiss,
}) => {
  return (
    <CenteredAlertPanel title="Missing module" variant="warning" className={className}>
      Module "{moduleName}" is required for this functionality.
      <div className="mt-4">
        <Button variant="outline" onClick={onDismiss}>Dismiss</Button>
      </div>
    </CenteredAlertPanel>
  );
};
