import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Search, Pencil, Trash2, Users, Camera, Loader2, X, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {Dialog,DialogContent,DialogDescription,DialogHeader,DialogTitle,DialogFooter,} from "@/components/ui/dialog";
import {AlertDialog,AlertDialogAction,AlertDialogCancel,AlertDialogContent,AlertDialogDescription,AlertDialogFooter,AlertDialogHeader,AlertDialogTitle,} from "@/components/ui/alert-dialog";
import {Form,FormControl,FormField,FormItem,FormLabel,FormMessage,} from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from "@/components/ui/select";
// import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Employee, InsertEmployee } from "@shared/schema";
import { WebcamCapture } from "@/components/webcam-capture";


const departments = [
  "Recursos Humanos",
  "Tecnologia",
  "Ventas",
  "Marketing",
  "Finanzas",
  "Operaciones",
  "Legal",
  "Administracion",
];

const employeeFormSchema = z.object({
  firstName: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  lastName: z.string().min(2, "El apellido debe tener al menos 2 caracteres"),
  email: z.string().email("Correo electronico invalido"),
  department: z.string().min(1, "Selecciona un departamento"),
  position: z.string().min(2, "El puesto debe tener al menos 2 caracteres"),
  status: z.string().default("active"),
  photoUrl: z.string().optional(),
  faceEmbedding: z.string().optional(),
});

type EmployeeFormData = z.infer<typeof employeeFormSchema>;

