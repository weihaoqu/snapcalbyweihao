import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Camera, FlipHorizontal, Image as ImageIcon, X } from 'lucide-react';

interface CameraInputProps {
  onCapture: (imageData: string) => void;
  onClose: () => void;
}

export const CameraInput: React.FC<CameraInputProps> = ({ onCapture, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState<string>('');
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [stream, setStream] = useState<MediaStream | null>(null);

  const startCamera = useCallback(async () => {
    try {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      
      const constraints = {
        video: {
          facingMode: facingMode,
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        },
        audio: false
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play();
      }
      setError('');
    } catch (err) {
      console.error("Error accessing camera:", err);
      setError("Unable to access camera. Please allow camera permissions or use file upload.");
    }
  }, [facingMode]); // Dependencies for useCallback

  useEffect(() => {
    startCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startCamera]); // Correct dependency

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      // Set canvas dimensions to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const context = canvas.getContext('2d');
      if (context) {
        // Flip if using front camera to mirror
        if (facingMode === 'user') {
          context.translate(canvas.width, 0);
          context.scale(-1, 1);
        }
        
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = canvas.toDataURL('image/jpeg', 0.8);
        onCapture(imageData);
      }
    }
  };

  const toggleCamera = () => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.onloadend = () => {
              const result = reader.result as string;
              onCapture(result);
          };
          reader.readAsDataURL(file);
      }
  }

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      <div className="relative flex-1 bg-black flex items-center justify-center overflow-hidden">
        {error ? (
          <div className="text-white text-center p-6">
             <p className="mb-4 text-red-400">{error}</p>
             <label className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-full cursor-pointer transition">
                Choose Image File
                <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
             </label>
             <button onClick={onClose} className="block mx-auto mt-8 text-slate-400 underline">Cancel</button>
          </div>
        ) : (
          <video 
            ref={videoRef} 
            playsInline 
            muted 
            autoPlay
            className={`w-full h-full object-cover ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`} 
          />
        )}
        
        {/* Overlay UI */}
        <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-start bg-gradient-to-b from-black/50 to-transparent">
           <button onClick={onClose} className="p-2 bg-black/20 backdrop-blur-md rounded-full text-white hover:bg-black/40 transition">
              <X size={24} />
           </button>
        </div>
      </div>

      {/* Controls */}
      {!error && (
        <div className="bg-black text-white pb-8 pt-6 px-6 flex items-center justify-around">
            <label className="p-4 rounded-full bg-slate-800 text-slate-300 cursor-pointer hover:bg-slate-700 transition">
                <ImageIcon size={24} />
                <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
            </label>

            <button 
                onClick={capturePhoto} 
                className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center bg-transparent hover:bg-white/10 transition active:scale-95"
            >
                <div className="w-16 h-16 bg-white rounded-full"></div>
            </button>

            <button 
                onClick={toggleCamera} 
                className="p-4 rounded-full bg-slate-800 text-slate-300 hover:bg-slate-700 transition"
            >
                <FlipHorizontal size={24} />
            </button>
        </div>
      )}

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};