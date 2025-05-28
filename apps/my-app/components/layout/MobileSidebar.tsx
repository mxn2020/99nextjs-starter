
"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, User, Settings, ShieldCheck, Users, BarChart2, CogIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { isMobile } from '@/lib/responsive';
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
interface MobileSidebarProps {
userRole: string | undefined | null;
isOpen: boolean;
onClose: () => void;
}
export default function MobileSidebar({ userRole, isOpen, onClose }: MobileSidebarProps) {
const pathname = usePathname();
const isAdmin = userRole === 'admin';
const [isMobileDevice, setIsMobileDevice] = useState(false);
useEffect(() => {
setIsMobileDevice(isMobile());
const handleResize = () => {
  setIsMobileDevice(isMobile());
  if (!isMobile() && isOpen) {
    onClose();
  }
};

window.addEventListener('resize', handleResize);
return () => window.removeEventListener('resize', handleResize);
}, [isOpen, onClose]);
const filteredNavItems = navItems.filter(item => !item.adminOnly || isAdmin);
if (!isMobileDevice) return null;
return (
<>
{isOpen && (
<div 
       className="fixed inset-0 bg-black/50 z-40 md:hidden" 
       onClick={onClose}
     />
)}
  <aside 
    className={cn(
      "fixed left-0 top-0 h-full w-64 bg-card border-r border-border p-4 space-y-4 flex flex-col text-card-foreground z-50 transform transition-transform duration-300 ease-in-out md:hidden",
      isOpen ? "translate-x-0" : "-translate-x-full"
    )}
  >
    <div className="text-2xl font-bold text-primary mb-6 pl-2">MyApp</div>
    
    <nav className="flex-grow">
      <ul className="space-y-1">
        {filteredNavItems.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              onClick={onClose}
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
    
    <div className="mt-auto text-xs text-muted-foreground pl-2">
      Version 1.0.0 Update
    </div>
  </aside>
</>
);
}
