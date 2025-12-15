import { useQuery } from "@tanstack/react-query";
import { Users, Clock, UserX, CheckCircle, TrendingUp, TrendingDown, ArrowRight, ClipboardList, Camera, CalendarDays, BarChart3 } from "lucide-react";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from "@/components/ui/table";
import {AreaChart, Area, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from "recharts";
import type { DashboardStats, AttendanceWithEmployee } from "@shared/schema";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";

type WeeklyStat = {
  date: string;
  present: number;
  late: number;
  absent: number;
};

function MetricCard({
  title,
  value,
  icon: Icon,
  trend,
  trendValue,
  variant = "default",
}: {
  title: string;
  value: string | number;
  icon: React.ElementType;
  trend?: "up" | "down";
  trendValue?: string;
  variant?: "default" | "success" | "warning" | "danger";
}) {
  const variantStyles = {
    default: "text-primary",
    success: "text-green-600 dark:text-green-400",
    warning: "text-amber-600 dark:text-amber-400",
    danger: "text-red-600 dark:text-red-400",
  };

  return (
    <Card className="hover-elevate transition-all">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
              {title}
            </p>
            <p className={`text-4xl font-bold ${variantStyles[variant]}`}>
              {value}
            </p>
            {trend && trendValue && (
              <div className="flex items-center gap-1 text-xs">
                {trend === "up" ? (
                  <TrendingUp className="h-3 w-3 text-green-600" />
                ) : (
                  <TrendingDown className="h-3 w-3 text-red-600" />
                )}
                <span className={trend === "up" ? "text-green-600" : "text-red-600"}>
                  {trendValue}
                </span>
                <span className="text-muted-foreground">vs ayer</span>
              </div>
            )}
          </div>
          <div className={`p-3 rounded-lg bg-muted ${variantStyles[variant]}`}>
            <Icon className="h-6 w-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function MetricCardSkeleton() {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-16" />
            <Skeleton className="h-3 w-20" />
          </div>
          <Skeleton className="h-12 w-12 rounded-lg" />
        </div>
      </CardContent>
    </Card>
  );
}

function getStatusBadge(status: string) {
  switch (status) {
    case "present":
      return <Badge variant="default" className="bg-green-600 hover:bg-green-700">Presente</Badge>;
    case "late":
      return <Badge variant="default" className="bg-amber-600 hover:bg-amber-700">Tarde</Badge>;
    case "absent":
      return <Badge variant="destructive">Ausente</Badge>;
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
}

function formatTime(time: string | null | undefined) {
  if (!time) return "--:--";
  return time;
}

function formatDayName(dateStr: string) {
  try {
    const date = parseISO(dateStr);
    return format(date, "EEE", { locale: es });
  } catch {
    return dateStr;
  }
}

const COLORS = {
  present: "#22c55e",
  late: "#f59e0b",
  absent: "#ef4444"
};

export default function DashboardPage() {
  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats"],
  });

  const { data: recentAttendance = [], isLoading: attendanceLoading } = useQuery<AttendanceWithEmployee[]>({
    queryKey: ["/api/attendance/recent?limit=10"],
  });

  const { data: weeklyStats = [], isLoading: weeklyLoading } = useQuery<WeeklyStat[]>({
    queryKey: ["/api/dashboard/weekly-stats"],
  });

  const { data: monthlyStats = [], isLoading: monthlyLoading } = useQuery<WeeklyStat[]>({
    queryKey: ["/api/dashboard/monthly-stats"],
  });

  const formattedWeeklyStats = weeklyStats.map(stat => ({
    ...stat,
    day: formatDayName(stat.date),
    puntualidad: stat.present + stat.late > 0 
      ? Math.round((stat.present / (stat.present + stat.late)) * 100)
      : 0
  }));

  const pieData = stats ? [
    { name: "Presentes", value: stats.presentToday - (stats.lateArrivals || 0), fill: COLORS.present },
    { name: "Tarde", value: stats.lateArrivals, fill: COLORS.late },
    { name: "Ausentes", value: stats.absences, fill: COLORS.absent },
  ] : [];

  const averagePunctuality = formattedWeeklyStats.length > 0
    ? Math.round(formattedWeeklyStats.reduce((sum, s) => sum + s.puntualidad, 0) / formattedWeeklyStats.length)
    : 0;

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold" data-testid="text-dashboard-title">Dashboard</h1>
        <p className="text-muted-foreground">
          Vista general de asistencia del dia de hoy
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsLoading ? (
          <>
            <MetricCardSkeleton />
            <MetricCardSkeleton />
            <MetricCardSkeleton />
            <MetricCardSkeleton />
          </>
        ) : (
          <>
            <MetricCard
              title="Presentes Hoy"
              value={stats?.presentToday ?? 0}
              icon={Users}
              trend="up"
              trendValue="+2"
              variant="success"
            />
            <MetricCard
              title="Llegadas Tarde"
              value={stats?.lateArrivals ?? 0}
              icon={Clock}
              trend="down"
              trendValue="-1"
              variant="warning"
            />
            <MetricCard
              title="Ausencias"
              value={stats?.absences ?? 0}
              icon={UserX}
              variant="danger"
            />
            <MetricCard
              title="Puntualidad"
              value={`${stats?.onTimePercentage ?? 0}%`}
              icon={CheckCircle}
              trend="up"
              trendValue="+5%"
              variant="default"
            />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-2">
              <div>
                <CardTitle className="text-lg font-medium flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Tendencia Semanal
                </CardTitle>
                <CardDescription>Asistencia de los ultimos 7 dias</CardDescription>
              </div>
              <Badge variant="outline" className="font-mono">
                Prom: {averagePunctuality}%
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {weeklyLoading ? (
              <div className="h-64 flex items-center justify-center">
                <Skeleton className="h-full w-full" />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={formattedWeeklyStats}>
                  <defs>
                    <linearGradient id="colorPresent" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={COLORS.present} stopOpacity={0.8}/>
                      <stop offset="95%" stopColor={COLORS.present} stopOpacity={0.1}/>
                    </linearGradient>
                    <linearGradient id="colorLate" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={COLORS.late} stopOpacity={0.8}/>
                      <stop offset="95%" stopColor={COLORS.late} stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="day" 
                    className="text-xs"
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <YAxis 
                    className="text-xs"
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                    labelStyle={{ color: 'hsl(var(--foreground))' }}
                  />
                  <Legend />
                  <Area 
                    type="monotone" 
                    dataKey="present" 
                    name="Presentes"
                    stroke={COLORS.present} 
                    fillOpacity={1} 
                    fill="url(#colorPresent)" 
                  />
                  <Area 
                    type="monotone" 
                    dataKey="late" 
                    name="Tarde"
                    stroke={COLORS.late} 
                    fillOpacity={1} 
                    fill="url(#colorLate)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-medium flex items-center gap-2">
              <CalendarDays className="h-5 w-5" />
              Distribucion de Hoy
            </CardTitle>
            <CardDescription>Estado actual de asistencia</CardDescription>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <div className="h-64 flex items-center justify-center">
                <Skeleton className="h-48 w-48 rounded-full" />
              </div>
            ) : (
              <div className="flex items-center justify-center">
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-medium">Puntualidad Semanal</CardTitle>
          <CardDescription>Porcentaje de empleados a tiempo por dia</CardDescription>
        </CardHeader>
        <CardContent>
          {weeklyLoading ? (
            <div className="h-48">
              <Skeleton className="h-full w-full" />
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={formattedWeeklyStats}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="day" 
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                />
                <YAxis 
                  domain={[0, 100]}
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  tickFormatter={(value) => `${value}%`}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                  formatter={(value: number) => [`${value}%`, 'Puntualidad']}
                />
                <Bar 
                  dataKey="puntualidad" 
                  fill="hsl(var(--primary))"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between gap-2">
            <div>
              <CardTitle className="text-lg font-medium">Actividad Reciente</CardTitle>
              <CardDescription>Ultimos registros de asistencia</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/attendance" data-testid="link-view-all-attendance">
                Ver todo
                <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {attendanceLoading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex items-center gap-4">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                    <Skeleton className="h-6 w-16" />
                  </div>
                ))}
              </div>
            ) : recentAttendance && recentAttendance.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Empleado</TableHead>
                    <TableHead>Entrada</TableHead>
                    <TableHead>Salida</TableHead>
                    <TableHead>Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentAttendance.slice(0, 5).map((record) => (
                    <TableRow key={record.id} data-testid={`row-attendance-${record.id}`}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="text-xs font-medium">
                              {record.employee.firstName.charAt(0)}
                              {record.employee.lastName.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-sm">
                              {record.employee.firstName} {record.employee.lastName}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {record.employee.department}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {formatTime(record.checkIn)}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {formatTime(record.checkOut)}
                      </TableCell>
                      <TableCell>{getStatusBadge(record.status)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="p-4 rounded-full bg-muted mb-4">
                  <ClipboardList className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="font-medium">Sin registros hoy</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Los registros de asistencia apareceran aqui
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-medium">Acciones Rapidas</CardTitle>
            <CardDescription>Accesos directos</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button className="w-full justify-start" variant="outline" asChild>
              <Link href="/check-in" data-testid="link-quick-checkin">
                <Camera className="mr-2 h-4 w-4" />
                Registrar Asistencia
              </Link>
            </Button>
            <Button className="w-full justify-start" variant="outline" asChild>
              <Link href="/employees" data-testid="link-quick-employees">
                <Users className="mr-2 h-4 w-4" />
                Gestionar Empleados
              </Link>
            </Button>
            <Button className="w-full justify-start" variant="outline" asChild>
              <Link href="/attendance" data-testid="link-quick-attendance">
                <ClipboardList className="mr-2 h-4 w-4" />
                Ver Registros
              </Link>
            </Button>
            <Button className="w-full justify-start" variant="outline" asChild>
              <Link href="/reports" data-testid="link-quick-reports">
                <BarChart3 className="mr-2 h-4 w-4" />
                Reportes
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
