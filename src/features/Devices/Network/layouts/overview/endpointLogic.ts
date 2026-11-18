import { MappedEndpoint, MappedPort } from "@/generated/edge-administration/hooks/network/usePostNetworkOverview";
import { formatMetadataValue } from "@/features/PlatformTypes/FieldValueInput";
import useGetEndpointTypes from "@/generated/edge-administration/hooks/endpoint_types/useGetEndpointTypes";
import { endpointTitle, roleFieldKey, titleFieldKeys } from "./endpointDisplay";

/** Display rules shared by the list view and the canvas view, so both always show the same thing for an endpoint. */

export interface BrowseTarget {
  kind: string;
  ip: string;
  port: number;
}

export interface EndpointDisplay {
  isUnidentified: boolean;
  isConfigured: boolean;
  // Matches a configured endpoint type's default IP, but hasn't actually been assigned yet - it's
  // otherwise easy to mistake for a real, already-assigned endpoint (same icon/row styling), so
  // this needs its own visual highlight to make "still needs to be assigned" obvious at a glance.
  needsAssignment: boolean;
  title: string;
  subtitle: string;
}

export function useEndpointDisplay(endpoint: MappedEndpoint): EndpointDisplay {
  const isUnidentified = endpoint.source === "unidentified";
  const isConfigured = endpoint.source === "configured";
  const needsAssignment = endpoint.source === "default";
  // Roles come from the endpoint's type: the `name`-role value is the title, and the `ip`/`name`
  // role fields are shown in the title line rather than as extra info.
  const { data: endpointTypes } = useGetEndpointTypes();
  const mapping = endpointTypes?.find((t) => t.type_id === endpoint.type_id)?.mapping;
  const nameKey = roleFieldKey(mapping, "name");
  const nameValue = nameKey ? endpoint.endpoint_data?.[nameKey]?.value : undefined;
  const hasName = typeof nameValue === "string" && nameValue.trim() !== "";
  const title = endpointTitle({ typeLabel: endpoint.type_label, name: nameValue, ip: endpoint.ip });
  const shownInTitle = titleFieldKeys(mapping);

  // Extra endpoint type fields to show next to the IP address - each field's own "Show in
  // endpoints list" toggle (set on the endpoint type's field definition, see FieldsEditor.tsx)
  // decides this, not a separate settings page.
  const extraEndpointInfo = Object.entries(endpoint.endpoint_data ?? {})
    .filter(([key]) => !shownInTitle.has(key))
    .filter(([, resolved]) => resolved.field?.show_in_list && resolved.field.type !== "list")
    .map(([, resolved]) => (resolved.field ? formatMetadataValue(resolved.value, resolved.field) : null))
    .filter((value): value is string => Boolean(value));

  const subtitle = [endpoint.type_label && hasName ? endpoint.type_label : "", endpoint.ip ?? "", ...extraEndpointInfo]
    .filter((part) => part !== "")
    .join(" · ");

  return { isUnidentified, isConfigured, needsAssignment, title, subtitle };
}

/** "unidentified" (no service type matched at all) and "default" (matched a service type's default
 * port, but not yet a real assigned service instance) both still need someone to assign them -
 * highlight both the same way so they don't blend in with already-assigned ("configured") services. */
export function portNeedsAssignment(port: MappedPort): boolean {
  return port.source === "unidentified" || port.source === "default";
}
