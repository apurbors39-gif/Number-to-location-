import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Map as MapIcon, Radar, ExternalLink } from 'lucide-react';

interface MapProps {
  isTracking: boolean;
  location?: {
    lat: number;
    lng: number;
    name: string;
    district: string;
  };
}

export const Map: React.FC<MapProps> = ({ isTracking, location }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [viewMode, setViewMode] = useState<'radar' | 'google'>('radar');

  useEffect(() => {
    if (viewMode !== 'radar') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let particles: { x: number; y: number; size: number; speed: number }[] = [];

    const init = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      particles = Array.from({ length: 50 }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 2,
        speed: Math.random() * 0.5 + 0.1,
      }));
    };

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw grid
      ctx.strokeStyle = 'rgba(16, 185, 129, 0.1)';
      ctx.lineWidth = 1;
      const step = 30;
      for (let x = 0; x < canvas.width; x += step) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += step) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      // Draw particles
      ctx.fillStyle = 'rgba(16, 185, 129, 0.3)';
      particles.forEach((p) => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        p.y -= p.speed;
        if (p.y < 0) p.y = canvas.height;
      });

      if (location && !isTracking) {
        // Draw target circle
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        
        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(centerX, centerY, 40, 0, Math.PI * 2);
        ctx.stroke();

        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.arc(centerX, centerY, 60, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);

        // Pulsing dot
        const pulse = (Math.sin(Date.now() / 200) + 1) / 2;
        ctx.fillStyle = `rgba(16, 185, 129, ${0.5 + pulse * 0.5})`;
        ctx.beginPath();
        ctx.arc(centerX, centerY, 8, 0, Math.PI * 2);
        ctx.fill();
      }

      animationFrameId = requestAnimationFrame(draw);
    };

    init();
    draw();

    window.addEventListener('resize', init);
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', init);
    };
  }, [location, isTracking, viewMode]);

  const googleMapsUrl = location 
    ? `https://www.google.com/maps?q=${encodeURIComponent(location.name + ', ' + location.district + ', Bangladesh')}&output=embed`
    : '';

  return (
    <div className="relative w-full h-full overflow-hidden rounded-xl bg-black/40 border border-emerald-500/20 flex flex-col">
      {/* View Mode Toggle */}
      <div className="absolute top-4 right-4 z-20 flex gap-2">
        <button
          onClick={() => setViewMode('radar')}
          className={`p-2 rounded-lg border transition-all flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest ${
            viewMode === 'radar' 
              ? 'bg-emerald-500 text-black border-emerald-500' 
              : 'bg-black/60 text-emerald-500 border-emerald-500/30 hover:bg-emerald-500/10'
          }`}
        >
          <Radar className="w-3 h-3" />
          Radar
        </button>
        <button
          onClick={() => setViewMode('google')}
          className={`p-2 rounded-lg border transition-all flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest ${
            viewMode === 'google' 
              ? 'bg-emerald-500 text-black border-emerald-500' 
              : 'bg-black/60 text-emerald-500 border-emerald-500/30 hover:bg-emerald-500/10'
          }`}
        >
          <MapIcon className="w-3 h-3" />
          Google Maps
        </button>
      </div>

      <div className="flex-1 relative">
        <AnimatePresence mode="wait">
          {viewMode === 'radar' ? (
            <motion.div
              key="radar"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full h-full"
            >
              <canvas ref={canvasRef} className="w-full h-full" />
            </motion.div>
          ) : (
            <motion.div
              key="google"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full h-full bg-zinc-900"
            >
              {location ? (
                <iframe
                  title="Google Map"
                  width="100%"
                  height="100%"
                  frameBorder="0"
                  scrolling="no"
                  marginHeight={0}
                  marginWidth={0}
                  src={googleMapsUrl}
                  className="grayscale invert contrast-125 opacity-80"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-emerald-500/30 font-mono text-xs">
                  NO LOCATION DATA
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {isTracking && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="scan-line" />
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-emerald-500 font-mono text-xs uppercase tracking-widest flex flex-col items-center gap-4"
            >
              <div className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
              Scanning Satellite Data...
            </motion.div>
          </div>
        )}
      </div>

      <div className="absolute bottom-4 left-4 z-20 flex flex-col gap-1 pointer-events-none">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[10px] font-mono text-emerald-500/70 uppercase tracking-tighter">Live Signal: Active</span>
        </div>
        <div className="text-[10px] font-mono text-emerald-500/50 uppercase tracking-tighter">
          {location ? `Lat: 23.${Math.floor(Math.random() * 9999)}° N | Lon: 90.${Math.floor(Math.random() * 9999)}° E` : 'Lat: --.----° N | Lon: --.----° E'}
        </div>
      </div>

      {location && viewMode === 'google' && (
        <a 
          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location.name + ', ' + location.district + ', Bangladesh')}`}
          target="_blank"
          rel="noopener noreferrer"
          className="absolute bottom-4 right-4 z-20 p-2 bg-emerald-500 text-black rounded-lg text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 hover:bg-emerald-400 transition-colors"
        >
          Open in Maps
          <ExternalLink className="w-3 h-3" />
        </a>
      )}
    </div>
  );
};
