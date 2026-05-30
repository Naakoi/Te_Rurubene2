'use client';

import { Music, Video, Mic, Info, ArrowLeft, CheckCircle2, ShieldCheck, FileUp } from 'lucide-react';
import Link from 'next/link';

export default function CreatorGuidePage() {
  return (
    <div className="p-8 max-w-5xl mx-auto pb-32">
      {/* Header */}
      <div className="mb-12 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/" className="p-2 glass rounded-full hover:text-primary transition">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-4xl font-black tracking-tight mb-2">Artist & Creator Guide</h1>
            <p className="text-muted-foreground text-lg">Master the Te Rurubene platform and reach your audience.</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
        <div className="glass-card p-6 rounded-3xl border-primary/20 flex flex-col items-center text-center">
            <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mb-4">
                <Music size={24} />
            </div>
            <h3 className="font-bold mb-1">Music</h3>
            <p className="text-xs text-muted-foreground">High fidelity audio distribution.</p>
        </div>
        <div className="glass-card p-6 rounded-3xl border-amber-500/20 flex flex-col items-center text-center">
            <div className="w-12 h-12 bg-amber-500/10 rounded-2xl flex items-center justify-center text-amber-500 mb-4">
                <Video size={24} />
            </div>
            <h3 className="font-bold mb-1">Video</h3>
            <p className="text-xs text-muted-foreground">Engage with shorts and full videos.</p>
        </div>
        <div className="glass-card p-6 rounded-3xl border-purple-500/20 flex flex-col items-center text-center">
            <div className="w-12 h-12 bg-purple-500/10 rounded-2xl flex items-center justify-center text-purple-500 mb-4">
                <Mic size={24} />
            </div>
            <h3 className="font-bold mb-1">Podcasts</h3>
            <p className="text-xs text-muted-foreground">Build a following with your voice.</p>
        </div>
      </div>

      <div className="space-y-16">
        {/* Section: Uploading Media */}
        <section className="relative">
            <div className="absolute -left-4 top-0 w-1 h-12 bg-primary rounded-full" />
            <h2 className="text-2xl font-bold mb-8 flex items-center">
                <FileUp className="mr-3 text-primary" />
                Uploading Content
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                <div className="space-y-6">
                    <div className="glass p-6 rounded-2xl border-white/5">
                        <h4 className="font-bold mb-3 flex items-center text-primary">
                            <Video size={18} className="mr-2" />
                            How to Upload Video
                        </h4>
                        <ol className="text-sm text-muted-foreground space-y-4 list-decimal pl-4">
                            <li>Navigate to your <strong>Studio</strong> in the sidebar.</li>
                            <li>Click on <strong>Upload Studio</strong>.</li>
                            <li>Toggle the <strong>Media Type</strong> to "Video / Short".</li>
                            <li>Enter your title and select your video file.</li>
                            <li>Choose if you want to make it <strong>Premium</strong> (users must pay to view).</li>
                        </ol>
                    </div>
                    <div className="glass p-6 rounded-2xl border-white/5">
                        <h4 className="font-bold mb-3 flex items-center text-primary">
                            <Music size={18} className="mr-2" />
                            Monetization
                        </h4>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                            You have full control over your pricing. "Free to Stream" allows all users to listen, while "Premium" content requires a one-time purchase or subscription.
                        </p>
                    </div>
                </div>
                <div className="glass-card p-8 rounded-[2.5rem] border-primary/10 bg-primary/5">
                    <h3 className="text-xl font-black mb-6 flex items-center">
                        <ShieldCheck className="mr-3 text-primary" />
                        Technical Limits
                    </h3>
                    <div className="space-y-6">
                        <div className="flex items-start space-x-4">
                            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                                <span className="font-black text-xs">500</span>
                            </div>
                            <div>
                                <p className="font-bold text-sm">Media File Size</p>
                                <p className="text-xs text-muted-foreground mt-1">Maximum 500MB per file. Supports MP3, WAV (Audio) and MP4, MOV (Video).</p>
                            </div>
                        </div>
                        <div className="flex items-start space-x-4">
                            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                                <span className="font-black text-xs">10</span>
                            </div>
                            <div>
                                <p className="font-bold text-sm">Cover Images & Thumbnails</p>
                                <p className="text-xs text-muted-foreground mt-1">Maximum 10MB per image. JPG, PNG, or WEBP.</p>
                                <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    <div className="bg-white/5 p-2 rounded-lg border border-white/5">
                                        <p className="text-[10px] uppercase font-bold text-primary">Audio/Podcast</p>
                                        <p className="text-xs text-white">1000 x 1000 px</p>
                                    </div>
                                    <div className="bg-white/5 p-2 rounded-lg border border-white/5">
                                        <p className="text-[10px] uppercase font-bold text-primary">Video/Shorts</p>
                                        <p className="text-xs text-white">1280 x 720 px</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-start space-x-4">
                            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                                <CheckCircle2 size={16} />
                            </div>
                            <div>
                                <p className="font-bold text-sm">Formats</p>
                                <p className="text-xs text-muted-foreground mt-1">Images: JPG, PNG, WEBP. <br/>Audio: 320kbps MP3 or high-res WAV.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        {/* Section: Podcasts */}
        <section className="relative">
            <div className="absolute -left-4 top-0 w-1 h-12 bg-purple-500 rounded-full" />
            <h2 className="text-2xl font-bold mb-8 flex items-center">
                <Mic className="mr-3 text-purple-500" />
                Starting a Podcast
            </h2>
            <div className="glass-card p-8 rounded-[3rem] border-purple-500/20 relative overflow-hidden">
                <div className="max-w-2xl relative z-10">
                    <h4 className="text-xl font-bold mb-4">Building your Podcast Brand</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-sm text-muted-foreground">
                        <div className="space-y-4">
                            <p className="font-bold text-white">1. Create a Channel</p>
                            <p>Head to the <strong>Podcasts</strong> section in your studio. Your channel is your brand—choose a name that resonates with your listeners.</p>
                        </div>
                        <div className="space-y-4">
                            <p className="font-bold text-white">2. Upload Episodes</p>
                            <p>You can upload episodes individually. Remember to use descriptive titles and engaging cover art for each series.</p>
                        </div>
                        <div className="space-y-4">
                            <p className="font-bold text-white">3. Set Your Audience</p>
                            <p>Choose between Public or Subscriber-only channels to monetize your exclusive discussions.</p>
                        </div>
                        <div className="space-y-4">
                            <p className="font-bold text-white">4. Promote</p>
                            <p>Share your podcast link directly to your social media to bring your fans into the Te Rurubene ecosystem.</p>
                        </div>
                    </div>
                </div>
                <Mic size={180} className="absolute -bottom-10 -right-10 opacity-5 text-purple-500" />
            </div>
        </section>

        {/* Support Footer */}
        <footer className="pt-20 text-center border-t border-white/5">
            <Info className="mx-auto mb-4 text-primary opacity-50" size={32} />
            <h3 className="text-xl font-bold mb-2">Need more help?</h3>
            <p className="text-muted-foreground mb-8">If you have issues with your uploads or account, our support team is here for you.</p>
            <Link href="mailto:support@rurubene.com" className="inline-block px-8 py-3 bg-white text-black rounded-full font-black hover:bg-primary hover:text-white transition duration-300">
                Contact Support
            </Link>
        </footer>
      </div>
    </div>
  );
}
