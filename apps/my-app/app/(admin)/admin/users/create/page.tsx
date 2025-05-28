
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@99packages/ui/components/card';
import CreateUserForm from '@/components/admin/CreateUserForm';
import { Button } from '@99packages/ui/components/button';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default async function AdminCreateUserPage() {
    return (
        <div className="space-y-4">
             <Button variant="outline" size="sm" asChild className="mb-0 w-fit">
                <Link href="/admin/users"><ArrowLeft className="mr-2 h-4 w-4" />Back to Users List</Link>
            </Button>
            <Card className="max-w-2xl mx-auto">
                <CardHeader>
                    <CardTitle>Create New User</CardTitle>
                    <CardDescription>
                        Create a new user account. An email and password are required.
                        The user's email will be automatically confirmed.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <CreateUserForm />
                </CardContent>
            </Card>
        </div>
    );
}
    