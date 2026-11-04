import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { TrashIcon } from "@heroicons/react/24/outline";
import { edgeConfigApiHooks } from "@/api/edgeConfig/edgeConfigApiHooks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ErrorState, LoadingState } from "@/components/ui/page-state";
import { getErrorMessage } from "@/lib/errors";

export type PresetTemplateVariable = { name: string; defaultValue: string; deleteWarning?: string };

export const IOTEDGE_REGISTRY_VARIABLES: PresetTemplateVariable[] = [
  { name: "iotedge_registry_url", defaultValue: "docker.io" },
  { name: "iotedge_registry_username", defaultValue: "" },
  { name: "iotedge_registry_password", defaultValue: "" },
];

export const IOTEDGE_AGENT_VARIABLES: PresetTemplateVariable[] = [
  { name: "edge_agent_image", defaultValue: "mcr.microsoft.com/azureiotedge-agent:1.4" },
];

export const SEALMAN_EMS_VARIABLES: PresetTemplateVariable[] = [
  {
    name: "sems_device_url",
    defaultValue: "sems.localhost",
    deleteWarning:
      "Deleting this variable resets the SEMS URL on all devices to the template default. Devices may lose their connection to SEMS and can then no longer receive any configuration.",
  },
  { name: "sems_polling_interval", defaultValue: "600" },
];

const PRESET_VARIABLE_NAMES: string[] = [
  ...IOTEDGE_REGISTRY_VARIABLES,
  ...IOTEDGE_AGENT_VARIABLES,
  ...SEALMAN_EMS_VARIABLES,
].map((v) => v.name);

export function TemplateVariableRow({
  name,
  value,
  onSave,
  onDelete,
  saving,
  placeholder,
}: {
  name: string;
  value: string;
  onSave: (name: string, value: string) => void;
  onDelete: (name: string) => void;
  saving: boolean;
  placeholder?: string;
}) {
  const [draft, setDraft] = useState(value);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  const isDirty = draft !== value;

  return (
    <tr className="bg-background hover:bg-muted/40 transition-colors border-b last:border-b-0">
      <td className="px-4 py-3 font-mono text-sm text-muted-foreground">{name}</td>
      <td className="px-3 py-2">
        <Input
          type={name.includes("password") || name.includes("encoded") ? "password" : "text"}
          value={draft}
          placeholder={placeholder}
          onChange={(e) => setDraft(e.target.value)}
        />
      </td>
      <td className="px-3 py-2 text-right whitespace-nowrap">
        <Button
          size="sm"
          onClick={() => onSave(name, draft)}
          disabled={!isDirty || saving}
          className="mr-2"
        >
          Save
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onDelete(name)}
          disabled={saving}
          className="text-muted-foreground hover:text-destructive"
          title={`Delete ${name}`}
        >
          <TrashIcon />
        </Button>
      </td>
    </tr>
  );
}

export function DeviceTemplateVariablesSection() {
  const { variablesQuery, setVariableMutation, deleteVariableMutation } =
    edgeConfigApiHooks.useDeviceTemplateVariables();

  const [newName, setNewName] = useState("");
  const [newValue, setNewValue] = useState("");

  const variables = variablesQuery.data ?? {};

  const handleSave = (name: string, value: string) => {
    setVariableMutation.mutate(
      { name, value },
      {
        onError: () => toast.error(`Could not save "${name}"`),
      }
    );
  };

  const handleDelete = (name: string) => {
    deleteVariableMutation.mutate(name, {
      onError: () => toast.error(`Could not delete "${name}"`),
    });
  };

  const handleAdd = () => {
    const name = newName.trim();
    if (!name) return;
    if (name in variables) {
      toast.error(`"${name}" already exists`);
      return;
    }
    setVariableMutation.mutate(
      { name, value: newValue },
      {
        onSuccess: () => {
          setNewName("");
          setNewValue("");
        },
        onError: () => toast.error(`Could not add "${name}"`),
      }
    );
  };

  if (variablesQuery.isLoading) return <LoadingState label="Loading template variables..." />;
  if (variablesQuery.isError) return <ErrorState title="Could not load template variables" message={getErrorMessage(variablesQuery.error)} onRetry={() => variablesQuery.refetch()} />;

  const saving = setVariableMutation.isPending || deleteVariableMutation.isPending;

  return (
    <div className="bg-card border rounded-lg p-4 space-y-4">
      <p className="text-sm text-muted-foreground">
        These variables are applied to all existing devices and to every new device during creation.
      </p>

      <div className="border rounded-md overflow-hidden">
        <table className="w-full text-sm border-separate border-spacing-0">
          <thead>
            <tr className="bg-gradient-to-r from-slate-100 to-slate-50">
              <th className="px-4 py-3 text-left font-semibold text-muted-foreground border-b w-1/3">
                Variable
              </th>
              <th className="px-4 py-3 text-left font-semibold text-muted-foreground border-b">
                Value
              </th>
              <th className="px-4 py-3 border-b" />
            </tr>
          </thead>
          <tbody>
            {Object.entries(variables)
              .filter(([name]) => !PRESET_VARIABLE_NAMES.includes(name))
              .map(([name, value]) => (
              <TemplateVariableRow
                key={name}
                name={name}
                value={value}
                onSave={handleSave}
                onDelete={handleDelete}
                saving={saving}
              />
            ))}
            <tr className="bg-muted/20">
              <td className="px-4 py-3">
                <Input
                  placeholder="New variable name"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                />
              </td>
              <td className="px-3 py-2">
                <Input
                  placeholder="Value"
                  value={newValue}
                  onChange={(e) => setNewValue(e.target.value)}
                />
              </td>
              <td className="px-3 py-2 text-right">
                <Button
                  size="sm"
                  onClick={handleAdd}
                  disabled={!newName.trim() || saving}
                >
                  Add
                </Button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
