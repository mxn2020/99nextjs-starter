
import { Button } from '@99packages/ui/components/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@99packages/ui/components/card';
import { Badge } from '@99packages/ui/components/badge';
import Link from 'next/link';
import { getServerClient } from '@/lib/supabase/server';
import { UserNav } from '@/components/layout/UserNav';
import { FogHeroSection } from '@/components/FogHeroSection';
import { 
  Shield, 
  Users, 
  Settings, 
  Database,
  Code,
  Lock,
  Zap,
  CheckCircle,
  ArrowRight,
  Github,
  Chrome
} from 'lucide-react';

export default async function LandingPage() {
const supabase = await getServerClient();
const { data: { session } } = await supabase.auth.getSession();

let userProfile = null;
if (session) {
const { data } = await supabase
.from('users')
.select('display_name, avatar_url, role')
.eq('id', session.user.id)
.single();
userProfile = data;
}

const features = [
  {
    icon: Shield,
    title: "Authentication System",
    description: "Complete Supabase auth with OAuth providers (GitHub, Google), email/password, and magic links.",
    details: ["Email/Password Auth", "OAuth Integration", "Session Management", "Password Reset"]
  },
  {
    icon: Users,
    title: "User Management",
    description: "Role-based access control with user profiles, onboarding flow, and permission system.",
    details: ["Multi-step Onboarding", "Role-based Access", "User Profiles", "Admin Panel"]
  },
  {
    icon: Database,
    title: "Supabase Integration",
    description: "Full-stack database integration with type-safe queries and real-time subscriptions.",
    details: ["Type-safe Queries", "Real-time Updates", "Row Level Security", "Database Functions"]
  },
  {
    icon: Code,
    title: "Custom Packages",
    description: "Modular architecture using custom packages from our monorepo for maximum reusability.",
    details: ["@99packages/auth", "@99packages/ui", "@99packages/database", "@99packages/audit-log"]
  },
  {
    icon: Lock,
    title: "Security & Middleware",
    description: "Route protection middleware with comprehensive security patterns and audit logging.",
    details: ["Route Protection", "Middleware Auth", "Audit Logging", "Security Headers"]
  },
  {
    icon: Zap,
    title: "Modern Stack",
    description: "Latest Next.js 15 with App Router, React 19, TypeScript, and Tailwind CSS.",
    details: ["Next.js 15", "React 19", "TypeScript", "Tailwind CSS 4"]
  }
];

const packages = [
  { name: "@99packages/auth", description: "Multi-provider authentication", color: "bg-blue-100 text-blue-800" },
  { name: "@99packages/ui", description: "Shadcn/UI component library", color: "bg-green-100 text-green-800" },
  { name: "@99packages/database", description: "Supabase utilities & types", color: "bg-purple-100 text-purple-800" },
  { name: "@99packages/audit-log", description: "Activity tracking & logging", color: "bg-orange-100 text-orange-800" },
  { name: "@99packages/logger", description: "Structured logging system", color: "bg-red-100 text-red-800" }
];

return (
<div className="min-h-screen bg-background">
  {/* Header */}
  <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
    <div className="container flex h-14 items-center justify-between">
      <div className="flex items-center space-x-2">
        <Shield className="h-6 w-6 text-primary" />
        <Link href="http://99nextjs-starter.cloud" target="_blank" rel="noopener noreferrer" className="hover:underline">
          <span className="font-bold">99NextJS-Starter</span>
        </Link>
      </div>
      {session && userProfile ? (
        <UserNav user={{ email: session.user.email!, name: userProfile.display_name, avatarUrl: userProfile.avatar_url }} />
      ) : (
        <div className="flex items-center space-x-2">
          <Link href="/login">
            <Button variant="ghost">Login</Button>
          </Link>
          <Link href="/signup">
            <Button>Sign Up</Button>
          </Link>
        </div>
      )}
    </div>
  </header>
  {/* Hero Section with Fog Effect */}
  <FogHeroSection session={session} />

  {/* Features Section */}
  <section className="py-20 bg-muted/40">
    <div className="container mx-auto px-4">
      <div className="text-center mb-16">
        <h2 className="text-3xl font-bold mb-4">App Architecture & Features</h2>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Explore the comprehensive features and modern architecture that makes this starter production-ready.
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {features.map((feature, index) => (
          <Card key={index} className="h-full hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <feature.icon className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="text-xl">{feature.title}</CardTitle>
              <CardDescription className="text-base">
                {feature.description}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {feature.details.map((detail, i) => (
                  <li key={i} className="flex items-center text-sm">
                    <CheckCircle className="h-4 w-4 text-green-600 mr-2 flex-shrink-0" />
                    {detail}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  </section>

  {/* Packages Section */}
  <section className="py-20">
    <div className="container mx-auto px-4">
      <div className="text-center mb-16">
        <h2 className="text-3xl font-bold mb-4">Custom Package Ecosystem</h2>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Built with modular custom packages for maximum reusability and maintainability.
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
        {packages.map((pkg, index) => (
          <Card key={index} className="text-center hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <Badge className={`w-fit mx-auto mb-2 ${pkg.color}`}>
                {pkg.name}
              </Badge>
              <CardDescription className="text-sm">
                {pkg.description}
              </CardDescription>
            </CardHeader>
          </Card>
        ))}
      </div>
    </div>
  </section>

  {/* OAuth Providers */}
  <section className="py-16 bg-muted/40">
    <div className="container mx-auto px-4 text-center">
      <h3 className="text-2xl font-bold mb-8">Integrated OAuth Providers</h3>
      <div className="flex items-center justify-center space-x-8">
        <div className="flex items-center space-x-2">
          <Github className="h-6 w-6" />
          <span className="font-medium">GitHub</span>
        </div>
        <div className="flex items-center space-x-2">
          <Chrome className="h-6 w-6" />
          <span className="font-medium">Google</span>
        </div>
      </div>
    </div>
  </section>

  {/* Footer */}
  <footer className="border-t py-12">
    <div className="container mx-auto px-4 text-center">
      <p className="text-muted-foreground">
        Open source <Link href="http://99nextjs-starter.cloud" target="_blank" rel="noopener noreferrer" className="hover:underline">Next.js starter template</Link> with modern architecture and best practices.
      </p>
      <p className="text-sm text-muted-foreground mt-2">
        Built with ❤️ using Next.js, Supabase, TypeScript, and Tailwind CSS.
      </p>
    </div>
  </footer>
</div>
);
}
