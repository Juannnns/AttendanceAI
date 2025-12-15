import { useState, useEffect, useCallback } from "react";
import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { AppSidebar } from "@/components/app-sidebar";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

import LoginPage from "@/pages/login";
import DashboardPage from "@/pages/dashboard";
import EmployeesPage from "@/pages/employees";
import AttendancePage from "@/pages/attendance";
import CheckInPage from "@/pages/check-in";
import ReportsPage from "@/pages/reports";
import NotFound from "@/pages/not-found";

import type { LoginCredentials } from "@shared/schema";

function AuthenticatedLayout({
  children,
  onLogout,
  username,
}: {
  children: React.ReactNode;
  onLogout: () => void;
  username: string;
}) {
  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex min-h-screen w-full">
        <AppSidebar onLogout={onLogout} username={username} />
        <SidebarInset className="flex flex-col flex-1">
          <header className="sticky top-0 z-50 flex h-14 items-center justify-between gap-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
            <ThemeToggle />
          </header>
          <main className="flex-1 overflow-auto p-6 lg:p-8">{children}</main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}

function ProtectedRoutes({
  onLogout,
  username,
}: {
  onLogout: () => void;
  username: string;
}) {
  const [location, setLocation] = useLocation();

  useEffect(() => {
    if (location === "/" || location === "/login") {
      setLocation("/dashboard");
    }
  }, [location, setLocation]);

  return (
    <AuthenticatedLayout onLogout={onLogout} username={username}>
      <Switch>
        <Route path="/dashboard" component={DashboardPage} />
        <Route path="/employees" component={EmployeesPage} />
        <Route path="/attendance" component={AttendancePage} />
        <Route path="/check-in" component={CheckInPage} />
        <Route path="/reports" component={ReportsPage} />
        <Route component={NotFound} />
      </Switch>
    </AuthenticatedLayout>
  );
}

function AppContent() {
  const { toast } = useToast();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | undefined>();
  const [username, setUsername] = useState("");
  const [, setLocation] = useLocation();

  useEffect(() => {
    const storedAuth = localStorage.getItem("attendanceai-auth");
    if (storedAuth) {
      try {
        const authData = JSON.parse(storedAuth);
        setIsAuthenticated(true);
        setUsername(authData.username || "Admin");
      } catch {
        localStorage.removeItem("attendanceai-auth");
      }
    }
  }, []);

  const handleLogin = useCallback(
    async (credentials: LoginCredentials) => {
      setIsLoading(true);
      setLoginError(undefined);

      try {
        const response = await apiRequest("POST", "/api/auth/login", credentials);
        const data = await response.json();

        if (data.success) {
          localStorage.setItem(
            "attendanceai-auth",
            JSON.stringify({ username: credentials.username, token: data.token })
          );
          setIsAuthenticated(true);
          setUsername(credentials.username);
          setLocation("/dashboard");
          toast({
            title: "Bienvenido",
            description: `Has iniciado sesion como ${credentials.username}`,
          });
        } else {
          setLoginError(data.message || "Credenciales invalidas");
        }
      } catch (error) {
        setLoginError("Error de conexion. Intenta nuevamente.");
      } finally {
        setIsLoading(false);
      }
    },
    [setLocation, toast]
  );

  const handleLogout = useCallback(() => {
    localStorage.removeItem("attendanceai-auth");
    setIsAuthenticated(false);
    setUsername("");
    queryClient.clear();
    setLocation("/login");
    toast({
      title: "Sesion cerrada",
      description: "Has cerrado sesion exitosamente",
    });
  }, [setLocation, toast]);

  if (!isAuthenticated) {
    return (
      <LoginPage onLogin={handleLogin} isLoading={isLoading} error={loginError} />
    );
  }

  return <ProtectedRoutes onLogout={handleLogout} username={username} />;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light" storageKey="attendanceai-theme">
        <TooltipProvider>
          <AppContent />
          <Toaster />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
