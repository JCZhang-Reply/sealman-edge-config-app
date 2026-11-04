import React from "react";
import { CenteredAlertPanel } from "@/components/ui/centered-alert-panel";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

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
      <div className="mt-4 flex justify-center">
        <Button type="button" variant="outline" onClick={onDismiss}>
          <X aria-hidden="true" />
          Dismiss
        </Button>
      </div>
    </CenteredAlertPanel>
  );
};
