
"use client";
import { Bar, BarChart, Line, LineChart, Pie, PieChart as ActualPieChart, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Cell, LabelList } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent, type ChartConfig } from "@/components/ui/chart";
import type { AdminAnalyticsData, DailySignup, UserRoleDistribution } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { UsersIcon, UserCheckIcon, LineChartIcon as LineIcon, PieChartIcon as PieIcon } from 'lucide-react';
import { Separator } from '../ui/separator';
interface AnalyticsDashboardProps {
analyticsData: AdminAnalyticsData | null;
error?: string;
}
const COLORS = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"];
const dailySignupsChartConfig = {
users: {
label: "New Users",
color: "hsl(var(--chart-1))",
},
} satisfies ChartConfig;
export default function AnalyticsDashboard({ analyticsData, error }: AnalyticsDashboardProps) {
if (error) {
return (
<div className="p-4 bg-destructive/10 rounded-md border border-destructive/20">
<p className="text-destructive">Error loading analytics data: {error}</p>
</div>
);
}
if (!analyticsData) {
return (
<div className="p-4 bg-muted/10 rounded-md border border-muted/20">
<p className="text-muted-foreground">No analytics data available or still loading...</p>
</div>
);
}
const { totalUsers, activeUsersLast7Days, dailySignups, userRoleDistribution } = analyticsData;

const formattedDailySignups = dailySignups.map(d => ({ 
    date: new Date(d.signup_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), 
    users: d.count 
}));

const formattedUserRoleDistribution = userRoleDistribution.map((r, index) => ({
name: r.role.charAt(0).toUpperCase() + r.role.slice(1),
value: r.count,
fill: COLORS[index % COLORS.length]
}));
const dynamicUserRoleChartConfig = userRoleDistribution.reduce((acc, role, index) => {
    acc[role.role] = {
        label: role.role.charAt(0).toUpperCase() + role.role.slice(1),
        color: COLORS[index % COLORS.length],
    };
    return acc;
}, {} as ChartConfig);

return (
    <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                    <UsersIcon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{totalUsers.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground">All time registered users</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Active Users (7d)</CardTitle>
                    <UserCheckIcon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{activeUsersLast7Days.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground">Users active in the last 7 days</p>
                </CardContent>
            </Card>
            <Card>
                 <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Signups (Today)</CardTitle>
                     <UsersIcon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">
                        {dailySignups.find(d => d.signup_date === new Date().toISOString().split('T')[0])?.count || 0}
                    </div>
                    <p className="text-xs text-muted-foreground">New users registered today</p>
                </CardContent>
            </Card>
            <Card>
                 <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Admin Users</CardTitle>
                     <UsersIcon className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">
                        {userRoleDistribution.find(r => r.role === 'admin')?.count || 0}
                    </div>
                    <p className="text-xs text-muted-foreground">Total admin accounts</p>
                </CardContent>
            </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
            <Card className="col-span-1 lg:col-span-2">
                <CardHeader>
                    <div className="flex items-center space-x-2 mb-1">
                         <LineIcon className="h-5 w-5 text-muted-foreground" />
                         <CardTitle>User Registrations (Last 30 Days)</CardTitle>
                    </div>
                    <CardDescription>Daily new user signups trend.</CardDescription>
                </CardHeader>
                <CardContent className="min-h-[350px] pl-2">
                    {formattedDailySignups.length > 0 ? (
                        <ChartContainer config={dailySignupsChartConfig} className="h-full w-full">
                            <LineChart accessibilityLayer data={formattedDailySignups} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                                <XAxis 
                                    dataKey="date" 
                                    tickLine={false} 
                                    axisLine={false} 
                                    tickMargin={8}
                                    tick={{ fontSize: 12 }}
                                />
                                <YAxis 
                                    allowDecimals={false} 
                                    tickLine={false} 
                                    axisLine={false} 
                                    tickMargin={8} 
                                    width={30}
                                    tick={{ fontSize: 12 }}
                                />
                                <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="line" hideLabel />} />
                                <Line 
                                    dataKey="users" 
                                    type="monotone" 
                                    stroke="var(--color-users)" 
                                    strokeWidth={2} 
                                    dot={{ r: 4, fill: "var(--color-users)", strokeWidth: 0 }} 
                                    activeDot={{r: 6, strokeWidth: 1, fill: "var(--color-background)", stroke: "var(--color-users)"}}
                                />
                                <ChartLegend content={<ChartLegendContent verticalAlign="top" className="mt-1 mb-3"/>} />
                            </LineChart>
                        </ChartContainer>
                    ) : (
                         <div className="h-72 w-full bg-muted/30 rounded-lg flex flex-col items-center justify-center border border-dashed p-4">
                            <p className="text-muted-foreground">No signup data for the last 30 days.</p>
                         </div>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <div className="flex items-center space-x-2 mb-1">
                        <PieIcon className="h-5 w-5 text-muted-foreground" />
                        <CardTitle>User Role Distribution</CardTitle>
                    </div>
                    <CardDescription>Breakdown of users by their assigned role.</CardDescription>
                </CardHeader>
                <CardContent className="min-h-[350px] flex items-center justify-center">
                     {formattedUserRoleDistribution.length > 0 ? (
                        <ChartContainer config={dynamicUserRoleChartConfig} className="mx-auto aspect-square max-h-[300px]">
                            <ActualPieChart accessibilityLayer>
                                <ChartTooltip content={<ChartTooltipContent nameKey="name" hideIndicator />} />
                                <Pie 
                                    data={formattedUserRoleDistribution} 
                                    dataKey="value" 
                                    nameKey="name" 
                                    cx="50%" 
                                    cy="50%" 
                                    outerRadius={100} 
                                    innerRadius={60} 
                                    labelLine={false} 
                                    label={({ cx, cy, midAngle, innerRadius, outerRadius, percent, name }) => {
                                        const RADIAN = Math.PI / 180;
                                        const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                                        const x = cx + (radius + 15) * Math.cos(-midAngle * RADIAN);
                                        const y = cy + (radius + 15) * Math.sin(-midAngle * RADIAN);
                                        const percentage = (percent * 100).toFixed(0);
                                        if (parseInt(percentage) < 5) return null;
                                        return (
                                            <text 
                                                x={x} 
                                                y={y} 
                                                fill="hsl(var(--foreground))" 
                                                textAnchor={x > cx ? 'start' : 'end'} 
                                                dominantBaseline="central" 
                                                className="text-xs"
                                            >
                                                {`${name} (${percentage}%)`}
                                            </text>
                                        );
                                    }}
                                >
                                    {formattedUserRoleDistribution.map((entry, index) => (
                                        <Cell 
                                            key={`cell-${index}`} 
                                            fill={entry.fill} 
                                            stroke="hsl(var(--background))" 
                                            style={{ outline: 'none' }} 
                                        />
                                    ))}
                                </Pie>
                                <ChartLegend content={<ChartLegendContent nameKey="name" verticalAlign="bottom" className="mt-4" />} />
                            </ActualPieChart>
                        </ChartContainer>
                    ) : (
                        <div className="h-72 w-full bg-muted/30 rounded-lg flex flex-col items-center justify-center border border-dashed p-4">
                            <p className="text-muted-foreground">No role distribution data available.</p>
                        </div>
                    )}
                </CardContent>
            </Card>
             <Card>
                <CardHeader>
                    <div className="flex items-center space-x-2 mb-1">
                        <UsersIcon className="h-5 w-5 text-muted-foreground" />
                        <CardTitle>Additional Stats</CardTitle>
                    </div>
                    <CardDescription>Other relevant user statistics.</CardDescription>
                </CardHeader>
                <CardContent className="min-h-[350px] flex flex-col justify-center space-y-2">
                   <div className="text-sm space-y-2">
                     <p>Total Users: <span className="font-semibold">{analyticsData.totalUsers.toLocaleString()}</span></p>
                     <p>Active (7d): <span className="font-semibold">{analyticsData.activeUsersLast7Days.toLocaleString()}</span></p>
                   </div>
                   <Separator className="my-3"/>
                   <p className="text-xs text-muted-foreground">More detailed metrics and insights can be added here.</p>
                </CardContent>
            </Card>
        </div>
    </div>
);
}
