import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Download, FileSpreadsheet, FileText, Calendar,BarChart3,TrendingUp,Users} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {Popover,PopoverContent,PopoverTrigger,} from "@/components/ui/popover";
import {Select,SelectContent,SelectItem,SelectTrigger,SelectValue,} from "@/components/ui/select";
import {Table,TableBody,TableCell,TableHead,TableHeader,TableRow,} from "@/components/ui/table";
import {LineChart,Line,XAxis,YAxis,CartesianGrid,Tooltip,ResponsiveContainer,Legend} from "recharts";
import { format, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import type { AttendanceWithEmployee, Employee } from "@shared/schema";

type WeeklyStat = {
  date: string;
  present: number;
  late: number;
  absent: number;
};

type ReportPeriod = "week" | "month" | "custom";

function formatDayName(dateStr: string) {
  try {
    const date = parseISO(dateStr);
    return format(date, "dd MMM", { locale: es });
  } catch {
    return dateStr;
  }
}

export default function ReportsPage() {
  const [period, setPeriod] = useState<ReportPeriod>("week");
  const [startDate, setStartDate] = useState<Date>(subDays(new Date(), 6));
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [showCalendar, setShowCalendar] = useState<"start" | "end" | null>(null);

  const getDateRange = () => {
    const today = new Date();
    switch (period) {
      case "week":
        return {
          start: startOfWeek(today, { weekStartsOn: 1 }),
          end: endOfWeek(today, { weekStartsOn: 1 })
        };
      case "month":
        return {
          start: startOfMonth(today),
          end: endOfMonth(today)
        };
      case "custom":
        return { start: startDate, end: endDate };
      default:
        return { start: subDays(today, 6), end: today };
    }
  };

  const dateRange = getDateRange();

  const { data: monthlyStats = [], isLoading: statsLoading } = useQuery<WeeklyStat[]>({
    queryKey: ["/api/dashboard/monthly-stats"],
  });

  const { data: employees = [] } = useQuery<Employee[]>({
    queryKey: ["/api/employees"],
  });

  const queryString = `?startDate=${format(dateRange.start, "yyyy-MM-dd")}&endDate=${format(dateRange.end, "yyyy-MM-dd")}`;
  const { data: attendanceRecords = [], isLoading: recordsLoading } = useQuery<AttendanceWithEmployee[]>({
    queryKey: [`/api/attendance/range${queryString}`],
  });

  const formattedStats = monthlyStats.map(stat => ({
    ...stat,
    day: formatDayName(stat.date),
    puntualidad: stat.present + stat.late > 0 
      ? Math.round((stat.present / (stat.present + stat.late)) * 100)
      : 0
  }));

  const summary = {
    totalDays: monthlyStats.length,
    avgPresent: monthlyStats.length > 0 
      ? Math.round(monthlyStats.reduce((sum, s) => sum + s.present, 0) / monthlyStats.length)
      : 0,
    avgLate: monthlyStats.length > 0 
      ? Math.round(monthlyStats.reduce((sum, s) => sum + s.late, 0) / monthlyStats.length)
      : 0,
    avgAbsent: monthlyStats.length > 0 
      ? Math.round(monthlyStats.reduce((sum, s) => sum + s.absent, 0) / monthlyStats.length)
      : 0,
    avgPunctuality: formattedStats.length > 0
      ? Math.round(formattedStats.reduce((sum, s) => sum + s.puntualidad, 0) / formattedStats.length)
      : 0
  };

  const exportToCSV = () => {
    const headers = ["Fecha", "Empleado", "Departamento", "Entrada", "Salida", "Estado"];
    const rows = attendanceRecords.map(r => [
      r.date,
      `${r.employee.firstName} ${r.employee.lastName}`,
      r.employee.department,
      r.checkIn || "-",
      r.checkOut || "-",
      r.status
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `reporte_asistencia_${format(dateRange.start, "yyyy-MM-dd")}_${format(dateRange.end, "yyyy-MM-dd")}.csv`;
    link.click();
  };

  const exportToExcel = () => {
    const headers = ["Fecha", "Empleado", "Departamento", "Entrada", "Salida", "Estado"];
    const rows = attendanceRecords.map(r => [
      r.date,
      `${r.employee.firstName} ${r.employee.lastName}`,
      r.employee.department,
      r.checkIn || "-",
      r.checkOut || "-",
      r.status
    ]);

    let xlsContent = "<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:x='urn:schemas-microsoft-com:office:excel'><head><meta charset='UTF-8'></head><body><table border='1'>";
    xlsContent += "<tr>" + headers.map(h => `<th>${h}</th>`).join("") + "</tr>";
    rows.forEach(row => {
      xlsContent += "<tr>" + row.map(cell => `<td>${cell}</td>`).join("") + "</tr>";
    });
    xlsContent += "</table></body></html>";

    const blob = new Blob([xlsContent], { type: "application/vnd.ms-excel;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `reporte_asistencia_${format(dateRange.start, "yyyy-MM-dd")}_${format(dateRange.end, "yyyy-MM-dd")}.xls`;
    link.click();
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold" data-testid="text-reports-title">Reportes</h1>
        <p className="text-muted-foreground">
          Analisis y exportacion de datos de asistencia
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Periodo:</span>
          <Select value={period} onValueChange={(v) => setPeriod(v as ReportPeriod)}>
            <SelectTrigger className="w-40" data-testid="select-period">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Esta Semana</SelectItem>
              <SelectItem value="month">Este Mes</SelectItem>
              <SelectItem value="custom">Personalizado</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {period === "custom" && (
          <div className="flex items-center gap-2">
            <Popover open={showCalendar === "start"} onOpenChange={(open) => setShowCalendar(open ? "start" : null)}>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" data-testid="button-start-date">
                  <Calendar className="mr-2 h-4 w-4" />
                  {format(startDate, "dd/MM/yyyy")}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <CalendarComponent
                  mode="single"
                  selected={startDate}
                  onSelect={(date) => {
                    if (date) {
                      setStartDate(date);
                      setShowCalendar(null);
                    }
                  }}
                />
              </PopoverContent>
            </Popover>
            <span>-</span>
            <Popover open={showCalendar === "end"} onOpenChange={(open) => setShowCalendar(open ? "end" : null)}>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" data-testid="button-end-date">
                  <Calendar className="mr-2 h-4 w-4" />
                  {format(endDate, "dd/MM/yyyy")}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <CalendarComponent
                  mode="single"
                  selected={endDate}
                  onSelect={(date) => {
                    if (date) {
                      setEndDate(date);
                      setShowCalendar(null);
                    }
                  }}
                />
              </PopoverContent>
            </Popover>
          </div>
        )}

        <div className="flex items-center gap-2 ml-auto">
          <Button variant="outline" onClick={exportToCSV} data-testid="button-export-csv">
            <FileText className="mr-2 h-4 w-4" />
            Exportar CSV
          </Button>
          <Button variant="outline" onClick={exportToExcel} data-testid="button-export-excel">
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            Exportar Excel
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-green-100 dark:bg-green-900/30">
                <Users className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Promedio Presentes</p>
                <p className="text-2xl font-bold">{summary.avgPresent}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-amber-100 dark:bg-amber-900/30">
                <TrendingUp className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Promedio Tarde</p>
                <p className="text-2xl font-bold">{summary.avgLate}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-red-100 dark:bg-red-900/30">
                <BarChart3 className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Promedio Ausentes</p>
                <p className="text-2xl font-bold">{summary.avgAbsent}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                <TrendingUp className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Puntualidad Promedio</p>
                <p className="text-2xl font-bold">{summary.avgPunctuality}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-medium">Tendencia de Puntualidad</CardTitle>
          <CardDescription>Porcentaje de empleados a tiempo durante el periodo</CardDescription>
        </CardHeader>
        <CardContent>
          {statsLoading ? (
            <div className="h-72">
              <Skeleton className="h-full w-full" />
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={formattedStats}>
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
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="puntualidad" 
                  name="Puntualidad"
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  dot={{ fill: 'hsl(var(--primary))' }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2">
          <div>
            <CardTitle className="text-lg font-medium">Registros del Periodo</CardTitle>
            <CardDescription>
              {format(dateRange.start, "dd MMM yyyy", { locale: es })} - {format(dateRange.end, "dd MMM yyyy", { locale: es })}
            </CardDescription>
          </div>
          <Badge variant="secondary">
            {attendanceRecords.length} registros
          </Badge>
        </CardHeader>
        <CardContent>
          {recordsLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : attendanceRecords.length > 0 ? (
            <div className="max-h-96 overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Empleado</TableHead>
                    <TableHead>Departamento</TableHead>
                    <TableHead>Entrada</TableHead>
                    <TableHead>Salida</TableHead>
                    <TableHead>Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {attendanceRecords.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell className="font-mono text-sm">
                        {format(parseISO(record.date), "dd/MM/yyyy")}
                      </TableCell>
                      <TableCell>
                        {record.employee.firstName} {record.employee.lastName}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {record.employee.department}
                      </TableCell>
                      <TableCell className="font-mono">
                        {record.checkIn || "--:--"}
                      </TableCell>
                      <TableCell className="font-mono">
                        {record.checkOut || "--:--"}
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={record.status === "present" ? "default" : record.status === "late" ? "secondary" : "destructive"}
                          className={record.status === "present" ? "bg-green-600" : record.status === "late" ? "bg-amber-600" : ""}
                        >
                          {record.status === "present" ? "Presente" : record.status === "late" ? "Tarde" : "Ausente"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="p-4 rounded-full bg-muted mb-4">
                <FileText className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="font-medium">Sin registros en este periodo</p>
              <p className="text-sm text-muted-foreground mt-1">
                Selecciona otro rango de fechas
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
