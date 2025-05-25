
import { Suspense } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getAdminAnalyticsData } from '@/server/admin.actions';
import AnalyticsDashboard from '@/components/admin/AnalyticsDashboard';
import AnalyticsSkeleton from '@/components/common/AnalyticsSkeleton';
export const dynamic = 'force-dynamic';
async function AnalyticsContent() {
const { data: analyticsData, error } = await getAdminAnalyticsData();
return (
<div className="space-y-6">
<Card>
<CardHeader>
<CardTitle>System Analytics</CardTitle>
<CardDescription>Key metrics and insights into application usage.</CardDescription>
</CardHeader>
<CardContent>
<AnalyticsDashboard analyticsData={analyticsData} error={error} />
</CardContent>
</Card>
</div>
);
}
export default function AdminAnalyticsPage() {
return (
<Suspense fallback={<AnalyticsSkeleton />}>
<AnalyticsContent />
</Suspense>
);
}
