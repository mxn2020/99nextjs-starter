
import { Skeleton } from "@/components/ui/skeleton";
import {
Table,
TableBody,
TableCell,
TableHead,
TableHeader,
TableRow,
} from "@/components/ui/table";
export default function ActivityLogSkeleton() {
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
{Array.from({ length: 5 }).map((_, i) => (
<TableRow key={i}>
<TableCell><Skeleton className="h-4 w-32" /></TableCell>
<TableCell><Skeleton className="h-5 w-24" /></TableCell>
<TableCell><Skeleton className="h-4 w-48" /></TableCell>
<TableCell><Skeleton className="h-4 w-20" /></TableCell>
<TableCell><Skeleton className="h-4 w-24" /></TableCell>
<TableCell className="text-right"><Skeleton className="h-8 w-16" /></TableCell>
</TableRow>
))}
</TableBody>
</Table>
</div>
  <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
    <Skeleton className="h-4 w-48" />
    <div className="flex items-center space-x-1">
      {Array.from({ length: 7 }).map((_, i) => (
        <Skeleton key={i} className="h-8 w-8" />
      ))}
    </div>
  </div>
</div>
);
}
