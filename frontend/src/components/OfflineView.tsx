'use client';

import Link from 'next/link';
import { WifiOff, Music, ArrowRight } from 'lucide-react';

interface OfflineViewProps {
  pageName: string;
  description?: string;
}

export default function OfflineView({ pageName, description }: OfflineViewProps) {
  const defaultDesc = `This section requires an active internet connection to retrieve real-time data and services.`;
  
  return (
    <div className="flex flex-col items-center justify-center text-center py-20 px-6 max-w-xl mx-auto min-h-[70vh]">
      {/* Pulse offline icon wrapper */}
      <div className="relative mb-8 flex items-center justify-center">
        <div className="absolute inset-0 bg-red-500/20 rounded-full blur-2xl w-24 h-24 animate-pulse"></div>
        <div className="relative p-6 bg-red-500/10 border border-red-500/20 text-red-400 rounded-3xl shadow-[0_0_15px_rgba(239,68,68,0.2)]">
          <WifiOff size={44} className="animate-bounce duration-1000" />
        </div>
      </div>

      <h2 className="text-3xl font-extrabold tracking-tight mb-3">
        {pageName} is Offline
      </h2>
      
      <p className="text-muted-foreground text-sm leading-relaxed mb-10 max-w-md">
        {description || defaultDesc}
      </p>

      {/* Action cards / buttons */}
      <div className="w-full space-y-4">
        <Link 
          href="/library" 
          className="w-full flex items-center justify-between p-4 bg-primary/10 border border-primary/20 text-primary hover:bg-primary/20 rounded-2xl transition duration-300 font-bold group shadow-[0_0_15px_rgba(0,255,255,0.1)]"
        >
          <div className="flex items-center space-x-3 text-left">
            <div className="p-2 bg-primary/20 rounded-xl text-primary">
              <Music size={18} />
            </div>
            <div>
              <div className="text-sm">Access Offline Library</div>
              <div className="text-[10px] text-muted-foreground font-normal normal-case">Listen to your downloaded music tracks.</div>
            </div>
          </div>
          <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
        </Link>

        <button 
          onClick={() => window.location.reload()} 
          className="w-full py-3 bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded-2xl font-bold transition text-xs uppercase tracking-wider"
        >
          Retry Connection
        </button>
      </div>
    </div>
  );
}
