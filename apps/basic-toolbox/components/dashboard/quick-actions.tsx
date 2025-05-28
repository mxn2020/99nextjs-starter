import Link from 'next/link'
import { Button } from '@99packages/ui/components/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@99packages/ui/components/card'
import { FileText, Plus, Users, Settings } from 'lucide-react'

export function QuickActions() {
  const actions = [
    {
      title: 'Create Note',
      description: 'Start writing a new note',
      href: '/notes/new',
      icon: Plus,
      color: 'bg-blue-500 hover:bg-blue-600',
    },
    {
      title: 'View All Notes',
      description: 'Browse your notes collection',
      href: '/notes',
      icon: FileText,
      color: 'bg-green-500 hover:bg-green-600',
    },
    {
      title: 'Manage Accounts',
      description: 'View and manage your accounts',
      href: '/accounts',
      icon: Users,
      color: 'bg-purple-500 hover:bg-purple-600',
    },
    {
      title: 'Profile Settings',
      description: 'Update your profile information',
      href: '/profile',
      icon: Settings,
      color: 'bg-orange-500 hover:bg-orange-600',
    },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
        <CardDescription>
          Get started with these common tasks
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {actions.map((action) => (
            <Link key={action.title} href={action.href}>
              <Button
                variant="outline"
                className="h-auto p-4 flex flex-col items-center gap-2 hover:shadow-md transition-shadow"
              >
                <div className={`p-2 rounded-full text-white ${action.color}`}>
                  <action.icon className="h-5 w-5" />
                </div>
                <div className="text-center">
                  <div className="font-medium text-sm">{action.title}</div>
                  <div className="text-xs text-muted-foreground">{action.description}</div>
                </div>
              </Button>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
