
"use client";
import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@99packages/ui/components/button';
import { UserNav } from './UserNav';
import MobileNav from './MobileNav';
import type { User } from '@supabase/supabase-js';
import type { UserProfile } from '@/lib/types';
import { ThemeToggle } from '@/components/common/ThemeToggle';
import { Github } from 'lucide-react';
interface HeaderProps {
user: (User & { profile: UserProfile | null }) | null;
}
export default function Header({ user }: HeaderProps) {
const userNavProps = user && user.profile ? {
email: user.email!,
name: user.profile.display_name,
avatarUrl: user.profile.avatar_url,
role: user.profile.role,
} : null;
return (
<header className="flex items-center justify-between h-16 px-4 md:px-6 border-b bg-card text-card-foreground sticky top-0 z-50">
<div className="flex items-center space-x-4">
{user && user.profile && (
<MobileNav userRole={user.profile.role} />
)}
</div>
  <div className="flex items-center space-x-3">
    <Link 
      href="https://github.com/mxn2020/99nextjs-starter" 
      target="_blank" 
      rel="noopener noreferrer"
      className="text-muted-foreground hover:text-foreground transition-colors"
    >
      <Github className="h-5 w-5" />
    </Link>
    <ThemeToggle />
    {userNavProps ? (
      <UserNav user={userNavProps} />
    ) : (
      <Link href="/login">
        <Button variant="outline" size="sm">Login</Button>
      </Link>
    )}
  </div>
</header>
);
}
