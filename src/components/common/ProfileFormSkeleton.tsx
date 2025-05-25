
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
export default function ProfileFormSkeleton() {
return (
<div className="max-w-2xl mx-auto">
<Card>
<CardHeader>
<CardTitle><Skeleton className="h-6 w-48" /></CardTitle>
<CardDescription><Skeleton className="h-4 w-64" /></CardDescription>
</CardHeader>
<CardContent className="space-y-6">
<div className="space-y-2">
<Skeleton className="h-4 w-12" />
<Skeleton className="h-10 w-full" />
</div>
      <div className="flex flex-col items-center space-y-4">
        <Skeleton className="w-32 h-32 rounded-full" />
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-3 w-48" />
      </div>

      <div className="space-y-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-10 w-full" />
      </div>

      <Skeleton className="h-10 w-32" />
    </CardContent>
  </Card>
</div>
);
}
