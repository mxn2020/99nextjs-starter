
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getAdminAnalyticsData } from '@/server/admin.actions';
import AnalyticsDashboard from '@/components/admin/AnalyticsDashboard'; 

export const dynamic = 'force-dynamic'; // Ensure fresh data on each request

export default async function AdminAnalyticsPage() {
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
          {/* TODO: Implement actual charts and data display using a library - this TODO is in AnalyticsDashboard.tsx */}
        </CardContent>
      </Card>
    </div>
  );
}
