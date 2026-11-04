import { useParams } from "react-router-dom";
import { QueueListIcon } from "@heroicons/react/24/outline";
import { Heading } from "@/components/Typography/Heading";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DeviceSemsConfigExport } from "./SmartEmsConfigExport";
import useSmartEmsStatusPolling from "./useSmartEmsStatusPolling";

export default function CommandHistory() {
  const { deviceId } = useParams();
  const { data, isError, error, isFetching } = useSmartEmsStatusPolling(deviceId);

  const commands = (data?.edgeCommandStatus ?? []).filter((command) => command.cmdName !== "get_config");

  return (
    <div className="space-y-4">
      <Heading processing={isFetching}>
        <QueueListIcon className="w-7 h-7 mr-1" />
        Activity
      </Heading>

      <DeviceSemsConfigExport />

      {isError && <p className="text-sm text-destructive">{error.message}</p>}

      <div className="overflow-hidden rounded-lg border bg-background">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Command Name</TableHead>
              <TableHead>Command Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Updated</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {commands.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-muted-foreground">
                  No commands yet.
                </TableCell>
              </TableRow>
            ) : (
              commands.map((command, index) => {
                const ok = command.status === "success" || command.status === "pending";
                return (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{command.cmdName}</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={ok ? "border-green-300 bg-green-50 text-green-700" : "border-red-300 bg-red-50 text-red-700"}
                      >
                        {command.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{new Date(command.created).toLocaleString()}</TableCell>
                    <TableCell>{new Date(command.updated).toLocaleString()}</TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
