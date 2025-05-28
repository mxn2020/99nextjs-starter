
import { Skeleton } from "@99packages/ui/components/skeleton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@99packages/ui/components/card";
export default function AnalyticsSkeleton() {
return (
<div className="space-y-6">
<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
{Array.from({ length: 4 }).map((_, i) => (
<Card key={i}>
<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
<CardTitle className="text-sm font-medium"><Skeleton className="h-4 w-24" /></CardTitle>
<Skeleton className="h-4 w-4" />
</CardHeader>
<CardContent>
<div className="text-2xl font-bold"><Skeleton className="h-8 w-16" /></div>
<p className="text-xs text-muted-foreground"><Skeleton className="h-3 w-32" /></p>
</CardContent>
</Card>
))}
</div>
  <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
    <Card className="col-span-1 lg:col-span-2">
      <CardHeader>
        <div className="flex items-center space-x-2 mb-1">
          <Skeleton className="h-5 w-5" />
          <CardTitle><Skeleton className="h-6 w-64" /></CardTitle>
        </div>
        <CardDescription><Skeleton className="h-4 w-48" /></CardDescription>
      </CardHeader>
      <CardContent className="min-h-[350px] pl-2">
        <Skeleton className="h-full w-full" />
      </CardContent>
    </Card>

    <Card>
      <CardHeader>
        <div className="flex items-center space-x-2 mb-1">
          <Skeleton className="h-5 w-5" />
          <CardTitle><Skeleton className="h-6 w-48" /></CardTitle>
        </div>
        <CardDescription><Skeleton className="h-4 w-56" /></CardDescription>
      </CardHeader>
      <CardContent className="min-h-[350px] flex items-center justify-center">
        <Skeleton className="w-64 h-64 rounded-full" />
      </CardContent>
    </Card>
    
    <Card>
      <CardHeader>
        <div className="flex items-center space-x-2 mb-1">
          <Skeleton className="h-5 w-5" />
          <CardTitle><Skeleton className="h-6 w-32" /></CardTitle>
        </div>
        <CardDescription><Skeleton className="h-4 w-40" /></CardDescription>
      </CardHeader>
      <CardContent className="min-h-[350px] flex flex-col justify-center space-y-2">
        <div className="text-sm space-y-2">
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-4 w-40" />
        </div>
        <div className="my-3">
          <Skeleton className="h-px w-full" />
        </div>
        <Skeleton className="h-3 w-64" />
      </CardContent>
    </Card>
  </div>
</div>
);
}
