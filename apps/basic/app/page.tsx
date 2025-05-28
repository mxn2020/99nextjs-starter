import Link from "next/link"
import { Button } from "@99packages/ui/components/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@99packages/ui/components/card"
import { Badge } from "@99packages/ui/components/badge"
import { 
  FileText, 
  Users, 
  Shield, 
  Settings, 
  Database, 
  ChevronRight,
  Star,
  Zap,
  Lock
} from "lucide-react"

export default function Page() {
  const features = [
    {
      icon: FileText,
      title: "Notes Management",
      description: "Create, edit, and organize your notes with categories and search functionality."
    },
    {
      icon: Users,
      title: "User Authentication",
      description: "Secure authentication system powered by Supabase with role-based access."
    },
    {
      icon: Shield,
      title: "Admin Dashboard",
      description: "Comprehensive admin panel for user and system management."
    },
    {
      icon: Database,
      title: "Database Integration",
      description: "PostgreSQL database with real-time updates and data synchronization."
    },
    {
      icon: Lock,
      title: "Audit Logging",
      description: "Complete audit trail with advanced logging and monitoring capabilities."
    },
    {
      icon: Zap,
      title: "Modern UI",
      description: "Beautiful, responsive interface built with modern design principles."
    }
  ]

  const packages = [
    { name: "UI Components", description: "Comprehensive component library" },
    { name: "Authentication", description: "Supabase-powered auth system" },
    { name: "Database", description: "PostgreSQL with type safety" },
    { name: "Audit Log", description: "Advanced logging capabilities" },
    { name: "Logger", description: "Structured logging utilities" }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <Badge variant="secondary" className="mb-4">
              <Star className="h-3 w-3 mr-1" />
              Monorepo Package Demo
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
              <Link href="https://github.com/mxn2020/99nextjs-starter" target="_blank" rel="noopener noreferrer" className="hover:underline">
                99Next.js Starter App Template
              </Link>
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-400 mb-8 max-w-3xl mx-auto">
              A comprehensive starter template demonstrating the integration of custom packages including authentication, database management, audit logging, and UI components.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/auth/signin">
                <Button size="lg" className="w-full sm:w-auto">
                  Sign In
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/auth/signup">
                <Button variant="outline" size="lg" className="w-full sm:w-auto">
                  Create Account
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Integrated Features
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Explore the powerful features built with our custom package ecosystem
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-xl">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Packages Section */}
      <div className="bg-white dark:bg-gray-900 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Built with Custom Packages
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              This application showcases the integration of multiple custom packages from our monorepo
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {packages.map((pkg, index) => (
              <div key={index} className="flex items-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="w-2 h-2 bg-primary rounded-full mr-3"></div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">{pkg.name}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{pkg.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <Card className="text-center">
          <CardHeader>
            <CardTitle className="text-2xl mb-2">Ready to Get Started?</CardTitle>
            <CardDescription className="text-lg">
              Sign up for an account to explore all features including the dashboard, notes management, and admin panel.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/auth/signup">
                <Button size="lg" className="w-full sm:w-auto">
                  Create Free Account
                </Button>
              </Link>
              <Link href="/dashboard">
                <Button variant="outline" size="lg" className="w-full sm:w-auto">
                  View Dashboard
                </Button>
              </Link>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">
              Demo admin account: admin@example.com / password123
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
