"use client";

import type { UserActivityLog } from '@/lib/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@99packages/ui/components/table";
import { Badge } from '@99packages/ui/components/badge';
import PaginationControls from '@/components/common/PaginationControls';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { Eye } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@99packages/ui/components/dialog";
import { Button } from '@99packages/ui/components/button';
interface UserActivityTableProps {
  logs: UserActivityLog[];
  totalLogs: number;
  currentPage: number;
  itemsPerPage: number;
  targetUserId: string;
}
export default function UserActivityTable({
  logs,
  totalLogs,
  currentPage,
  itemsPerPage,
  targetUserId,
}: UserActivityTableProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', newPage.toString());
    router.push(`${pathname}?${params.toString()}`);
  };

  if (!logs || logs.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No activity logs found for this user.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-[160px]">Timestamp</TableHead>
              <TableHead className="min-w-[140px]">Type</TableHead>
              <TableHead className="min-w-[200px]">Description</TableHead>
              <TableHead className="min-w-[120px]">Actor ID</TableHead>
              <TableHead className="min-w-[140px]">Target Resource</TableHead>
              <TableHead className="text-right min-w-[80px]">Details</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.map((log) => (
              <TableRow key={log.id}>
                <TableCell className="whitespace-nowrap text-sm">
                  {new Date(log.created_at).toLocaleString()}
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="whitespace-nowrap text-xs">
                    {log.activity_type}
                  </Badge>
                </TableCell>
                <TableCell className="max-w-xs">
                  <div className="truncate">
                    {log.description || <span className="italic text-muted-foreground">N/A</span>}
                  </div>
                </TableCell>
                <TableCell className="font-mono text-xs break-all">
                  {log.actor_id ? (
                    <div className="max-w-[120px] truncate" title={log.actor_id}>
                      {log.actor_id}
                    </div>
                  ) : (
                    <span className="italic text-muted-foreground">System</span>
                  )}
                </TableCell>
                <TableCell className="font-mono text-xs">
                  {log.target_resource_type && log.target_resource_id ? (
                    <div className="max-w-[140px] truncate" title={`${log.target_resource_type}:${log.target_resource_id}`}>
                      {log.target_resource_type}:{log.target_resource_id}
                    </div>
                  ) : (
                    <span className="italic text-muted-foreground">N/A</span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  {log.details && (
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-16">
                          <Eye className="mr-1 h-4 w-4" />
                          <span className="sr-only sm:not-sr-only">View</span>
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
                        <DialogHeader className="flex-shrink-0">
                          <DialogTitle>Activity Details</DialogTitle>
                          <DialogDescription>
                            Detailed information for log ID: {log.id}
                          </DialogDescription>
                        </DialogHeader>
                        <div className="flex-1 overflow-y-auto space-y-4">
                          <div>
                            <h4 className="font-medium mb-2">JSON Details:</h4>
                            <pre className="bg-muted p-3 rounded-md text-xs whitespace-pre-wrap break-all overflow-x-auto">
                              {JSON.stringify(log.details, null, 2)}
                            </pre>
                          </div>
                          <div className="space-y-2 text-sm border-t pt-4">
                            <div className="flex flex-col sm:flex-row sm:justify-between">
                              <span className="font-medium">IP Address:</span>
                              <span className="text-muted-foreground font-mono break-all">
                                {log.ip_address || 'N/A'}
                              </span>
                            </div>
                            <div className="flex flex-col sm:flex-row sm:justify-between">
                              <span className="font-medium">User Agent:</span>
                              <span className="text-muted-foreground text-xs break-all max-w-xs">
                                {log.user_agent || 'N/A'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <PaginationControls
        currentPage={currentPage}
        totalItems={totalLogs}
        itemsPerPage={itemsPerPage}
        onPageChange={handlePageChange}
      />
    </div>
  );
}
