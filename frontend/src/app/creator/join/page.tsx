'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/axios';
import { Mic2, Users, ArrowRight, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import Link from 'next/link';

type Step = 1 | 2 | 3;
type CreatorType = 'independent' | 'studio' | null;

export default function CreatorOnboarding() {
  const router = useRouter();
  const { user, setUser } = useAuthStore();
  
  const [step, setStep] = useState<Step>(user ? 2 : 1);
  const [creatorType, setCreatorType] = useState<CreatorType>(null);
  
  const [status, setStatus] = useState<'idle' | 'loading' | 'error' | 'success'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  // Step 1 State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [country, setCountry] = useState('Kiribati');
  const [island, setIsland] = useState('');

  // Step 3 State
  const [artistName, setArtistName] = useState('');
  const [bio, setBio] = useState('');
  const [invitationCode, setInvitationCode] = useState('');

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== passwordConfirmation) {
      setErrorMessage('Passwords do not match');
      setStatus('error');
      return;
    }

    setStatus('loading');
    setErrorMessage('');

    try {
      const response = await api.post('/api/creator/onboarding/register', {
        name,
        email,
        password,
        password_confirmation: passwordConfirmation,
        country,
        island
      });
      
      localStorage.setItem('auth_token', response.data.token);
      setUser(response.data.user);
      setStatus('idle');
      setStep(2);
    } catch (err: any) {
      setStatus('error');
      setErrorMessage(err.response?.data?.message || 'Failed to register account.');
    }
  };

  const handleSetupIndependent = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setErrorMessage('');

    try {
      const response = await api.post('/api/creator/onboarding/independent', {
        artist_name: artistName,
        bio
      });
      
      if (response.data.user) {
        setUser(response.data.user);
      }
      
      setStatus('success');
      setTimeout(() => router.push('/studio/upload'), 2000);
    } catch (err: any) {
      setStatus('error');
      setErrorMessage(err.response?.data?.message || 'Failed to setup artist profile.');
    }
  };

  const handleSetupStudio = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setErrorMessage('');

    try {
      const response = await api.post('/api/creator/onboarding/studio/join', {
        artist_name: artistName,
        invitation_code: invitationCode
      });
      
      if (response.data.user) {
        setUser(response.data.user);
      }
      
      setStatus('success');
      setTimeout(() => router.push('/studio/upload'), 2000);
    } catch (err: any) {
      setStatus('error');
      setErrorMessage(err.response?.data?.message || 'Invalid or expired invitation code.');
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 py-12 relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-primary/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-secondary/20 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-2xl relative z-10">
        <div className="text-center mb-8">
          <Link href="/" className="text-3xl font-bold text-primary tracking-tighter inline-block mb-4">Te RURUBENE</Link>
          <h1 className="text-4xl font-bold text-white mb-2">Become a Creator</h1>
          <p className="text-white/60 text-lg">Share your music with the Pacific and the world.</p>
        </div>

        {/* Progress Bar */}
        <div className="flex items-center justify-center space-x-4 mb-8">
            <div className={`h-2 flex-1 rounded-full ${step >= 1 ? 'bg-primary' : 'bg-white/10'}`} />
            <div className={`h-2 flex-1 rounded-full transition-colors ${step >= 2 ? 'bg-primary' : 'bg-white/10'}`} />
            <div className={`h-2 flex-1 rounded-full transition-colors ${step >= 3 ? 'bg-primary' : 'bg-white/10'}`} />
        </div>

        {/* Error/Success Messages */}
        {status === 'error' && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-4 rounded-xl flex items-center mb-6">
            <AlertCircle size={20} className="mr-3 shrink-0" />
            <p className="text-sm font-medium">{errorMessage}</p>
          </div>
        )}
        {status === 'success' && (
          <div className="bg-green-500/10 border border-green-500/50 text-green-400 p-4 rounded-xl flex items-center mb-6">
            <CheckCircle2 size={20} className="mr-3 shrink-0" />
            <p className="text-sm font-medium">Onboarding complete! Redirecting to your Studio...</p>
          </div>
        )}

        {/* Step 1: Account Registration */}
        {step === 1 && (
          <form onSubmit={handleRegister} className="bg-surface p-8 rounded-3xl border border-white/5 shadow-2xl space-y-6 animate-in fade-in slide-in-from-bottom-4">
            <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-white">Create your Account</h2>
                <p className="text-white/50 text-sm mt-1">We'll use this to secure your creator profile.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <label className="text-sm font-medium text-white/80">Full Name</label>
                    <input type="text" required value={name} onChange={e => setName(e.target.value)} className="w-full bg-background border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:border-primary transition" placeholder="John Doe" />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium text-white/80">Email Address</label>
                    <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-background border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:border-primary transition" placeholder="john@example.com" />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <label className="text-sm font-medium text-white/80">Password</label>
                    <input type="password" required value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-background border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:border-primary transition" placeholder="••••••••" minLength={8} />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium text-white/80">Confirm Password</label>
                    <input type="password" required value={passwordConfirmation} onChange={e => setPasswordConfirmation(e.target.value)} className="w-full bg-background border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:border-primary transition" placeholder="••••••••" minLength={8} />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <label className="text-sm font-medium text-white/80">Country</label>
                    <select required value={country} onChange={e => setCountry(e.target.value)} className="w-full bg-background border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:border-primary transition appearance-none">
                        <option value="Kiribati">Kiribati</option>
                        <option value="Fiji">Fiji</option>
                        <option value="Samoa">Samoa</option>
                        <option value="Tonga">Tonga</option>
                        <option value="Other">Other</option>
                    </select>
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium text-white/80">Island / Region</label>
                    <input type="text" required value={island} onChange={e => setIsland(e.target.value)} className="w-full bg-background border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:border-primary transition" placeholder="e.g. Tarawa" />
                </div>
            </div>

            <button type="submit" disabled={status === 'loading'} className="w-full bg-primary hover:bg-primary-hover text-white font-bold py-4 rounded-xl transition flex items-center justify-center space-x-2 disabled:opacity-50">
                {status === 'loading' ? <Loader2 className="animate-spin" /> : <span>Continue to Selection</span>}
            </button>
          </form>
        )}

        {/* Step 2: Creator Type Selection */}
        {step === 2 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-8">
            <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-white">Choose your Path</h2>
                <p className="text-white/50 text-sm mt-1">Select how you want to manage your music and earnings.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Independent Card */}
                <div 
                    onClick={() => { setCreatorType('independent'); setStep(3); }}
                    className="bg-surface border border-white/10 rounded-3xl p-8 hover:border-primary hover:bg-primary/5 transition cursor-pointer group flex flex-col h-full"
                >
                    <div className="w-16 h-16 rounded-2xl bg-primary/20 text-primary flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                        <Mic2 size={32} />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-3">Independent Artist</h3>
                    <ul className="space-y-3 mb-8 flex-1 text-white/60 text-sm">
                        <li className="flex items-center"><CheckCircle2 size={16} className="text-green-400 mr-2" /> Upload music directly</li>
                        <li className="flex items-center"><CheckCircle2 size={16} className="text-green-400 mr-2" /> Keep 100% of your earnings cut</li>
                        <li className="flex items-center"><CheckCircle2 size={16} className="text-green-400 mr-2" /> Personal dashboard</li>
                    </ul>
                    <div className="flex items-center text-primary font-bold group-hover:translate-x-2 transition-transform">
                        Continue as Independent <ArrowRight size={18} className="ml-2" />
                    </div>
                </div>

                {/* Studio Card */}
                <div 
                    onClick={() => { setCreatorType('studio'); setStep(3); }}
                    className="bg-surface border border-white/10 rounded-3xl p-8 hover:border-secondary hover:bg-secondary/5 transition cursor-pointer group flex flex-col h-full"
                >
                    <div className="w-16 h-16 rounded-2xl bg-secondary/20 text-secondary flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                        <Users size={32} />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-3">Studio-Managed Artist</h3>
                    <ul className="space-y-3 mb-8 flex-1 text-white/60 text-sm">
                        <li className="flex items-center"><CheckCircle2 size={16} className="text-green-400 mr-2" /> Join an existing recording studio</li>
                        <li className="flex items-center"><CheckCircle2 size={16} className="text-green-400 mr-2" /> Automated revenue sharing</li>
                        <li className="flex items-center"><CheckCircle2 size={16} className="text-green-400 mr-2" /> Professional management tools</li>
                    </ul>
                    <div className="flex items-center text-secondary font-bold group-hover:translate-x-2 transition-transform">
                        Continue with Studio <ArrowRight size={18} className="ml-2" />
                    </div>
                </div>
            </div>
          </div>
        )}

        {/* Step 3A: Independent Setup */}
        {step === 3 && creatorType === 'independent' && (
           <form onSubmit={handleSetupIndependent} className="bg-surface p-8 rounded-3xl border border-white/5 shadow-2xl space-y-6 animate-in fade-in slide-in-from-right-8">
             <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/20 text-primary mb-4">
                    <Mic2 size={24} />
                </div>
                <h2 className="text-2xl font-bold text-white">Independent Profile</h2>
                <p className="text-white/50 text-sm mt-1">Set up your public artist identity.</p>
             </div>

             <div className="space-y-2">
                 <label className="text-sm font-medium text-white/80">Stage / Artist Name</label>
                 <input type="text" required value={artistName} onChange={e => setArtistName(e.target.value)} className="w-full bg-background border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:border-primary transition" placeholder="DJ Kiribati" />
             </div>

             <div className="space-y-2">
                 <label className="text-sm font-medium text-white/80">Artist Bio (Optional)</label>
                 <textarea rows={4} value={bio} onChange={e => setBio(e.target.value)} className="w-full bg-background border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:border-primary transition resize-none" placeholder="Tell your fans about yourself..." />
             </div>

             <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 flex items-start space-x-3 mt-4">
                 <CheckCircle2 className="text-primary mt-0.5 shrink-0" size={18} />
                 <p className="text-xs text-white/70 leading-relaxed">As an Independent Artist, you will receive 100% of the creator revenue share directly to your wallet. You can always join a studio later.</p>
             </div>

             <button type="submit" disabled={status === 'loading' || status === 'success'} className="w-full bg-primary hover:bg-primary-hover text-white font-bold py-4 rounded-xl transition flex items-center justify-center space-x-2 disabled:opacity-50">
                 {status === 'loading' ? <Loader2 className="animate-spin" /> : <span>Launch Artist Profile</span>}
             </button>
             
             <button type="button" onClick={() => setStep(2)} className="w-full text-white/50 hover:text-white transition py-2 text-sm font-medium">Go Back</button>
           </form>
        )}

        {/* Step 3B: Studio Setup */}
        {step === 3 && creatorType === 'studio' && (
           <form onSubmit={handleSetupStudio} className="bg-surface p-8 rounded-3xl border border-white/5 shadow-2xl space-y-6 animate-in fade-in slide-in-from-right-8">
             <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-secondary/20 text-secondary mb-4">
                    <Users size={24} />
                </div>
                <h2 className="text-2xl font-bold text-white">Join your Studio</h2>
                <p className="text-white/50 text-sm mt-1">Connect your account using the code provided by your manager.</p>
             </div>

             <div className="space-y-2">
                 <label className="text-sm font-medium text-white/80">Stage / Artist Name</label>
                 <input type="text" required value={artistName} onChange={e => setArtistName(e.target.value)} className="w-full bg-background border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:border-secondary transition" placeholder="e.g. DJ Kiribati" />
             </div>

             <div className="space-y-2">
                 <label className="text-sm font-medium text-white/80">Studio Invitation Code</label>
                 <input type="text" required value={invitationCode} onChange={e => setInvitationCode(e.target.value.toUpperCase())} className="w-full bg-background border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:border-secondary transition text-center tracking-[0.5em] font-mono font-bold text-xl uppercase" placeholder="XXXX-XXXX" />
             </div>

             <div className="bg-secondary/5 border border-secondary/20 rounded-xl p-4 flex items-start space-x-3 mt-4">
                 <AlertCircle className="text-secondary mt-0.5 shrink-0" size={18} />
                 <p className="text-xs text-white/70 leading-relaxed">By joining a studio, your revenue splits will be automatically handled according to the terms configured by your studio manager.</p>
             </div>

             <button type="submit" disabled={status === 'loading' || status === 'success'} className="w-full bg-secondary hover:opacity-90 text-white font-bold py-4 rounded-xl transition flex items-center justify-center space-x-2 disabled:opacity-50">
                 {status === 'loading' ? <Loader2 className="animate-spin" /> : <span>Verify & Join Studio</span>}
             </button>

             <button type="button" onClick={() => setStep(2)} className="w-full text-white/50 hover:text-white transition py-2 text-sm font-medium">Go Back</button>
           </form>
        )}

      </div>
    </div>
  );
}
