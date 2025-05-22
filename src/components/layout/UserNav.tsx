"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { logout } from "@/server/auth.actions"; // Server action
import Link from "next/link";
import { LifeBuoy, LogOut, Settings, User as UserIcon, ShieldCheck } from "lucide-react"; // Assuming ShieldCheck for admin
import { useTransition } from "react";
import { toast } from "sonner";
// import { useUserRole } from '@/hooks/useUserRole'; // If you create a client-side role hook

interface UserNavProps {
    user: {
        email: string;
        name?: string | null;
        avatarUrl?: string | null;
        role?: string | null; // Optional: pass role if needed directly here
    };
}

export function UserNav({ user }: UserNavProps) {
    const [isPending, startTransition] = useTransition();
    // const role = useUserRole(); // Example if you have a client hook for role

    const handleLogout = async () => {
        startTransition(async () => {
            await logout();
            toast.success("Logged out successfully.");
            // Redirect is handled by the server action
        });
    };

    const getInitials = (name?: string | null) => {
        if (!name) return user.email?.[0]?.toUpperCase() || "U";
        const names = name.split(' ');
        if (names.length > 1) {
            return (names[0][0] + names[names.length - 1][0]).toUpperCase();
        }
        return names[0].substring(0, 2).toUpperCase();
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                    <Avatar className="h-10 w-10">
                        <AvatarImage src={user.avatarUrl ?? undefined} alt={user.name ?? user.email} />
                        <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                    </Avatar>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none truncate">
                            {user.name || "User"}
                        </p>
                        <p className="text-xs leading-none text-muted-foreground truncate">
                            {user.email}
                        </p>
                    </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                    <Link href="/dashboard/profile" passHref>
                        <DropdownMenuItem>
                            <UserIcon className="mr-2 h-4 w-4" />
                            <span>Profile</span>
                        </DropdownMenuItem>
                    </Link>
                    <Link href="/dashboard/settings" passHref>
                        <DropdownMenuItem>
                            <Settings className="mr-2 h-4 w-4" />
                            <span>Settings</span>
                        </DropdownMenuItem>
                    </Link>
                    {/* Conditionally show Admin link if user has admin role /}
{/ This requires knowing the role on the client. Can be passed or fetched. /}
{/ For simplicity, assuming role might be available in user prop or via a hook /}
{/ {role === 'admin' && (
<Link href="/admin" passHref>
<DropdownMenuItem>
<ShieldCheck className="mr-2 h-4 w-4" />
<span>Admin Panel</span>
</DropdownMenuItem>
</Link>
)} */}
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => window.open('mailto:support@example.com')}>
                    <LifeBuoy className="mr-2 h-4 w-4" />
                    <span>Support</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout} disabled={isPending}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>{isPending ? "Logging out..." : "Log out"}</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
