
"use client";

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Trash2, UserX, UserCheck, Edit, Activity } from 'lucide-react';
import { toast } from 'sonner';
import { deleteUserByAdmin, toggleUserSuspensionAction } from '@/server/admin.actions';
import type { UserWithProfileAndAuth } from '@/lib/types';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface UserManagementActionsProps {
  user: UserWithProfileAndAuth;
}

export default function UserManagementActions({ user }: UserManagementActionsProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isSuspendDialogOpen, setIsSuspendDialogOpen] = useState(false);

  const isBanned = user.auth_user?.banned_until && user.auth_user.banned_until !== 'none' && new Date(user.auth_user.banned_until) > new Date();

  const handleDelete = () => {
    startTransition(async () => {
      const result = await deleteUserByAdmin(user.id);
      if (result.success) {
        toast.success(result.message);
        router.refresh(); 
      } else {
        toast.error(result.message || 'Failed to delete user.');
      }
      setIsDeleteDialogOpen(false);
    });
  };

  const handleToggleSuspend = () => {
    startTransition(async () => {
      const result = await toggleUserSuspensionAction(user.id, user.auth_user?.banned_until);
      if (result.success) {
        toast.success(result.message);
        router.refresh();
      } else {
        toast.error(result.message || `Failed to ${isBanned ? 'unsuspend' : 'suspend'} user.`);
      }
      setIsSuspendDialogOpen(false);
    });
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Open menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuItem asChild>
            <Link href={`/admin/users/${user.id}/edit`}>
              <Edit className="mr-2 h-4 w-4" />
              Edit User
            </Link>
          </DropdownMenuItem>
           <DropdownMenuItem asChild>
            <Link href={`/admin/users/${user.id}/activity`}>
              <Activity className="mr-2 h-4 w-4" />
              View Activity
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setIsSuspendDialogOpen(true)} disabled={isPending}>
            {isBanned ? <UserCheck className="mr-2 h-4 w-4 text-green-500" /> : <UserX className="mr-2 h-4 w-4 text-orange-500" />}
            {isBanned ? 'Unsuspend User' : 'Suspend User'}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setIsDeleteDialogOpen(true)} className="text-destructive focus:text-destructive focus:bg-destructive/10" disabled={isPending}>
            <Trash2 className="mr-2 h-4 w-4" />
            Delete User
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Suspend/Unsuspend Confirmation Dialog */}
      <AlertDialog open={isSuspendDialogOpen} onOpenChange={setIsSuspendDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Action</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to {isBanned ? 'unsuspend' : 'suspend'} user "{user.display_name || user.auth_user?.email}"?
              {isBanned
                ? " They will regain access to their account."
                : " They will be unable to log in."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleToggleSuspend} disabled={isPending} className={isBanned ? "" : "bg-orange-500 hover:bg-orange-600 dark:bg-orange-600 dark:hover:bg-orange-700"}>
              {isPending ? 'Processing...' : (isBanned ? 'Unsuspend' : 'Suspend')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the user "{user.display_name || user.auth_user?.email}" and all their associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isPending} className="bg-destructive hover:bg-destructive/90">
              {isPending ? 'Deleting...' : 'Delete User'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
    