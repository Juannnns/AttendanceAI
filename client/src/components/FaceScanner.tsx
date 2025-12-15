import { useRef, useEffect, useState, useCallback } from 'react';
import Webcam from 'react-webcam';
import * as faceapi from 'face-api.js';
import { Button } from "@/components/ui/button";
// import { Loader2, Camera, XCircle } from "lucide-react";
// import { cn } from "@/lib/utils";
interface FaceScannerProps {
  mode: 'register' | 'verify';
  onCapture?: (imageSrc: string, descriptor?: Float32Array) => void;
  onVerify?: (imageSrc: string, descriptor?: Float32Array) => void;
  isProcessing?: boolean;
}
export function FaceScanner({ mode, onCapture, onVerify, isProcessing }: FaceScannerProps) {
  const webcamRef = useRef<Webcam>(null);
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [detected, setDetected] = useState(false);
  // 1. CARGAR MODELOS DESDE PUBLIC
  useEffect(() => {
    const loadModels = async () => {
      const MODEL_URL = '/models'; // Esto busca en client/public/models
      try {
        await Promise.all([
          faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL)
        ]);
        setIsModelLoaded(true);
      } catch (err) {
        console.error("Error cargando modelos:", err);
      }
    };
    loadModels();
  }, []);
  // 2. DETECTAR ROSTRO CONTINUAMENTE
  const detectFace = async () => {
    if (!webcamRef.current?.video || !isModelLoaded) return null;
    const video = webcamRef.current.video;
    
    // Detectar rostro + landmarks + descriptor (la huella facial)
    return await faceapi.detectSingleFace(video, new faceapi.SsdMobilenetv1Options())
      .withFaceLandmarks()
      .withFaceDescriptor();
  };
  useEffect(() => {
    if (!isModelLoaded) return;
    const interval = setInterval(async () => {
      if (isProcessing) return;
      const detection = await detectFace();
      setDetected(!!detection);
      // Si estamos en modo "Verificar" (Kiosco), auto-enviar si hay rostro
      if (mode === 'verify' && detection && onVerify) {
        const imageSrc = webcamRef.current?.getScreenshot();
        if (imageSrc) onVerify(imageSrc, detection.descriptor);
      }
    }, 1000); // Revisar cada segundo
    return () => clearInterval(interval);
  }, [isModelLoaded, mode, isProcessing, onVerify]);
  // 3. CAPTURA MANUAL (Para Registro)
  const capture = async () => {
    const imageSrc = webcamRef.current?.getScreenshot();
    const detection = await detectFace(); // Forzar detección al momento del click
    if (imageSrc && detection && onCapture) {
      onCapture(imageSrc, detection.descriptor);
    } else {
      alert("No se detectó ningún rostro. Mira a la cámara.");
    }
  };
  return (
    <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden">
      {!isModelLoaded && <div className="absolute inset-0 flex items-center justify-center text-white bg-black/80">Cargando IA...</div>}
      
      <Webcam
        audio={false}
        ref={webcamRef}
        screenshotFormat="image/jpeg"
        className="w-full h-full object-cover"
        mirrored={true}
        videoConstraints={{ facingMode: "user" }}
      />
      
      {/* Marco visual de detección */}
      {detected && <div className="absolute inset-0 border-4 border-green-500/50 m-4 rounded-lg pointer-events-none" />}
      {mode === 'register' && (
        <div className="absolute bottom-4 right-4">
          <Button onClick={capture} disabled={!detected}>Capturar Foto</Button>
        </div>
      )}
    </div>
  );
}