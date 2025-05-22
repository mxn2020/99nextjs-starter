
"use client";

import type { UserActivityLog } from '@/lib/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
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
} from "@/components/ui/dialog";
import { Button } from '../ui/button';

interface UserActivityTableProps {
  logs: UserActivityLog[];
  totalLogs: number;
  currentPage: number;
  itemsPerPage: number;
  targetUserId: string; // Needed for constructing pagination links correctly
}

export default function UserActivityTable({
  logs,
  totalLogs,
  currentPage,
  itemsPerPage,
  targetUserId,
}: UserActivityTableProps) {
  const router = useRouter();
  const pathname = usePathname(); // Should be /admin/users/[userId]/activity
  const searchParams = useSearchParams();

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', newPage.toString());
    // The pathname already includes the userId, so no need to add it here for navigation
    router.push(`${pathname}?${params.toString()}`);
  };

  if (!logs || logs.length === 0) {
    return <p className="text-muted-foreground text-center py-4">No activity logs found for this user.</p>;
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Timestamp</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Actor ID</TableHead>
              <TableHead>Target Resource</TableHead>
              <TableHead className="text-right">Details</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.map((log) => (
              <TableRow key={log.id}>
                <TableCell>{new Date(log.created_at).toLocaleString()}</TableCell>
                <TableCell><Badge variant="outline">{log.activity_type}</Badge></TableCell>
                <TableCell className="max-w-xs truncate">{log.description || <span className="italic text-muted-foreground">N/A</span>}</TableCell>
                <TableCell className="font-mono text-xs">{log.actor_id || <span className="italic text-muted-foreground">System</span>}</TableCell>
                <TableCell className="font-mono text-xs">
                    {log.target_resource_type && log.target_resource_id ? 
                        `${log.target_resource_type}:${log.target_resource_id}` : 
                        <span className="italic text-muted-foreground">N/A</span>
                    }
                </TableCell>
                <TableCell className="text-right">
                  {log.details && (
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="sm"><Eye className="mr-1 h-4 w-4"/> View</Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-lg">
                        <DialogHeader>
                          <DialogTitle>Activity Details</DialogTitle>
                          <DialogDescription>
                            Detailed information for log ID: {log.id}
                          </DialogDescription>
                        </DialogHeader>
                        <div className="mt-4 max-h-96 overflow-y-auto">
                          <pre className="bg-muted p-3 rounded-md text-xs whitespace-pre-wrap break-all">
                            {JSON.stringify(log.details, null, 2)}
                          </pre>
                           <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                            <p><strong>IP Address:</strong> {log.ip_address || 'N/A'}</p>
                            <p><strong>User Agent:</strong> {log.user_agent || 'N/A'}</p>
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
    