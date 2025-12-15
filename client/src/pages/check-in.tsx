import { useState, useRef, useCallback, useEffect } from "react";
import * as faceapi from "face-api.js";
import { useMutation, useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  Camera,
  UserCheck,
  Clock,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  Loader2,
  ScanFace,
} from "lucide-react";
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
  const [modelsLoaded, setModelsLoaded] = useState(false);

  const { data: employees = [] } = useQuery<Employee[]>({
    queryKey: ["/api/employees"],
  });

  // Mutación para enviar la imagen al backend
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
      setIsProcessing(false);
      if (data.success) {
        queryClient.invalidateQueries({ queryKey: ["/api/attendance/recent?limit=10"] });
        queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
        toast({
          title: data.type === "check_in" ? "Entrada registrada" : "Salida registrada",
          description: `${data.employee?.firstName} ${data.employee?.lastName}`,
        });
      }
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

  // Cargar modelos de face-api.js
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        // Ajusta la ruta según donde tengas los modelos (ej: /models en public)
        const modelsUri = "/models";
        await Promise.all([
          faceapi.nets.ssdMobilenetv1.loadFromUri(modelsUri),
          faceapi.nets.faceLandmark68Net.loadFromUri(modelsUri),
          faceapi.nets.faceRecognitionNet.loadFromUri(modelsUri),
        ]);
        if (mounted) setModelsLoaded(true);
      } catch (err) {
        console.error("Error cargando modelos face-api:", err);
        setModelsLoaded(false);
        setError("No se pudieron cargar los modelos de reconocimiento facial.");
        toast({
          title: "Error de modelos",
          description: "Verifica que la carpeta /models esté disponible.",
          variant: "destructive",
        });
      }
    })();
    return () => { mounted = false; };
  }, [toast]);

  // Inicia la cámara
  const startCamera = useCallback(async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "user" },
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
    if (videoRef.current) videoRef.current.srcObject = null;
    setIsStreamActive(false);
  }, []);

  const captureAndRecognize = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current || isProcessing) return;
    if (!modelsLoaded) {
      toast({
        title: "Modelos no listos",
        description: "Espera a que se carguen los modelos antes de capturar.",
        variant: "destructive",
      });
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;

    // Downscale to keep payload small (max 640px width)
    const maxWidth = 640;
    const scale = Math.min(1, maxWidth / video.videoWidth);
    const targetWidth = Math.floor(video.videoWidth * scale);
    const targetHeight = Math.floor(video.videoHeight * scale);

    canvas.width = targetWidth;
    canvas.height = targetHeight;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, targetWidth, targetHeight);
    const imageDataUrl = canvas.toDataURL("image/jpeg", 0.6); // lower quality to reduce size

    setIsProcessing(true);
    setLastResult(null);

    // Procesamiento local con face-api.js
    try {
      const validEmployees = employees.filter(
        (e) => e.faceEmbedding && e.faceEmbedding.length > 0
      );

      // Parseo seguro de embeddings
      const labeledDescriptors = validEmployees.flatMap((e) => {
        try {
          const parsed = JSON.parse(e.faceEmbedding!);
          if (!Array.isArray(parsed) || parsed.length === 0) throw new Error("Invalid embedding");
          const embeddingArray = new Float32Array(parsed);
          return [new faceapi.LabeledFaceDescriptors(String(e.id), [embeddingArray])];
        } catch {
          console.warn("Embedding inválido para empleado:", e.id);
          return [];
        }
      });

      if (labeledDescriptors.length === 0) {
        setLastResult({
          success: false,
          message: "No hay embeddings válidos registrados para comparar.",
        });
        setIsProcessing(false);
        return;
      }

      const faceMatcher = new faceapi.FaceMatcher(labeledDescriptors, 0.6);

      // Detectar rostro
      const detection = await faceapi
        .detectSingleFace(canvas)
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (!detection) {
        setLastResult({ success: false, message: "No se detectó rostro." });
        setIsProcessing(false);
        return;
      }

      const bestMatch = faceMatcher.findBestMatch(detection.descriptor);
      if (bestMatch.label !== "unknown") {
        const employee = validEmployees.find((e) => String(e.id) === bestMatch.label)!;

        // Llamar a la API para registrar asistencia
        recognizeMutation.mutate(imageDataUrl);

        setLastResult({
          success: true,
          employee,
          type: "check_in",
          message: "Rostro reconocido",
          confidence: bestMatch.distance ? 1 - bestMatch.distance : undefined,
        });
      } else {
        setLastResult({
          success: false,
          message: "Rostro no reconocido.",
        });
      }
    } catch (err) {
      console.error(err);
      setLastResult({ success: false, message: "Error al procesar la imagen" });
    } finally {
      setTimeout(() => setIsProcessing(false), 2000);
    }
  }, [employees, isProcessing, recognizeMutation, modelsLoaded, toast]);

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, [startCamera, stopCamera]);

  // Escaneo automático periódico mientras la cámara y los modelos están listos
  useEffect(() => {
    if (!isStreamActive || !modelsLoaded) return;
    const interval = setInterval(() => {
      if (!isProcessing) {
        captureAndRecognize();
      }
    }, 1800);
    return () => clearInterval(interval);
  }, [isStreamActive, modelsLoaded, isProcessing, captureAndRecognize]);

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
                disabled
                className="w-full sm:w-auto"
                data-testid="button-capture-face"
              >
                <ScanFace className="mr-2 h-5 w-5" />
                Escaneando automáticamente...
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          {/* Resultados y empleados registrados */}
          {/* ... aquí puedes usar tu código de resultado y lista de empleados tal cual */}
        </div>
      </div>
    </div>
  );
}
