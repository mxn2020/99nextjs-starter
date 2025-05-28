
"use client";

import { useState, useTransition } from 'react';
import { Button } from '@99packages/ui/components/button';
import { exportUserDataAction } from '@/server/user.actions';
import { toast } from 'sonner';
import { Download } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@99packages/ui/components/alert";
import { AlertCircle } from "lucide-react";

export default function ExportDataSection() {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleExport = async () => {
    setError(null);
    startTransition(async () => {
      try {
        const response = await exportUserDataAction();

        if (!response.ok) {
          // Try to parse error message from response body if it's JSON
          let errorMessage = `Failed to export data. Status: ${response.status}`;
          try {
            const errorData = await response.json();
            if (errorData && errorData.error) {
              errorMessage = errorData.error;
            }
          } catch (e) {
            // Ignore if response is not JSON
          }
          throw new Error(errorMessage);
        }
        
        // Handle file download
        const blob = await response.blob();
        const filenameHeader = response.headers.get('Content-Disposition');
        let filename = 'user_data.json'; // Default filename
        if (filenameHeader) {
            const parts = filenameHeader.split('filename=');
            if (parts.length > 1 && parts[1]) {
                filename = parts[1].replace(/"/g, '');
            }
        }

        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
        
        toast.success("Data export started. Your download should begin shortly.");

      } catch (err: any) {
        console.error("Export data error:", err);
        const message = err.message || "An unexpected error occurred during data export.";
        setError(message);
        toast.error(message);
      }
    });
  };

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Request a copy of your personal data stored in our application. This will include your profile information and activity logs. The data will be provided in JSON format.
      </p>
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Export Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <Button onClick={handleExport} disabled={isPending}>
        <Download className="mr-2 h-4 w-4" />
        {isPending ? 'Preparing Export...' : 'Export My Data'}
      </Button>
    </div>
  );
}
