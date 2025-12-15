import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ScanFace, Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {Form,FormControl,FormField,FormItem,FormLabel,FormMessage,} from "@/components/ui/form";
import { loginSchema, type LoginCredentials } from "@shared/schema";
import { ThemeToggle } from "@/components/theme-toggle";

interface LoginPageProps {
  onLogin: (credentials: LoginCredentials) => Promise<void>;
  isLoading?: boolean;
  error?: string;
}

export default function LoginPage({ onLogin, isLoading, error }: LoginPageProps) {
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<LoginCredentials>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const handleSubmit = async (data: LoginCredentials) => {
    await onLogin(data);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-xl bg-primary">
            <ScanFace className="h-10 w-10 text-primary-foreground" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold">AttendanceAI</CardTitle>
            <CardDescription className="text-muted-foreground mt-1">
              Sistema de Control de Asistencia con Reconocimiento Facial
            </CardDescription>
          </div>
        </CardHeader>
        
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Usuario</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ingresa tu usuario"
                        data-testid="input-username"
                        required
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contraseña</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showPassword ? "text" : "password"}
                          placeholder="Ingresa tu contraseña"
                          data-testid="input-password"
                          required
                          {...field}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-0 top-0 h-full px-3"
                          onClick={() => setShowPassword(!showPassword)}
                          data-testid="button-toggle-password"
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <Eye className="h-4 w-4 text-muted-foreground" />
                          )}
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {error && (
                <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md" data-testid="text-login-error">
                  {error}
                </div>
              )}

              <Button 
                type="submit" 
                className="w-full" 
                disabled={isLoading}
                data-testid="button-login"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Iniciando sesion...
                  </>
                ) : (
                  "Iniciar Sesion"
                )}
              </Button>
            </form>
          </Form>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            <p>Credenciales por defecto:</p>
            <p className="font-mono text-xs mt-1">admin / admin123</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
