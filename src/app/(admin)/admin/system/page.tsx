
import { Suspense } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getSystemSettings } from '@/server/admin.actions';
import SystemSettingsForm from '@/components/admin/SystemSettingsForm';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { Skeleton } from '@/components/ui/skeleton';
export const dynamic = 'force-dynamic';
function SystemSettingsSkeleton() {
return (
<div className="space-y-6">
<Card>
<CardHeader>
<CardTitle><Skeleton className="h-6 w-48" /></CardTitle>
<CardDescription><Skeleton className="h-4 w-64" /></CardDescription>
</CardHeader>
<CardContent className="space-y-8">
{Array.from({ length: 3 }).map((_, i) => (
<section key={i} className="space-y-4 p-4 border rounded-lg">
<Skeleton className="h-6 w-32" />
<div className="space-y-4">
<div className="flex items-center justify-between py-2">
<div className="space-y-1">
<Skeleton className="h-4 w-40" />
<Skeleton className="h-3 w-64" />
</div>
<Skeleton className="h-6 w-12" />
</div>
<div className="space-y-2">
<Skeleton className="h-4 w-24" />
<Skeleton className="h-10 w-48" />
</div>
</div>
</section>
))}
<Skeleton className="h-10 w-32" />
</CardContent>
</Card>
</div>
);
}
async function SystemSettingsContent() {
const { settings, error } = await getSystemSettings();
if (error && !settings) {
return (
<div className="space-y-6">
<Card>
<CardHeader>
<CardTitle>System Settings</CardTitle>
<CardDescription>Configure global application settings and features.</CardDescription>
</CardHeader>
<CardContent>
<Alert variant="destructive">
<AlertCircle className="h-4 w-4" />
<AlertTitle>Error Loading Settings</AlertTitle>
<AlertDescription>{error || "Could not load system settings. Please try again later."}</AlertDescription>
</Alert>
</CardContent>
</Card>
</div>
);
}
return (
<div className="space-y-6">
<Card>
<CardHeader>
<CardTitle>System Settings</CardTitle>
<CardDescription>Configure global application settings and features.</CardDescription>
</CardHeader>
<CardContent>
{error && settings && Object.keys(settings).length === 0 && (
<Alert variant="destructive" className="mb-4">
<AlertCircle className="h-4 w-4" />
<AlertTitle>Notice</AlertTitle>
<AlertDescription>{error} Form will use default values. Saving will create the settings entry.</AlertDescription>
</Alert>
)}
<SystemSettingsForm currentSettings={settings || {}} />
</CardContent>
</Card>
</div>
);
}
export default function AdminSystemSettingsPage() {
return (
<Suspense fallback={<SystemSettingsSkeleton />}>
<SystemSettingsContent />
</Suspense>
);
}
