import { useLocation, Link } from "wouter";
import { 
  LayoutDashboard, 
  Users, 
  ClipboardList, 
  Camera,
  LogOut,
  ScanFace,
  BarChart3
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

const navigationItems = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Empleados",
    url: "/employees",
    icon: Users,
  },
  {
    title: "Asistencia",
    url: "/attendance",
    icon: ClipboardList,
  },
  {
    title: "Registro Facial",
    url: "/check-in",
    icon: Camera,
  },
  {
    title: "Reportes",
    url: "/reports",
    icon: BarChart3,
  },
];

interface AppSidebarProps {
  onLogout: () => void;
  username?: string;
}

export function AppSidebar({ onLogout, username = "Admin" }: AppSidebarProps) {
  const [location] = useLocation();

  return (
    <Sidebar>
      <SidebarHeader className="border-b border-sidebar-border p-4">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary">
            <ScanFace className="h-6 w-6 text-primary-foreground" />
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-bold text-sidebar-foreground">AttendanceAI</span>
            <span className="text-xs text-muted-foreground">Control de Asistencia</span>
          </div>
        </Link>
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Navegacion
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => {
                const isActive = location === item.url;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      className="transition-colors"
                    >
                      <Link href={item.url} data-testid={`link-nav-${item.title.toLowerCase()}`}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9">
            <AvatarFallback className="bg-primary text-primary-foreground text-sm font-medium">
              {username.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-1 flex-col">
            <span className="text-sm font-medium text-sidebar-foreground">{username}</span>
            <span className="text-xs text-muted-foreground">Administrador</span>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onLogout}
            className="h-8 w-8"
            data-testid="button-logout"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
