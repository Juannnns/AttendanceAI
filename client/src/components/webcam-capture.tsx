import { useRef, useState, useCallback, useEffect } from "react";
import { Camera, X, RefreshCw, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

interface WebcamCaptureProps {
  onCapture: (photoDataUrl: string) => void;
  onClose: () => void;
}

export function WebcamCapture({ onCapture, onClose }: WebcamCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isStreamActive, setIsStreamActive] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startCamera = useCallback(async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
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
      setError("No se pudo acceder a la camara. Por favor, verifica los permisos.");
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

  const capturePhoto = useCallback(() => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        const imageDataUrl = canvas.toDataURL("image/jpeg", 0.8);
        setCapturedImage(imageDataUrl);
        stopCamera();
      }
    }
  }, [stopCamera]);

  const retakePhoto = useCallback(() => {
    setCapturedImage(null);
    startCamera();
  }, [startCamera]);

  const confirmPhoto = useCallback(() => {
    if (capturedImage) {
      onCapture(capturedImage);
    }
  }, [capturedImage, onCapture]);

  const handleClose = useCallback(() => {
    stopCamera();
    onClose();
  }, [stopCamera, onClose]);

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, [startCamera, stopCamera]);

  return (
    <div className="space-y-4">
      <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
        {error ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
            <Camera className="h-12 w-12 text-muted-foreground mb-2" />
            <p className="text-sm text-destructive">{error}</p>
            <Button variant="outline" size="sm" onClick={startCamera} className="mt-2">
              Reintentar
            </Button>
          </div>
        ) : capturedImage ? (
          <img
            src={capturedImage}
            alt="Captured"
            className="w-full h-full object-cover"
          />
        ) : (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
        )}
        
        {!error && !capturedImage && isStreamActive && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-48 h-48 border-2 border-dashed border-primary/50 rounded-full" />
          </div>
        )}
      </div>

      <canvas ref={canvasRef} className="hidden" />

      <div className="flex justify-center gap-2">
        {capturedImage ? (
          <>
            <Button variant="outline" onClick={retakePhoto} data-testid="button-retake-photo">
              <RefreshCw className="mr-2 h-4 w-4" />
              Tomar otra
            </Button>
            <Button onClick={confirmPhoto} data-testid="button-confirm-photo">
              <Check className="mr-2 h-4 w-4" />
              Usar esta foto
            </Button>
          </>
        ) : (
          <>
            <Button variant="outline" onClick={handleClose}>
              <X className="mr-2 h-4 w-4" />
              Cancelar
            </Button>
            <Button
              onClick={capturePhoto}
              disabled={!isStreamActive}
              data-testid="button-take-photo"
            >
              <Camera className="mr-2 h-4 w-4" />
              Capturar
            </Button>
          </>
        )}
      </div>
    </div>
  );
}