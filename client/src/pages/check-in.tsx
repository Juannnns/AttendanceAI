import { useState, useRef, useCallback, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {Camera, UserCheck, Clock, AlertCircle, CheckCircle, RefreshCw, Loader2, ScanFace, } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Employee, AttendanceRecord } from "@shared/schema";

type RecognitionResult = {
  success: boolean;
  employee?: Employee;
  attendance?: AttendanceRecord;
  type?: "check_in" | "check_out";
  message: string;
  confidence?: number;
};

export default function CheckInPage() {
  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [isStreamActive, setIsStreamActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<RecognitionResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const { data: employees = [] } = useQuery<Employee[]>({
    queryKey: ["/api/employees"],
  });

  const recognizeMutation = useMutation({
    mutationFn: async (photoData: string) => {
      const response = await apiRequest("POST", "/api/face/recognize", {
        photo: photoData,
        timestamp: new Date().toISOString(),
      });
      return response.json() as Promise<RecognitionResult>;
    },
    onSuccess: (data) => {
      setLastResult(data);
      if (data.success) {
        queryClient.invalidateQueries({ queryKey: ["/api/attendance/recent?limit=10"] });
        queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
        toast({
          title: data.type === "check_in" ? "Entrada registrada" : "Salida registrada",
          description: `${data.employee?.firstName} ${data.employee?.lastName}`,
        });
      }
      setIsProcessing(false);
    },
    onError: () => {
      setLastResult({
        success: false,
        message: "Error al procesar la imagen. Intenta nuevamente.",
      });
      setIsProcessing(false);
      toast({
        title: "Error de reconocimiento",
        description: "No se pudo procesar la imagen",
        variant: "destructive",
      });
    },
  });

  const startCamera = useCallback(async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: "user",
        },
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setIsStreamActive(true);
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      setError("No se pudo acceder a la camara. Verifica los permisos del navegador.");
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsStreamActive(false);
  }, []);

  const captureAndRecognize = useCallback(() => {
    if (videoRef.current && canvasRef.current && !isProcessing) {
      const video = videoRef.current;
      const canvas = canvasRef.current;

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        const imageDataUrl = canvas.toDataURL("image/jpeg", 0.9);
        setIsProcessing(true);
        setLastResult(null);
        recognizeMutation.mutate(imageDataUrl);
      }
    }
  }, [isProcessing, recognizeMutation]);

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, [startCamera, stopCamera]);

  const currentTime = new Date();
  const registeredEmployees = employees.filter((e) => e.faceEmbedding);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Registro Facial</h1>
        <p className="text-muted-foreground">
          Usa el reconocimiento facial para registrar entrada o salida
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5" />
              Camara de Reconocimiento
            </CardTitle>
            <CardDescription>
              Posicionate frente a la camara y presiona el boton para registrar
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
              {error ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
                  <AlertCircle className="h-12 w-12 text-destructive mb-2" />
                  <p className="text-sm text-destructive">{error}</p>
                  <Button variant="outline" onClick={startCamera} className="mt-4">
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Reintentar
                  </Button>
                </div>
              ) : (
                <>
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                  {isStreamActive && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="w-64 h-64 border-2 border-dashed border-primary/50 rounded-full animate-pulse" />
                    </div>
                  )}
                  {isProcessing && (
                    <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                      <div className="flex flex-col items-center gap-4">
                        <Loader2 className="h-12 w-12 animate-spin text-primary" />
                        <p className="text-sm font-medium">Procesando imagen...</p>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            <canvas ref={canvasRef} className="hidden" />

            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-center sm:text-left">
                <p className="text-3xl font-bold font-mono">
                  {format(currentTime, "HH:mm:ss")}
                </p>
                <p className="text-sm text-muted-foreground capitalize">
                  {format(currentTime, "EEEE, d 'de' MMMM yyyy", { locale: es })}
                </p>
              </div>
              <Button
                size="lg"
                onClick={captureAndRecognize}
                disabled={!isStreamActive || isProcessing}
                className="w-full sm:w-auto"
                data-testid="button-capture-face"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Procesando...
                  </>
                ) : (
                  <>
                    <ScanFace className="mr-2 h-5 w-5" />
                    Registrar Asistencia
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserCheck className="h-5 w-5" />
                Resultado
              </CardTitle>
            </CardHeader>
            <CardContent>
              {lastResult ? (
                lastResult.success ? (
                  <div className="flex flex-col items-center text-center space-y-4">
                    <div className="p-3 rounded-full bg-green-100 dark:bg-green-900/30">
                      <CheckCircle className="h-10 w-10 text-green-600" />
                    </div>
                    <Avatar className="h-20 w-20">
                      {lastResult.employee?.photoUrl && (
                        <AvatarImage
                          src={lastResult.employee.photoUrl}
                          alt={lastResult.employee.firstName}
                        />
                      )}
                      <AvatarFallback className="text-xl font-medium">
                        {lastResult.employee?.firstName.charAt(0)}
                        {lastResult.employee?.lastName.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-bold text-lg">
                        {lastResult.employee?.firstName} {lastResult.employee?.lastName}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {lastResult.employee?.department}
                      </p>
                    </div>
                    <Badge
                      className={
                        lastResult.type === "check_in"
                          ? "bg-green-600"
                          : "bg-blue-600"
                      }
                    >
                      {lastResult.type === "check_in" ? "Entrada" : "Salida"} -{" "}
                      {format(new Date(), "HH:mm")}
                    </Badge>
                    {lastResult.confidence && (
                      <p className="text-xs text-muted-foreground">
                        Confianza: {(lastResult.confidence * 100).toFixed(0)}%
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center text-center space-y-4">
                    <div className="p-3 rounded-full bg-destructive/10">
                      <AlertCircle className="h-10 w-10 text-destructive" />
                    </div>
                    <div>
                      <p className="font-medium">No se pudo identificar</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {lastResult.message}
                      </p>
                    </div>
                    <Button variant="outline" onClick={captureAndRecognize}>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Intentar de nuevo
                    </Button>
                  </div>
                )
              ) : (
                <div className="flex flex-col items-center text-center py-8">
                  <div className="p-3 rounded-full bg-muted mb-4">
                    <ScanFace className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <p className="text-muted-foreground text-sm">
                    Posiciona tu rostro frente a la camara y presiona el boton
                    para registrar tu asistencia
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Empleados Registrados
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {registeredEmployees.length > 0 ? (
                  registeredEmployees.slice(0, 5).map((employee) => (
                    <div
                      key={employee.id}
                      className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/50 transition-colors"
                    >
                      <Avatar className="h-8 w-8">
                        {employee.photoUrl && (
                          <AvatarImage src={employee.photoUrl} alt={employee.firstName} />
                        )}
                        <AvatarFallback className="text-xs">
                          {employee.firstName.charAt(0)}
                          {employee.lastName.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {employee.firstName} {employee.lastName}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {employee.department}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No hay empleados con registro facial
                  </p>
                )}
                {registeredEmployees.length > 5 && (
                  <p className="text-xs text-muted-foreground text-center pt-2">
                    +{registeredEmployees.length - 5} mas
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
