import { db } from "@/lib/db";
import { AutoContainer } from "@/components/container/auto-container";
import { Header } from "@/components/container/header";
import { NoData } from "@/components/no-data";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const LogsList = async () => {
  const logs = await db.log.findMany();

  const noData = !logs || logs?.length === 0;

  return (
    <AutoContainer header={<Header title="Logs" backTo="/groups" />}>
      {noData ? (
        <NoData title="No logs found" />
      ) : (
        <div className="py-8">
          <Table>
            <TableCaption>List of logs.</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">Type</TableHead>
                <TableHead>Timestamp</TableHead>
                <TableHead>Message</TableHead>
                <TableHead>Body</TableHead>
                <TableHead>Created At</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="font-medium">{log.type}</TableCell>
                  <TableCell>{log.utcTime}</TableCell>
                  <TableCell>{log.message}</TableCell>
                  <TableCell>{(log?.body || "").toString("utf8")}</TableCell>
                  <TableCell>{String(log.createdAt)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </AutoContainer>
  );
};

export default LogsList;
