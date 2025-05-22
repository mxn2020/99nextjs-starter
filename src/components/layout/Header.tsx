
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { UserNav } from './UserNav';
import type { User } from '@supabase/supabase-js';
import type { UserProfile } from '@/lib/types';
import { ThemeToggle } from '@/components/common/ThemeToggle'; // Import ThemeToggle

interface HeaderProps {
  user: (User & { profile: UserProfile | null }) | null;
}

export default function Header({ user }: HeaderProps) {

  const userNavProps = user && user.profile ? {
    email: user.email!,
    name: user.profile.display_name,
    avatarUrl: user.profile.avatar_url,
    role: user.profile.role, // Pass role to UserNav if needed for conditional rendering there
  } : null;

  return (
    <header className="flex items-center justify-between h-16 px-4 md:px-6 border-b bg-card text-card-foreground sticky top-0 z-50">
      <div>
        {/* Breadcrumbs or page title can go here. For now, empty or a placeholder */}
        {/* <h1 className="text-lg font-semibold">Dashboard</h1> */}
      </div>
      <div className="flex items-center space-x-3">
        <ThemeToggle />
        {userNavProps ? (
          <UserNav user={userNavProps} />
        ) : (
          <Link href="/login">
            <Button variant="outline">Login</Button>
          </Link>
        )}
      </div>
    </header>
  );
}
    