
"use client"; // For potential client-side interactivity like collapse/expand, active link highlighting

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, User, Settings, ShieldCheck, Users, BarChart2, CogIcon, PlusCircle } from 'lucide-react'; // Example icons, Added PlusCircle
import { cn } from '@/lib/utils'; // For conditional classes

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  adminOnly?: boolean;
  subItem?: boolean; // For indentation if needed, not used here yet
}

const navItems: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: Home },
  { href: '/dashboard/profile', label: 'Profile', icon: User },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings },
  // Admin section
  { href: '/admin', label: 'Admin Overview', icon: ShieldCheck, adminOnly: true },
  { href: '/admin/users', label: 'User Management', icon: Users, adminOnly: true },
  // Create User is accessed from the User Management page, so not adding a dedicated sidebar link for now
  // to keep the primary admin nav clean. Can be added if desired.
  // { href: '/admin/users/create', label: 'Create User', icon: PlusCircle, adminOnly: true, subItem: true },
  { href: '/admin/analytics', label: 'Analytics', icon: BarChart2, adminOnly: true },
  { href: '/admin/system', label: 'System Settings', icon: CogIcon, adminOnly: true },
];

export default function Sidebar({ userRole }: { userRole: string | undefined | null }) {
  const pathname = usePathname();
  const isAdmin = userRole === 'admin';

  const filteredNavItems = navItems.filter(item => !item.adminOnly || isAdmin);

  return (
    <aside className="w-64 bg-card border-r border-border p-4 space-y-4 flex flex-col text-card-foreground dark:bg-neutral-900 dark:border-neutral-700">
      <div className="text-2xl font-bold text-primary mb-6 pl-2">MyApp</div>
      <nav className="flex-grow">
        <ul className="space-y-1">
          {filteredNavItems.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  "flex items-center space-x-3 py-2.5 px-3 rounded-md hover:bg-muted hover:text-accent-foreground transition-colors duration-150 ease-in-out",
                  pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href + '/')) && item.href !== '/dashboard' // More robust active check
                    ? "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground dark:hover:text-neutral-100",
                  item.subItem ? "pl-8" : ""
                )}
              >
                <item.icon className="h-5 w-5" />
                <span>{item.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      <div className="mt-auto text-xs text-muted-foreground pl-2">
        {/* Footer content for sidebar, e.g. app version */}
        Version 1.0.0 Update
      </div>
    </aside>
  );
}
    