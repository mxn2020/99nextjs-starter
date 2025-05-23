
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getSystemSettings } from '@/server/admin.actions'; 
import SystemSettingsForm from '@/components/admin/SystemSettingsForm'; 
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

export const dynamic = 'force-dynamic'; // Ensure fresh data on each request

export default async function AdminSystemSettingsPage() {
  const { settings, error } = await getSystemSettings();

  // Case 1: Critical error fetching settings (e.g., DB connection issue, admin auth failure)
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
  
  // Case 2: Settings might be "not found" but an empty object is returned, allowing form to use defaults.
  // Or settings are successfully fetched.
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
          {/* Pass settings (even if empty object from error case) to the form */}
          <SystemSettingsForm currentSettings={settings || {}} />
        </CardContent>
      </Card>
    </div>
  );
}
