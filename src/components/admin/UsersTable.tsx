
"use client";

import { useState, useEffect } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import type { UserWithProfileAndAuth } from '@/lib/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import UserManagementActions from '@/components/admin/UserManagementActions';
import { ShieldCheck, MailWarning, UserX, PlusCircle } from 'lucide-react';
import PaginationControls from '@/components/common/PaginationControls';
import SearchInput from '@/components/common/SearchInput';
import { Button } from '../ui/button';
import Link from 'next/link';

interface UsersTableProps {
  users: UserWithProfileAndAuth[];
  totalUsers: number;
  currentPage: number;
  itemsPerPage: number;
  query?: string;
}

export default function UsersTable({
  users,
  totalUsers,
  currentPage,
  itemsPerPage,
  query: initialQuery = '',
}: UsersTableProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [currentQuery, setCurrentQuery] = useState(initialQuery);

  const handleSearch = (searchTerm: string) => {
    setCurrentQuery(searchTerm);
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', '1'); // Reset to first page on new search
    if (searchTerm) {
      params.set('query', searchTerm);
    } else {
      params.delete('query');
    }
    router.push(`<span class="math-inline">\{pathname\}?</span>{params.toString()}`);
  };

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', newPage.toString());
    router.push(`<span class="math-inline">\{pathname\}?</span>{params.toString()}`);
  };
  
  useEffect(() => {
    // Update currentQuery if the URL param changes externally
    setCurrentQuery(searchParams.get('query') || '');
  }, [searchParams]);


  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
        <SearchInput
            initialValue={currentQuery}
            onSearch={handleSearch}
            placeholder="Search by email or name..."
            className="w-full sm:w-72"
        />
      </div>
      
      {users.length === 0 && currentQuery ? (
         <div className="text-center py-8 text-muted-foreground">
            <p>No users found matching your search criteria "{currentQuery}".</p>
            <Button variant="link" onClick={() => handleSearch('')}>Clear search</Button>
        </div>
      ) : users.length === 0 && !currentQuery ? (
        <div className="text-center py-8 text-muted-foreground">
            <p>No users found in the system.</p>
        </div>
      ) : (
        <>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Display Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Joined At</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => {
                  const isBanned = user.auth_user?.banned_until &&
                                   user.auth_user.banned_until !== 'none' &&
                                   new Date(user.auth_user.banned_until) > new Date();
                  const isEmailConfirmed = !!user.auth_user?.email_confirmed_at;

                  return (
                    <TableRow key={user.id}>
                      <TableCell>{user.display_name || <span className="text-muted-foreground italic">Not set</span>}</TableCell>
                      <TableCell>{user.auth_user?.email || 'N/A'}</TableCell>
                      <TableCell><Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>{user.role}</Badge></TableCell>
                      <TableCell className="space-y-1">
                        <div className="flex items-center text-xs">
                          {isEmailConfirmed ?
                            <ShieldCheck className="h-3.5 w-3.5 mr-1 text-green-500" /> :
                            <MailWarning className="h-3.5 w-3.5 mr-1 text-yellow-500" />}
                          {isEmailConfirmed ? 'Verified' : 'Unverified'}
                        </div>
                        <div className="flex items-center text-xs">
                          {isBanned ?
                            <UserX className="h-3.5 w-3.5 mr-1 text-red-500" /> :
                            <ShieldCheck className="h-3.5 w-3.5 mr-1 text-green-500" />}
                          {isBanned ? `Banned` : 'Active'}
                        </div>
                        <Badge variant={user.onboarding_completed ? 'outline' : 'destructive'} className={`text-xs ${user.onboarding_completed ? "border-green-500 text-green-600" : "bg-orange-100 text-orange-700 border-orange-300"}`}>
                          {user.onboarding_completed ? 'Onboarded' : 'Pending Onboarding'}
                        </Badge>
                      </TableCell>
                      <TableCell>{new Date(user.created_at).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right">
                        <UserManagementActions user={user} />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
          <PaginationControls
            currentPage={currentPage}
            totalItems={totalUsers}
            itemsPerPage={itemsPerPage}
            onPageChange={handlePageChange}
          />
        </>
      )}
    </div>
  );
}
    