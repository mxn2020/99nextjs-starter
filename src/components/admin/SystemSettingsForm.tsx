
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
import { systemSettingsFormSchema, systemSettingsSchema } from "@/lib/schemas";
import type { SystemSettings, EmailProviderType } from "@/lib/types";
import { z } from "zod";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, CheckCircle2, Eye, EyeOff } from "lucide-react";
import { Separator } from "@/components/ui/separator";

type FormState = {
    message: string | null;
    errors?: Partial<Record<keyof SystemSettingsFormData | string, string[]>> | null; // Allow nested paths for errors
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
            {pending ? 'Saving Settings...' : 'Save Settings'}
        </Button>
    );
}

interface SystemSettingsFormProps {
    currentSettings: SystemSettings;
}
type SystemSettingsFormData = z.infer<typeof systemSettingsSchema>;

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
                    form.reset(state.data as any); // Type assertion needed due to complex nested structure
                }
            } else if (state.errors) {
                 toast.error(state.message || "Please correct the errors below.");
                Object.keys(state.errors).forEach((key) => {
                    const fieldPath = key.split('.') as any; // Handle nested paths like 'email_provider_settings.resend.api_key'
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
        form.reset({ // Ensure form resets with potentially nested currentSettings
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

            {/* Feature Flags Section */}
            <section className="space-y-4 p-4 border rounded-lg">
                <h3 className="text-lg font-medium mb-3 text-primary border-b pb-2">Feature Flags</h3>
                <div className="flex items-center justify-between py-2">
                    <div>
                        <Label htmlFor="feature_new_dashboard_switch" className="font-semibold">Enable New Dashboard UI</Label>
                        <p className="text-xs text-muted-foreground">Toggle the new experimental dashboard design for all users.</p>
                    </div>
                    <Controller name="feature_new_dashboard" control={form.control} render={({ field }) => (
                        <Switch id="feature_new_dashboard_switch" checked={field.value} onCheckedChange={field.onChange} />
                    )}/>
                    {/* Hidden input for form submission */}
                    <input type="hidden" name="feature_new_dashboard" value={form.watch("feature_new_dashboard") ? "true" : "false"} />
                </div>
                {form.formState.errors.feature_new_dashboard && <p className="text-sm text-destructive">{form.formState.errors.feature_new_dashboard.message}</p>}
                <Separator />
                <div className="flex items-center justify-between py-2">
                    <div>
                        <Label htmlFor="feature_maintenance_mode_switch" className="font-semibold">Enable Maintenance Mode</Label>
                        <p className="text-xs text-muted-foreground">Temporarily disable access to the app for non-admins.</p>
                    </div>
                    <Controller name="maintenance_mode" control={form.control} render={({ field }) => (
                        <Switch id="feature_maintenance_mode_switch" checked={field.value} onCheckedChange={field.onChange} />
                    )}/>
                    {/* Hidden input for form submission */}
                    <input type="hidden" name="maintenance_mode" value={form.watch("maintenance_mode") ? "true" : "false"} />
                </div>
                {form.formState.errors.maintenance_mode && <p className="text-sm text-destructive">{form.formState.errors.maintenance_mode.message}</p>}
            </section>

            {/* General Settings Section */}
            <section className="space-y-4 p-4 border rounded-lg">
                <h3 className="text-lg font-medium mb-3 text-primary border-b pb-2">General Settings</h3>
                <div className="py-2">
                    <Label htmlFor="default_items_per_page" className="font-semibold">Default Items Per Page</Label>
                    <Input id="default_items_per_page" type="number" {...form.register("default_items_per_page")} className="max-w-xs mt-1" />
                    <p className="text-xs text-muted-foreground mt-1">Default number of items shown in paginated lists (e.g., users table). Min 5, Max 100.</p>
                    {form.formState.errors.default_items_per_page && <p className="text-sm text-destructive mt-1">{form.formState.errors.default_items_per_page.message}</p>}
                </div>
            </section>

            {/* Email Configuration Section */}
            <section className="space-y-4 p-4 border rounded-lg">
                <h3 className="text-lg font-medium mb-3 text-primary border-b pb-2">Email Configuration</h3>
                 {/* TODO: Add a warning about storing sensitive keys in the DB */}
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
                    {form.formState.errors.email_provider && <p className="text-sm text-destructive mt-1">{form.formState.errors.email_provider.message}</p>}
                </div>
                <div className="space-y-2">
                    <Label htmlFor="default_from_name" className="font-semibold">Default "From" Name</Label>
                    <Input id="default_from_name" {...form.register("default_from_name")} placeholder="e.g., MyApp Notifications" className="max-w-md"/>
                    <p className="text-xs text-muted-foreground">The name emails will appear to be sent from.</p>
                    {form.formState.errors.default_from_name && <p className="text-sm text-destructive mt-1">{form.formState.errors.default_from_name.message}</p>}
                </div>

                {watchedEmailProvider === 'resend' && (
                    <div className="space-y-3 p-3 border rounded-md bg-muted/20 animate-fadeIn">
                        <h4 className="text-md font-semibold text-secondary-foreground">Resend Settings</h4>
                        <div className="relative">
                            <Label htmlFor="resend_api_key">Resend API Key</Label>
                            <Input id="resend_api_key" type={showResendApiKey ? "text" : "password"} {...form.register("email_provider_settings.resend.api_key")} placeholder="re_..."/>
                            <Button type="button" variant="ghost" size="sm" className="absolute right-1 top-7" onClick={() => setShowResendApiKey(!showResendApiKey)}>
                                {showResendApiKey ? <EyeOff className="h-4 w-4"/> : <Eye className="h-4 w-4"/>}
                            </Button>
                        </div>
                         {form.formState.errors.email_provider_settings?.resend?.api_key && <p className="text-sm text-destructive">{form.formState.errors.email_provider_settings.resend.api_key.message}</p>}
                        <div>
                            <Label htmlFor="resend_default_from_email">Resend Default "From" Email</Label>
                            <Input id="resend_default_from_email" type="email" {...form.register("email_provider_settings.resend.default_from_email")} placeholder="e.g., delivery@resend.dev or you@yourdomain.com"/>
                        </div>
                        {form.formState.errors.email_provider_settings?.resend?.default_from_email && <p className="text-sm text-destructive">{form.formState.errors.email_provider_settings.resend.default_from_email.message}</p>}
                    </div>
                )}

                {watchedEmailProvider === 'smtp' && (
                    <div className="space-y-3 p-3 border rounded-md bg-muted/20 animate-fadeIn">
                        <h4 className="text-md font-semibold text-secondary-foreground">SMTP Settings</h4>
                        <div><Label htmlFor="smtp_host">SMTP Host</Label><Input id="smtp_host" {...form.register("email_provider_settings.smtp.host")} placeholder="e.g., smtp.mailprovider.com"/></div>
                        {form.formState.errors.email_provider_settings?.smtp?.host && <p className="text-sm text-destructive">{form.formState.errors.email_provider_settings.smtp.host.message}</p>}
                        <div><Label htmlFor="smtp_port">SMTP Port</Label><Input id="smtp_port" type="number" {...form.register("email_provider_settings.smtp.port")} placeholder="e.g., 587 or 465"/></div>
                        {form.formState.errors.email_provider_settings?.smtp?.port && <p className="text-sm text-destructive">{form.formState.errors.email_provider_settings.smtp.port.message}</p>}
                        <div><Label htmlFor="smtp_user">SMTP Username</Label><Input id="smtp_user" {...form.register("email_provider_settings.smtp.user")} /></div>
                        {form.formState.errors.email_provider_settings?.smtp?.user && <p className="text-sm text-destructive">{form.formState.errors.email_provider_settings.smtp.user.message}</p>}
                        <div className="relative">
                            <Label htmlFor="smtp_password">SMTP Password</Label>
                            <Input id="smtp_password" type={showSmtpPassword ? "text" : "password"} {...form.register("email_provider_settings.smtp.password")} />
                            <Button type="button" variant="ghost" size="sm" className="absolute right-1 top-7" onClick={() => setShowSmtpPassword(!showSmtpPassword)}>
                                {showSmtpPassword ? <EyeOff className="h-4 w-4"/> : <Eye className="h-4 w-4"/>}
                            </Button>
                        </div>
                        {form.formState.errors.email_provider_settings?.smtp?.password && <p className="text-sm text-destructive">{form.formState.errors.email_provider_settings.smtp.password.message}</p>}
                        <div className="flex items-center space-x-2 pt-2">
                             <Controller name="email_provider_settings.smtp.secure" control={form.control} render={({ field }) => (
                                <Switch id="smtp_secure_switch" checked={field.value} onCheckedChange={field.onChange} />
                             )}/>
                             {/* Hidden input for form submission */}
                             <input type="hidden" name="email_provider_settings.smtp.secure" value={form.watch("email_provider_settings.smtp.secure") ? "true" : "false"} />
                            <Label htmlFor="smtp_secure_switch">Use SSL/TLS (Secure)</Label>
                        </div>
                        {form.formState.errors.email_provider_settings?.smtp?.secure && <p className="text-sm text-destructive">{form.formState.errors.email_provider_settings.smtp.secure.message}</p>}
                        <div><Label htmlFor="smtp_default_from_email">SMTP Default "From" Email</Label><Input id="smtp_default_from_email" type="email" {...form.register("email_provider_settings.smtp.default_from_email")} placeholder="e.g., no-reply@yourdomain.com"/></div>
                        {form.formState.errors.email_provider_settings?.smtp?.default_from_email && <p className="text-sm text-destructive">{form.formState.errors.email_provider_settings.smtp.default_from_email.message}</p>}
                    </div>
                )}
            </section>

            <div className="pt-4"> <SubmitButton /> </div>
        </form>
    );
}

// Minimal CSS for fadeIn animation (add to your globals.css or equivalent)
/*
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}
.animate-fadeIn {
  animation: fadeIn 0.3s ease-out forwards;
}
*/
