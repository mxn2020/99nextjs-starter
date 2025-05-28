import { Card, CardContent, CardHeader, CardTitle } from '@99packages/ui/components/card'
import { FileText, Users, Calendar, TrendingUp } from 'lucide-react'

export async function DashboardStats() {
  // TODO: Implement real stats queries
  const stats = [
    {
      title: 'Total Notes',
      value: 0,
      icon: FileText,
      description: 'Notes created',
      trend: '+12% from last month',
    },
    {
      title: 'Accounts',
      value: 0,
      icon: Users,
      description: 'Active accounts',
      trend: '+2 new this month',
    },
    {
      title: 'Recent Notes',
      value: 0,
      icon: Calendar,
      description: 'Last 7 days',
      trend: '+5 this week',
    },
    {
      title: 'Growth',
      value: '23%',
      icon: TrendingUp,
      description: 'Content growth',
      trend: 'Trending up',
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => (
        <Card key={index}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
            <stat.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
            <p className="text-xs text-muted-foreground">{stat.description}</p>
            <p className="text-xs text-green-600 mt-1">{stat.trend}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
