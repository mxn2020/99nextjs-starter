
"use client"; // This page involves client-side form handling

import { useState, FormEvent } from 'react';
import { Input } from '@99packages/ui/components/input';
import { Button } from '@99packages/ui/components/button';
import { Label } from '@99packages/ui/components/label';
import Link from 'next/link';
import { getBrowserClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@99packages/ui/components/card';

export default function ForgotPasswordPage() {
const [email, setEmail] = useState('');
const [loading, setLoading] = useState(false);
const [message, setMessage] = useState('');
const supabase = getBrowserClient();

const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
event.preventDefault();
setLoading(true);
setMessage('');

const { error } = await supabase.auth.resetPasswordForEmail(email, {
  redirectTo: `${window.location.origin}/reset-password`, // URL to your reset password page
});

setLoading(false);
if (error) {
  toast.error(error.message);
  setMessage(error.message);
} else {
  toast.success('Password reset email sent! Check your inbox.');
  setMessage('Password reset email sent! Check your inbox.');
}
};

return (
<div className="flex flex-col items-center justify-center min-h-screen bg-background p-4">
<Card className="w-full max-w-md">
<CardHeader>
<CardTitle className="text-2xl font-bold text-center">Forgot Password</CardTitle>
<CardDescription className="text-center">
Enter your email address and we'll send you a link to reset your password.
</CardDescription>
</CardHeader>
<CardContent>
<form onSubmit={handleSubmit} className="space-y-4">
<div>
<Label htmlFor="email">Email</Label>
<Input
id="email"
name="email"
type="email"
autoComplete="email"
required
value={email}
onChange={(e) => setEmail(e.target.value)}
placeholder="you@example.com"
disabled={loading}
/>
</div>
<Button type="submit" className="w-full" disabled={loading}>
{loading ? 'Sending...' : 'Send Reset Link'}
</Button>
</form>
{message && <p className="mt-4 text-center text-sm">{message}</p>}
</CardContent>
<CardFooter className="flex flex-col items-center space-y-2">
<Link href="/login" className="text-sm font-medium text-primary hover:text-primary/90">
Remembered your password? Sign in
</Link>
</CardFooter>
</Card>
</div>
);
}