function EmployeeCardSkeleton() {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-16 w-16 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-28" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function EmployeesPage() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState<string>("all");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [deletingEmployee, setDeletingEmployee] = useState<Employee | null>(null);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [showCamera, setShowCamera] = useState(false);

  const { data: employees = [], isLoading } = useQuery<Employee[]>({
    queryKey: ["/api/employees"],
  });

  const form = useForm<EmployeeFormData>({
    resolver: zodResolver(employeeFormSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      department: "",
      position: "",
      status: "active",
      photoUrl: "",
      faceEmbedding: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertEmployee) => {
      const response = await apiRequest("POST", "/api/employees", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/employees"] });
      toast({ title: "Empleado creado exitosamente" });
      handleCloseForm();
    },
    onError: () => {
      toast({ title: "Error al crear empleado", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<InsertEmployee> }) => {
      const response = await apiRequest("PATCH", `/api/employees/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/employees"] });
      toast({ title: "Empleado actualizado exitosamente" });
      handleCloseForm();
    },
    onError: () => {
      toast({ title: "Error al actualizar empleado", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/employees/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/employees"] });
      toast({ title: "Empleado eliminado exitosamente" });
      setIsDeleteDialogOpen(false);
      setDeletingEmployee(null);
    },
    onError: () => {
      toast({ title: "Error al eliminar empleado", variant: "destructive" });
    },
  });

  const handleOpenForm = (employee?: Employee) => {
    if (employee) {
      setEditingEmployee(employee);
      form.reset({
        firstName: employee.firstName,
        lastName: employee.lastName,
        email: employee.email,
        department: employee.department,
        position: employee.position,
        status: employee.status,
        photoUrl: employee.photoUrl || "",
        faceEmbedding: employee.faceEmbedding || "",
      });
      setCapturedPhoto(employee.photoUrl || null);
    } else {
      setEditingEmployee(null);
      form.reset({
        firstName: "",
        lastName: "",
        email: "",
        department: "",
        position: "",
        status: "active",
        photoUrl: "",
        faceEmbedding: "",
      });
      setCapturedPhoto(null);
    }
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingEmployee(null);
    setCapturedPhoto(null);
    setShowCamera(false);
    form.reset();
  };

  const handleSubmit = async (data: EmployeeFormData) => {
    const employeeData: InsertEmployee = {
      ...data,
      photoUrl: capturedPhoto || data.photoUrl || null,
      faceEmbedding: data.faceEmbedding || null,
    };

    if (editingEmployee) {
      updateMutation.mutate({ id: editingEmployee.id, data: employeeData });
    } else {
      createMutation.mutate(employeeData);
    }
  };

  const handlePhotoCapture = (photoDataUrl: string) => {
    setCapturedPhoto(photoDataUrl);
    setShowCamera(false);
    form.setValue("photoUrl", photoDataUrl);
  };

  const handleDeleteClick = (employee: Employee) => {
    setDeletingEmployee(employee);
    setIsDeleteDialogOpen(true);
  };

  const filteredEmployees = employees.filter((employee) => {
    const matchesSearch =
      employee.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      employee.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      employee.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDepartment =
      selectedDepartment === "all" || employee.department === selectedDepartment;
    return matchesSearch && matchesDepartment;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Empleados</h1>
          <p className="text-muted-foreground">
            Gestiona el directorio de empleados y sus perfiles faciales
          </p>
        </div>
        <Button onClick={() => handleOpenForm()} data-testid="button-add-employee">
          <Plus className="mr-2 h-4 w-4" />
          Agregar Empleado
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre o correo..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            data-testid="input-search-employees"
          />
        </div>
        <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
          <SelectTrigger className="w-full sm:w-48" data-testid="select-department-filter">
            <SelectValue placeholder="Departamento" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los departamentos</SelectItem>
            {departments.map((dept) => (
              <SelectItem key={dept} value={dept}>
                {dept}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <EmployeeCardSkeleton key={i} />
          ))}
        </div>
      ) : filteredEmployees.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEmployees.map((employee) => (
            <Card
              key={employee.id}
              className="hover-elevate transition-all"
              data-testid={`card-employee-${employee.id}`}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-16 w-16">
                      {employee.photoUrl ? (
                        <AvatarImage src={employee.photoUrl} alt={employee.firstName} />
                      ) : null}
                      <AvatarFallback className="text-lg font-medium bg-primary text-primary-foreground">
                        {employee.firstName.charAt(0)}
                        {employee.lastName.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-medium">
                        {employee.firstName} {employee.lastName}
                      </h3>
                      <p className="text-sm text-muted-foreground">{employee.position}</p>
                      <Badge variant="secondary" className="mt-1 text-xs">
                        {employee.department}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleOpenForm(employee)}
                      data-testid={`button-edit-employee-${employee.id}`}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteClick(employee)}
                      className="text-destructive"
                      data-testid={`button-delete-employee-${employee.id}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-border">
                  <p className="text-sm text-muted-foreground truncate">{employee.email}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge
                      variant={employee.faceEmbedding ? "default" : "outline"}
                      className={employee.faceEmbedding ? "bg-green-600" : ""}
                    >
                      {employee.faceEmbedding ? "Rostro registrado" : "Sin registro facial"}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="p-4 rounded-full bg-muted mb-4">
              <Users className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium">Sin empleados</h3>
            <p className="text-sm text-muted-foreground mt-1 text-center max-w-sm">
              {searchQuery || selectedDepartment !== "all"
                ? "No se encontraron empleados con los filtros aplicados"
                : "Comienza agregando tu primer empleado al sistema"}
            </p>
            {!searchQuery && selectedDepartment === "all" && (
              <Button onClick={() => handleOpenForm()} className="mt-4">
                <UserPlus className="mr-2 h-4 w-4" />
                Agregar Primer Empleado
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingEmployee ? "Editar Empleado" : "Agregar Nuevo Empleado"}
            </DialogTitle>
            <DialogDescription>
              {editingEmployee
                ? "Modifica los datos del empleado"
                : "Completa el formulario para registrar un nuevo empleado"}
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
              <div className="flex flex-col items-center gap-4 p-4 border border-dashed border-border rounded-lg">
                {showCamera ? (
                  <div className="w-full">
                    <WebcamCapture
                      onCapture={handlePhotoCapture}
                      onClose={() => setShowCamera(false)}
                    />
                  </div>
                ) : (
                  <>
                    <Avatar className="h-24 w-24">
                      {capturedPhoto ? (
                        <AvatarImage src={capturedPhoto} alt="Preview" />
                      ) : null}
                      <AvatarFallback className="text-2xl">
                        <Camera className="h-8 w-8 text-muted-foreground" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowCamera(true)}
                        data-testid="button-capture-photo"
                      >
                        <Camera className="mr-2 h-4 w-4" />
                        Capturar Foto
                      </Button>
                      {capturedPhoto && (
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => setCapturedPhoto(null)}
                        >
                          <X className="mr-2 h-4 w-4" />
                          Eliminar
                        </Button>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground text-center">
                      La foto se usara para el reconocimiento facial
                    </p>
                  </>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Ej: Juan"
                          data-testid="input-first-name"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Apellido</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Ej: Perez"
                          data-testid="input-last-name"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Correo Electronico</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="juan.perez@empresa.com"
                        data-testid="input-email"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="department"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Departamento</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-department">
                            <SelectValue placeholder="Seleccionar departamento" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {departments.map((dept) => (
                            <SelectItem key={dept} value={dept}>
                              {dept}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="position"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Puesto</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Ej: Desarrollador Senior"
                          data-testid="input-position"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={handleCloseForm}>
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  data-testid="button-save-employee"
                >
                  {(createMutation.isPending || updateMutation.isPending) && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {editingEmployee ? "Guardar Cambios" : "Crear Empleado"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar Empleado</AlertDialogTitle>
            <AlertDialogDescription>
              Estas seguro de que deseas eliminar a{" "}
              <strong>
                {deletingEmployee?.firstName} {deletingEmployee?.lastName}
              </strong>
              ? Esta accion no se puede deshacer y se eliminaran todos sus registros de
              asistencia.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingEmployee && deleteMutation.mutate(deletingEmployee.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete"
            >
              {deleteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
