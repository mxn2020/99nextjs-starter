
"use client";
import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, Home, User, Settings, ShieldCheck, Users, BarChart2, CogIcon } from 'lucide-react';
import { Button } from '@99packages/ui/components/button';
import { Sheet, SheetContent, SheetTrigger } from '@99packages/ui/components/sheet';
import { cn } from '@/lib/utils';
interface NavItem {
href: string;
label: string;
icon: React.ElementType;
adminOnly?: boolean;
}
const navItems: NavItem[] = [
{ href: '/dashboard', label: 'Dashboard', icon: Home },
{ href: '/dashboard/profile', label: 'Profile', icon: User },
{ href: '/dashboard/settings', label: 'Settings', icon: Settings },
{ href: '/admin', label: 'Admin Overview', icon: ShieldCheck, adminOnly: true },
{ href: '/admin/users', label: 'User Management', icon: Users, adminOnly: true },
{ href: '/admin/analytics', label: 'Analytics', icon: BarChart2, adminOnly: true },
{ href: '/admin/system', label: 'System Settings', icon: CogIcon, adminOnly: true },
];
interface MobileNavProps {
userRole: string | undefined | null;
}
export default function MobileNav({ userRole }: MobileNavProps) {
const pathname = usePathname();
const isAdmin = userRole === 'admin';
const [open, setOpen] = useState(false);
const filteredNavItems = navItems.filter(item => !item.adminOnly || isAdmin);
return (
<Sheet open={open} onOpenChange={setOpen}>
<SheetTrigger asChild>
<Button variant="ghost" size="icon" className="md:hidden">
<Menu className="h-5 w-5" />
<span className="sr-only">Toggle navigation menu</span>
</Button>
</SheetTrigger>
<SheetContent side="left" className="w-64 p-0">
<div className="flex flex-col h-full">
<div className="flex items-center justify-between p-4 border-b">
<div className="text-2xl font-bold text-primary">MyApp</div>
<Button
variant="ghost"
size="icon"
onClick={() => setOpen(false)}
>
<X className="h-5 w-5" />
</Button>
</div>
      <nav className="flex-grow p-4">
        <ul className="space-y-1">
          {filteredNavItems.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center space-x-3 py-2.5 px-3 rounded-md hover:bg-muted hover:text-accent-foreground transition-colors duration-150 ease-in-out",
                  pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href + '/')) && item.href !== '/dashboard'
                    ? "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <item.icon className="h-5 w-5" />
                <span>{item.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      
      <div className="mt-auto p-4 text-xs text-muted-foreground border-t">
        Version 1.0.0 Update
      </div>
    </div>
  </SheetContent>
</Sheet>
);
}
