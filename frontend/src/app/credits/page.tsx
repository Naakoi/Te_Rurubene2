'use client';

import { Heart, Code, Cpu, Globe, ArrowLeft, Star, Award, Zap } from 'lucide-react';
import Link from 'next/link';

export default function CreditsPage() {
  const technologies = [
    { name: 'Next.js 14', category: 'Frontend', color: 'from-black to-zinc-800' },
    { name: 'Laravel 11', category: 'Backend', color: 'from-red-500 to-red-700' },
    { name: 'Tailwind CSS', category: 'Design', color: 'from-cyan-400 to-blue-500' },
    { name: 'Cloudflare R2', category: 'Storage', color: 'from-orange-400 to-orange-600' },
    { name: 'Zustand', category: 'State', color: 'from-amber-700 to-amber-900' },
    { name: 'Lucide Icons', category: 'UI', color: 'from-pink-500 to-rose-600' },
  ];

  return (
    <div className="min-h-screen p-8 max-w-6xl mx-auto pb-32">
      {/* Header */}
      <div className="mb-20 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/" className="p-2 glass rounded-full hover:text-primary transition">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-5xl font-black tracking-tighter mb-2 italic">CREDITS</h1>
            <p className="text-primary font-bold tracking-[0.3em] text-xs uppercase">The Architecture of Te Rurubene</p>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div className="relative mb-32">
        <div className="absolute inset-0 bg-primary/10 blur-[120px] rounded-full -z-10" />
        <div className="glass-card p-12 rounded-[3rem] border-white/5 text-center relative overflow-hidden">
            <Heart className="mx-auto mb-6 text-red-500 animate-pulse" size={48} fill="currentColor" />
            <h2 className="text-4xl font-black mb-6">Built with Passion for the Pacific</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                Te Rurubene is more than just a platform—it's a digital ecosystem designed to empower artists, storytellers, and creators across the islands. Every line of code is written with the goal of bringing our culture to the global stage.
            </p>
            <div className="mt-12 flex justify-center space-x-8">
                <div className="flex flex-col items-center">
                    <span className="text-3xl font-black text-white">100%</span>
                    <span className="text-xs uppercase tracking-widest text-muted-foreground">Original</span>
                </div>
                <div className="w-px h-12 bg-white/10" />
                <div className="flex flex-col items-center">
                    <span className="text-3xl font-black text-white">24/7</span>
                    <span className="text-xs uppercase tracking-widest text-muted-foreground">Innovation</span>
                </div>
                <div className="w-px h-12 bg-white/10" />
                <div className="flex flex-col items-center">
                    <span className="text-3xl font-black text-white">∞</span>
                    <span className="text-xs uppercase tracking-widest text-muted-foreground">Dedication</span>
                </div>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-32">
        {/* Core Team */}
        <section>
            <h3 className="text-2xl font-bold mb-8 flex items-center">
                <Award className="mr-3 text-primary" />
                Core Architects
            </h3>
            <div className="space-y-6">
                <div className="glass p-8 rounded-3xl border-white/5 flex items-center space-x-6 group hover:border-primary/30 transition-all duration-500">
                    <div className="w-20 h-20 bg-gradient-to-br from-primary to-blue-600 rounded-2xl flex items-center justify-center text-white shadow-xl group-hover:scale-110 transition duration-500">
                        <Zap size={40} fill="currentColor" />
                    </div>
                    <div>
                        <h4 className="text-2xl font-black italic">Terakoi</h4>
                        <p className="text-primary font-bold text-sm tracking-widest uppercase">Founder & Lead Designer</p>
                        <p className="text-sm text-muted-foreground mt-2 italic">"Pioneering the future of Pacific music distribution."</p>
                    </div>
                </div>
                <div className="glass p-8 rounded-3xl border-white/5 flex items-center space-x-6 group hover:border-purple-500/30 transition-all duration-500">
                    <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center text-white shadow-xl group-hover:scale-110 transition duration-500">
                        <Cpu size={40} />
                    </div>
                    <div>
                        <h4 className="text-2xl font-black italic">Antigravity AI</h4>
                        <p className="text-purple-400 font-bold text-sm tracking-widest uppercase">System Architect</p>
                        <p className="text-sm text-muted-foreground mt-2 italic">Powered by DeepMind Advanced Agentic Coding.</p>
                    </div>
                </div>
            </div>
        </section>

        {/* Technology Stack */}
        <section>
            <h3 className="text-2xl font-bold mb-8 flex items-center">
                <Code className="mr-3 text-primary" />
                Technology Stack
            </h3>
            <div className="grid grid-cols-2 gap-4">
                {technologies.map((tech) => (
                    <div key={tech.name} className="glass p-4 rounded-2xl border-white/5 flex flex-col justify-between hover:bg-white/5 transition group">
                        <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest mb-2">{tech.category}</span>
                        <span className="text-lg font-bold text-white group-hover:text-primary transition">{tech.name}</span>
                        <div className={`mt-3 h-1 w-8 bg-gradient-to-r ${tech.color} rounded-full`} />
                    </div>
                ))}
            </div>
        </section>
      </div>

      {/* Community Section */}
      <section className="text-center">
        <div className="inline-flex items-center space-x-2 bg-primary/10 px-6 py-2 rounded-full border border-primary/20 text-primary font-bold text-sm mb-8">
            <Globe size={16} />
            <span>Serving 20+ Pacific Island Nations</span>
        </div>
        <h2 className="text-4xl font-black mb-6">Built for the Community</h2>
        <p className="text-muted-foreground max-w-2xl mx-auto leading-relaxed mb-12">
            Te Rurubene is a collaborative effort. We thank all the artists who trust us with their music and the fans who support independent Pacific talent.
        </p>
        
        <div className="flex justify-center flex-wrap gap-4">
            {['Fiji', 'Samoa', 'Tonga', 'Vanuatu', 'Cook Islands', 'Solomon Islands', 'PNG', 'New Caledonia'].map((island) => (
                <span key={island} className="px-4 py-2 glass rounded-xl text-xs font-bold text-white/40 hover:text-primary hover:border-primary/30 transition cursor-default">
                    {island}
                </span>
            ))}
        </div>
      </section>

      {/* Final Footer */}
      <div className="mt-32 pt-12 border-t border-white/5 flex flex-col md:flex-row justify-between items-center opacity-50">
        <p className="text-sm">© 2026 Terakoi. All rights reserved.</p>
        <p className="text-xs uppercase tracking-[0.5em] font-black mt-4 md:mt-0">Mana & Technology</p>
      </div>
    </div>
  );
}
