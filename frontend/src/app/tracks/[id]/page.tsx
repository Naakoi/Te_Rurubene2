'use client';

import CommentSection from '@/components/CommentSection';
import { Play, Heart, Share2, MoreHorizontal } from 'lucide-react';

export default function TrackDetailsPage() {
  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex flex-col md:flex-row gap-8 items-end mb-12">
        <div className="w-64 h-64 bg-gradient-to-br from-primary to-blue-600 rounded-3xl shadow-2xl shadow-primary/20 shrink-0"></div>
        <div className="flex-1">
            <p className="text-sm font-bold text-primary uppercase tracking-[0.2em] mb-2">Single</p>
            <h1 className="text-5xl md:text-7xl font-bold mb-6 tracking-tighter">Island Breeze</h1>
            <div className="flex items-center space-x-4 mb-8">
                <div className="w-8 h-8 bg-secondary rounded-full"></div>
                <span className="font-bold">DJ Kiribati</span>
                <span className="text-muted-foreground">• 2024 • 3:30</span>
            </div>
            
            <div className="flex items-center space-x-4">
                <button className="bg-primary text-primary-foreground px-8 py-3 rounded-full font-bold hover:scale-105 transition flex items-center space-x-2">
                    <Play size={20} fill="currentColor" />
                    <span>Play</span>
                </button>
                <button className="w-12 h-12 rounded-full glass flex items-center justify-center hover:text-primary transition"><Heart size={24} /></button>
                <button className="w-12 h-12 rounded-full glass flex items-center justify-center hover:text-primary transition"><Share2 size={24} /></button>
                <button className="w-12 h-12 rounded-full glass flex items-center justify-center hover:text-primary transition"><MoreHorizontal size={24} /></button>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8">
        <div className="glass-card rounded-2xl p-8">
            <h2 className="text-xl font-bold mb-4">Lyrics / Description</h2>
            <p className="text-muted-foreground leading-relaxed">
                Enjoy the calming sounds of the Pacific. This track features traditional Kiribati chants mixed with modern electronic beats. Perfect for a relaxing afternoon by the ocean.
            </p>
        </div>
        
        <CommentSection />
      </div>
    </div>
  );
}
