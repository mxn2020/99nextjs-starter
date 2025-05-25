
"use client";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useFormStatus } from 'react-dom';
import { saveSystemSettingsAction } from '@/server/admin.actions';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useActionState, useEffect, useRef, startTransition, useState } from 'react';
import { toast } from "sonner";
import { systemSettingsFormSchema } from "@/lib/schemas";
import type { SystemSettings } from "@/lib/types";
import { z } from "zod";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, CheckCircle2, Eye, EyeOff } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { FormFieldError } from '@/components/common/FormFieldError';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
type FormState = {
message: string | null;
errors?: Partial<Record<keyof SystemSettingsFormData | string, string[]>> | null;
success: boolean;
data?: SystemSettings;
};
const initialFormState: FormState = {
message: null,
errors: null,
success: false,
};
function SubmitButton() {
const { pending } = useFormStatus();
return (
<Button type="submit" disabled={pending} className="w-full sm:w-auto">
{pending ? (
<>
<LoadingSpinner size="sm" className="mr-2" />
Saving Settings...
</>
) : (
'Save Settings'
)}
</Button>
);
}
interface SystemSettingsFormProps {
currentSettings: SystemSettings;
}
type SystemSettingsFormData = z.infer<typeof systemSettingsFormSchema>;
export default function SystemSettingsForm({ currentSettings }: SystemSettingsFormProps) {
const [state, formAction, isActionPending] = useActionState<FormState, FormData>(
saveSystemSettingsAction,
initialFormState
);
const [showResendApiKey, setShowResendApiKey] = useState(false);
const [showSmtpPassword, setShowSmtpPassword] = useState(false);
const form = useForm<SystemSettingsFormData>({
    resolver: zodResolver(systemSettingsFormSchema),
    defaultValues: {
        feature_new_dashboard: currentSettings?.feature_new_dashboard ?? false,
        maintenance_mode: currentSettings?.maintenance_mode ?? false,
        default_items_per_page: currentSettings?.default_items_per_page ?? 10,
        email_provider: currentSettings?.email_provider ?? 'none',
        default_from_name: currentSettings?.default_from_name ?? '',
        email_provider_settings: {
            resend: {
                api_key: currentSettings?.email_provider_settings?.resend?.api_key ?? '',
                default_from_email: currentSettings?.email_provider_settings?.resend?.default_from_email ?? ''
            },
            smtp: {
                host: currentSettings?.email_provider_settings?.smtp?.host ?? '',
                port: currentSettings?.email_provider_settings?.smtp?.port ?? 587,
                user: currentSettings?.email_provider_settings?.smtp?.user ?? '',
                password: currentSettings?.email_provider_settings?.smtp?.password ?? '',
                secure: currentSettings?.email_provider_settings?.smtp?.secure ?? true,
                default_from_email: currentSettings?.email_provider_settings?.smtp?.default_from_email ?? ''
            }
        }
    },
});

const watchedEmailProvider = form.watch("email_provider");
const formRef = useRef<HTMLFormElement>(null);

useEffect(() => {
    if (state.message) {
        if (state.success) {
            toast.success(state.message);
            if (state.data) { 
                form.reset(state.data as any);
            }
        } else if (state.errors) {
             toast.error(state.message || "Please correct the errors below.");
            Object.keys(state.errors).forEach((key) => {
                const fieldPath = key.split('.') as any;
                const message = (state.errors as any)?.[key]?.[0];
                if (message) {
                    form.setError(fieldPath, { type: "server", message });
                }
            });
        } else {
             toast.error(state.message);
        }
    }
}, [state, form]);

useEffect(() => {
    form.reset({
        feature_new_dashboard: currentSettings?.feature_new_dashboard ?? false,
        maintenance_mode: currentSettings?.maintenance_mode ?? false,
        default_items_per_page: currentSettings?.default_items_per_page ?? 10,
        email_provider: currentSettings?.email_provider ?? 'none',
        default_from_name: currentSettings?.default_from_name ?? '',
        email_provider_settings: {
            resend: {
                api_key: currentSettings?.email_provider_settings?.resend?.api_key ?? '',
                default_from_email: currentSettings?.email_provider_settings?.resend?.default_from_email ?? ''
            },
            smtp: {
                host: currentSettings?.email_provider_settings?.smtp?.host ?? '',
                port: currentSettings?.email_provider_settings?.smtp?.port ?? 587,
                user: currentSettings?.email_provider_settings?.smtp?.user ?? '',
                password: currentSettings?.email_provider_settings?.smtp?.password ?? '',
                secure: currentSettings?.email_provider_settings?.smtp?.secure ?? true,
                default_from_email: currentSettings?.email_provider_settings?.smtp?.default_from_email ?? ''
            }
        }
    });
}, [currentSettings, form.reset]);

const onFormSubmit = (data: SystemSettingsFormData) => {
    if (formRef.current) {
        const formData = new FormData(formRef.current);
        startTransition(() => {
             formAction(formData);
        });
    }
};

return (
    <form
        ref={formRef}
        onSubmit={form.handleSubmit(onFormSubmit)}
        className="space-y-8"
    >
        {state.message && !state.success && !state.errors && (
            <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" /> <AlertTitle>Error</AlertTitle>
                <AlertDescription>{state.message}</AlertDescription>
            </Alert>
        )}
        {state.message && state.success && (
            <Alert variant="default" className="bg-green-50 dark:bg-green-900/30 border-green-300 dark:border-green-700 text-green-700 dark:text-green-400">
                <CheckCircle2 className="h-4 w-4" /> <AlertTitle>Success</AlertTitle>
                <AlertDescription>{state.message}</AlertDescription>
            </Alert>
        )}

        <section className="space-y-4 p-4 border rounded-lg">
            <h3 className="text-lg font-medium mb-3 text-primary border-b pb-2">Feature Flags</h3>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
                <div>
                    <Label htmlFor="feature_new_dashboard_switch" className="font-semibold">Enable New Dashboard UI</Label>
                    <p className="text-xs text-muted-foreground">Toggle the new experimental dashboard design for all users.</p>
                </div>
                <Controller name="feature_new_dashboard" control={form.control} render={({ field }) => (
                    <Switch id="feature_new_dashboard_switch" checked={field.value} onCheckedChange={field.onChange} />
                )}/>
                <input type="hidden" name="feature_new_dashboard" value={form.watch("feature_new_dashboard") ? "true" : "false"} />
            </div>
            <FormFieldError message={form.formState.errors.feature_new_dashboard?.message} />
            
            <Separator />
            
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
                <div>
                    <Label htmlFor="feature_maintenance_mode_switch" className="font-semibold">Enable Maintenance Mode</Label>
                    <p className="text-xs text-muted-foreground">Temporarily disable access to the app for non-admins.</p>
                </div>
                <Controller name="maintenance_mode" control={form.control} render={({ field }) => (
                    <Switch id="feature_maintenance_mode_switch" checked={field.value} onCheckedChange={field.onChange} />
                )}/>
                <input type="hidden" name="maintenance_mode" value={form.watch("maintenance_mode") ? "true" : "false"} />
            </div>
            <FormFieldError message={form.formState.errors.maintenance_mode?.message} />
        </section>

        <section className="space-y-4 p-4 border rounded-lg">
            <h3 className="text-lg font-medium mb-3 text-primary border-b pb-2">General Settings</h3>
            <div className="space-y-2">
                <Label htmlFor="default_items_per_page" className="font-semibold">Default Items Per Page</Label>
                <Input 
                    id="default_items_per_page" 
                    type="number" 
                    {...form.register("default_items_per_page")} 
                    className="max-w-xs"
                    aria-invalid={form.formState.errors.default_items_per_page ? "true" : "false"}
                />
                <p className="text-xs text-muted-foreground">Default number of items shown in paginated lists (e.g., users table). Min 5, Max 100.</p>
                <FormFieldError message={form.formState.errors.default_items_per_page?.message} />
            </div>
        </section>

        <section className="space-y-4 p-4 border rounded-lg">
            <h3 className="text-lg font-medium mb-3 text-primary border-b pb-2">Email Configuration</h3>
            <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Security Recommendation</AlertTitle>
                <AlertDescription>
                    Storing API keys or passwords directly in database settings is not recommended for production. 
                    Consider using server-side environment variables or a dedicated secrets manager.
                </AlertDescription>
            </Alert>
            
            <div className="space-y-2">
                <Label htmlFor="email_provider_select" className="font-semibold">Email Provider</Label>
                <Controller name="email_provider" control={form.control} render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger id="email_provider_select" className="max-w-xs">
                            <SelectValue placeholder="Select email provider" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="none">None (Disable Emails)</SelectItem>
                            <SelectItem value="resend">Resend</SelectItem>
                            <SelectItem value="smtp">SMTP</SelectItem>
                        </SelectContent>
                    </Select>
                )}/>
                <FormFieldError message={form.formState.errors.email_provider?.message} />
            </div>
            
            <div className="space-y-2">
                <Label htmlFor="default_from_name" className="font-semibold">Default "From" Name</Label>
                <Input 
                    id="default_from_name" 
                    {...form.register("default_from_name")} 
                    placeholder="e.g., MyApp Notifications" 
                    className="max-w-md"
                    aria-invalid={form.formState.errors.default_from_name ? "true" : "false"}
                />
                <p className="text-xs text-muted-foreground">The name emails will appear to be sent from.</p>
                <FormFieldError message={form.formState.errors.default_from_name?.message} />
            </div>

            {watchedEmailProvider === 'resend' && (
                <div className="space-y-3 p-3 border rounded-md bg-muted/20 animate-in slide-in-from-top-2 duration-300">
                    <h4 className="text-md font-semibold text-secondary-foreground">Resend Settings</h4>
                    <div className="relative space-y-2">
                        <Label htmlFor="resend_api_key">Resend API Key</Label>
                        <div className="relative">
                            <Input 
                                id="resend_api_key" 
                                type={showResendApiKey ? "text" : "password"} 
                                {...form.register("email_provider_settings.resend.api_key")} 
                                placeholder="re_..."
                                className="pr-10"
                                aria-invalid={form.formState.errors.email_provider_settings?.resend?.api_key ? "true" : "false"}
                            />
                            <Button 
                                type="button" 
                                variant="ghost" 
                                size="sm" 
                                className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0" 
                                onClick={() => setShowResendApiKey(!showResendApiKey)}
                            >
                                {showResendApiKey ? <EyeOff className="h-4 w-4"/> : <Eye className="h-4 w-4"/>}
                            </Button>
                        </div>
                        <FormFieldError message={form.formState.errors.email_provider_settings?.resend?.api_key?.message} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="resend_default_from_email">Resend Default "From" Email</Label>
                        <Input 
                            id="resend_default_from_email" 
                            type="email" 
                            {...form.register("email_provider_settings.resend.default_from_email")} 
                            placeholder="e.g., delivery@resend.dev or you@yourdomain.com"
                            aria-invalid={form.formState.errors.email_provider_settings?.resend?.default_from_email ? "true" : "false"}
                        />
                        <FormFieldError message={form.formState.errors.email_provider_settings?.resend?.default_from_email?.message} />
                    </div>
                </div>
            )}

            {watchedEmailProvider === 'smtp' && (
                <div className="space-y-3 p-3 border rounded-md bg-muted/20 animate-in slide-in-from-top-2 duration-300">
                    <h4 className="text-md font-semibold text-secondary-foreground">SMTP Settings</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="smtp_host">SMTP Host</Label>
                            <Input 
                                id="smtp_host" 
                                {...form.register("email_provider_settings.smtp.host")} 
                                placeholder="e.g., smtp.mailprovider.com"
                                aria-invalid={form.formState.errors.email_provider_settings?.smtp?.host ? "true" : "false"}
                            />
                            <FormFieldError message={form.formState.errors.email_provider_settings?.smtp?.host?.message} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="smtp_port">SMTP Port</Label>
                            <Input 
                                id="smtp_port" 
                                type="number" 
                                {...form.register("email_provider_settings.smtp.port")} 
                                placeholder="e.g., 587 or 465"
                                aria-invalid={form.formState.errors.email_provider_settings?.smtp?.port ? "true" : "false"}
                            />
                            <FormFieldError message={form.formState.errors.email_provider_settings?.smtp?.port?.message} />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="smtp_user">SMTP Username</Label>
                        <Input 
                            id="smtp_user" 
                            {...form.register("email_provider_settings.smtp.user")}
                            aria-invalid={form.formState.errors.email_provider_settings?.smtp?.user ? "true" : "false"}
                        />
                        <FormFieldError message={form.formState.errors.email_provider_settings?.smtp?.user?.message} />
                    </div>
                    <div className="relative space-y-2">
                        <Label htmlFor="smtp_password">SMTP Password</Label>
                        <div className="relative">
                            <Input 
                                id="smtp_password" 
                                type={showSmtpPassword ? "text" : "password"} 
                                {...form.register("email_provider_settings.smtp.password")}
                                className="pr-10"
                                aria-invalid={form.formState.errors.email_provider_settings?.smtp?.password ? "true" : "false"}
                            />
                            <Button 
                                type="button" 
                                variant="ghost" 
                                size="sm" 
                                className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0" 
                                onClick={() => setShowSmtpPassword(!showSmtpPassword)}
                            >
                                {showSmtpPassword ? <EyeOff className="h-4 w-4"/> : <Eye className="h-4 w-4"/>}
                            </Button>
                        </div>
                        <FormFieldError message={form.formState.errors.email_provider_settings?.smtp?.password?.message} />
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
                        <Label htmlFor="smtp_secure_switch">Use SSL/TLS (Secure)</Label>
                        <div>
                            <Controller name="email_provider_settings.smtp.secure" control={form.control} render={({ field }) => (
                                <Switch id="smtp_secure_switch" checked={field.value} onCheckedChange={field.onChange} />
                            )}/>
                            <input type="hidden" name="email_provider_settings.smtp.secure" value={form.watch("email_provider_settings.smtp.secure") ? "true" : "false"} />
                        </div>
                    </div>
                    <FormFieldError message={form.formState.errors.email_provider_settings?.smtp?.secure?.message} />
                    <div className="space-y-2">
                        <Label htmlFor="smtp_default_from_email">SMTP Default "From" Email</Label>
                        <Input 
                            id="smtp_default_from_email" 
                            type="email" 
                            {...form.register("email_provider_settings.smtp.default_from_email")} 
                            placeholder="e.g., no-reply@yourdomain.com"
                            aria-invalid={form.formState.errors.email_provider_settings?.smtp?.default_from_email ? "true" : "false"}
                        />
                        <FormFieldError message={form.formState.errors.email_provider_settings?.smtp?.default_from_email?.message} />
                    </div>
                </div>
            )}
        </section>

        <div className="pt-4"> <SubmitButton /> </div>
    </form>
);
}
