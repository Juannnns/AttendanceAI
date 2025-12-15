import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format, subDays, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import {Search, Calendar as CalendarIcon, Download, ClipboardList, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Calendar } from "@/components/ui/calendar";
import {Popover, PopoverContent, PopoverTrigger,} from "@/components/ui/popover";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue,} from "@/components/ui/select";
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow,} from "@/components/ui/table";
import type { AttendanceWithEmployee, Employee } from "@shared/schema";

function getStatusBadge(status: string) {
  switch (status) {
    case "present":
      return <Badge className="bg-green-600 hover:bg-green-700">Presente</Badge>;
    case "late":
      return <Badge className="bg-amber-600 hover:bg-amber-700">Tarde</Badge>;
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

function formatDate(dateString: string) {
  try {
    const date = parseISO(dateString);
    return format(date, "EEEE, d 'de' MMMM", { locale: es });
  } catch {
    return dateString;
  }
}

function AttendanceTableSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
        <div key={i} className="flex items-center gap-4 p-4 border-b border-border">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-24" />
          </div>
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-6 w-20" />
        </div>
      ))}
    </div>
  );
}

export default function AttendancePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedStatus, setSelectedStatus] = useState<string>("all");

  const dateString = format(selectedDate, "yyyy-MM-dd");

  const { data: employees = [] } = useQuery<Employee[]>({
    queryKey: ["/api/employees"],
  });

  const { data: attendanceRecords = [], isLoading } = useQuery<AttendanceWithEmployee[]>({
    queryKey: [`/api/attendance?date=${dateString}`],
  });

  const filteredRecords = attendanceRecords.filter((record) => {
    const matchesSearch =
      record.employee.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      record.employee.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      record.employee.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = selectedStatus === "all" || record.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  const statusCounts = {
    present: attendanceRecords.filter((r) => r.status === "present").length,
    late: attendanceRecords.filter((r) => r.status === "late").length,
    absent: attendanceRecords.filter((r) => r.status === "absent").length,
  };

  const handleExport = () => {
    const csvContent = [
      ["Empleado", "Departamento", "Entrada", "Salida", "Estado"].join(","),
      ...filteredRecords.map((r) =>
        [
          `${r.employee.firstName} ${r.employee.lastName}`,
          r.employee.department,
          r.checkIn || "-",
          r.checkOut || "-",
          r.status,
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `asistencia-${dateString}.csv`;
    link.click();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Registros de Asistencia</h1>
          <p className="text-muted-foreground">
            Consulta y filtra los registros de entrada y salida
          </p>
        </div>
        <Button variant="outline" onClick={handleExport} data-testid="button-export">
          <Download className="mr-2 h-4 w-4" />
          Exportar CSV
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
              <div className="h-4 w-4 rounded-full bg-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">{statusCounts.present}</p>
              <p className="text-sm text-muted-foreground">Presentes</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30">
              <div className="h-4 w-4 rounded-full bg-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-amber-600">{statusCounts.late}</p>
              <p className="text-sm text-muted-foreground">Llegadas Tarde</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30">
              <div className="h-4 w-4 rounded-full bg-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-red-600">{statusCounts.absent}</p>
              <p className="text-sm text-muted-foreground">Ausentes</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex-1">
              <CardTitle className="text-lg capitalize">
                {formatDate(dateString)}
              </CardTitle>
              <CardDescription>
                {filteredRecords.length} de {attendanceRecords.length} registros
              </CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" data-testid="button-date-picker">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(selectedDate, "dd/MM/yyyy")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => date && setSelectedDate(date)}
                    disabled={(date) => date > new Date()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar empleado..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                data-testid="input-search-attendance"
              />
            </div>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-full sm:w-40" data-testid="select-status-filter">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="present">Presentes</SelectItem>
                <SelectItem value="late">Tarde</SelectItem>
                <SelectItem value="absent">Ausentes</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <AttendanceTableSkeleton />
          ) : filteredRecords.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Empleado</TableHead>
                    <TableHead>Departamento</TableHead>
                    <TableHead className="text-center">Entrada</TableHead>
                    <TableHead className="text-center">Salida</TableHead>
                    <TableHead className="text-center">Estado</TableHead>
                    <TableHead className="text-right">Confianza</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRecords.map((record) => (
                    <TableRow key={record.id} data-testid={`row-attendance-${record.id}`}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9">
                            {record.employee.photoUrl && (
                              <AvatarImage
                                src={record.employee.photoUrl}
                                alt={record.employee.firstName}
                              />
                            )}
                            <AvatarFallback className="text-xs font-medium">
                              {record.employee.firstName.charAt(0)}
                              {record.employee.lastName.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">
                              {record.employee.firstName} {record.employee.lastName}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {record.employee.email}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{record.employee.department}</Badge>
                      </TableCell>
                      <TableCell className="text-center font-mono">
                        {formatTime(record.checkIn)}
                      </TableCell>
                      <TableCell className="text-center font-mono">
                        {formatTime(record.checkOut)}
                      </TableCell>
                      <TableCell className="text-center">
                        {getStatusBadge(record.status)}
                      </TableCell>
                      <TableCell className="text-right">
                        {record.confidence ? (
                          <span className="text-sm text-muted-foreground">
                            {(record.confidence * 100).toFixed(0)}%
                          </span>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="p-4 rounded-full bg-muted mb-4">
                <ClipboardList className="h-10 w-10 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium">Sin registros</h3>
              <p className="text-sm text-muted-foreground mt-1 text-center max-w-sm">
                {searchQuery || selectedStatus !== "all"
                  ? "No se encontraron registros con los filtros aplicados"
                  : "No hay registros de asistencia para esta fecha"}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
