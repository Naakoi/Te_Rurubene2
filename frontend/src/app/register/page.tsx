'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/axios';
import { Loader2, AlertCircle, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

export default function ListenerRegisterPage() {
  const router = useRouter();
  const setUser = useAuthStore((state) => state.setUser);
  
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [walletPin, setWalletPin] = useState('');
  const [securityAnswer, setSecurityAnswer] = useState('');

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== passwordConfirmation) {
      setErrorMessage('Passwords do not match');
      setStatus('error');
      return;
    }

    if (!/^\d{4}$/.test(walletPin)) {
      setErrorMessage('Wallet PIN must be exactly 4 digits');
      setStatus('error');
      return;
    }

    if (!securityAnswer.trim()) {
      setErrorMessage('Please type your favorite Kiribati vocal style.');
      setStatus('error');
      return;
    }

    setStatus('loading');
    setErrorMessage('');

    try {
      const response = await api.post('/api/register', {
        name,
        email,
        password,
        password_confirmation: passwordConfirmation,
        role: 'client',
        wallet_pin: walletPin,
        security_question: 'What is the name of your favorite Kiribati Traditional Vocal Style?',
        security_answer: securityAnswer
      });
      
      localStorage.setItem('auth_token', response.data.access_token);
      setUser(response.data.user);
      setStatus('idle');
      router.push('/');
    } catch (err: any) {
      setStatus('error');
      setErrorMessage(err.response?.data?.message || 'Failed to register account.');
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 py-12 relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-[#00e5ff]/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-primary/20 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-2xl relative z-10">
        <div className="text-center mb-8">
          <Link href="/" className="text-3xl font-bold text-[#00e5ff] tracking-tighter inline-block mb-4">Te RURUBENE</Link>
          <h1 className="text-4xl font-bold text-white mb-2">Join as a Listener</h1>
          <p className="text-white/60 text-lg">Discover the sounds of the Pacific.</p>
        </div>

        {status === 'error' && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-4 rounded-xl flex items-center mb-6">
            <AlertCircle size={20} className="mr-3 shrink-0" />
            <p className="text-sm font-medium">{errorMessage}</p>
          </div>
        )}

        <form onSubmit={handleRegister} className="bg-surface p-8 rounded-3xl border border-white/5 shadow-2xl space-y-6 animate-in fade-in slide-in-from-bottom-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                  <label className="text-sm font-medium text-white/80">Full Name</label>
                  <input type="text" required value={name} onChange={e => setName(e.target.value)} className="w-full bg-background border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:border-[#00e5ff] transition" placeholder="John Doe" />
              </div>
              <div className="space-y-2">
                  <label className="text-sm font-medium text-white/80">Email Address</label>
                  <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-background border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:border-[#00e5ff] transition" placeholder="john@example.com" />
              </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                  <label className="text-sm font-medium text-white/80">Password</label>
                  <input type="password" required value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-background border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:border-[#00e5ff] transition" placeholder="••••••••" minLength={8} />
              </div>
              <div className="space-y-2">
                  <label className="text-sm font-medium text-white/80">Confirm Password</label>
                  <input type="password" required value={passwordConfirmation} onChange={e => setPasswordConfirmation(e.target.value)} className="w-full bg-background border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:border-[#00e5ff] transition" placeholder="••••••••" minLength={8} />
              </div>
          </div>

          <div className="space-y-2 border-t border-white/10 pt-6">
              <label className="text-sm font-medium text-[#00e5ff] flex items-center space-x-2">
                  <span>Secure Wallet PIN (4 Digits)</span>
              </label>
              <p className="text-xs text-white/50 mb-2">You will need this PIN to open your Rurubene wallet and manage your funds.</p>
              <input 
                  type="password" 
                  required 
                  value={walletPin} 
                  onChange={e => setWalletPin(e.target.value.replace(/\D/g, '').slice(0, 4))} 
                  className="w-full max-w-[200px] bg-background border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:border-[#00e5ff] transition font-mono tracking-[0.5em] text-center text-xl" 
                  placeholder="••••" 
                  maxLength={4}
              />
          </div>

          {/* Security Question Section */}
          <div className="space-y-4 border-t border-white/10 pt-6">
              <div className="flex items-center space-x-2 text-primary">
                 <ShieldCheck size={20} />
                 <h3 className="font-bold">Security Question</h3>
              </div>
              <p className="text-sm font-medium text-white/80">What is the name of your favorite Kiribati Traditional Vocal Style?</p>
              
              <div className="bg-black/20 p-4 rounded-xl border border-white/5 text-xs text-white/60 space-y-2 mb-4">
                 <p className="font-semibold text-white/80 mb-2">Choose one of the following to retype below:</p>
                 <ul className="list-disc pl-5 space-y-1">
                    <li><strong className="text-white">Te Katake</strong> – "The Slow Chant" (Epic poem recitations)</li>
                    <li><strong className="text-white">Te Kabae</strong> – "The Tied Song" (Poetic compositions for chiefs/guests)</li>
                    <li><strong className="text-white">Te Kamei</strong> – "The Playful Song" (Lighthearted, uptempo pieces)</li>
                    <li><strong className="text-white">Te Ruoia</strong> – "The Movement Sound" (Ancient, rhythmic chanting)</li>
                    <li><strong className="text-white">Te Bino</strong> – "The Sitting Song" (Harmonized choral chants)</li>
                 </ul>
              </div>

              <div className="space-y-2">
                  <input 
                    type="text" 
                    required 
                    value={securityAnswer} 
                    onChange={e => setSecurityAnswer(e.target.value)} 
                    className="w-full bg-background border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:border-primary transition placeholder:text-white/20" 
                    placeholder="Type your chosen style here (e.g. Te Bino)" 
                  />
                  <p className="text-[10px] text-white/40">This will be used if you ever need to recover your account.</p>
              </div>
          </div>

          <button type="submit" disabled={status === 'loading'} className="w-full bg-[#00e5ff] hover:bg-[#00b3cc] text-black font-black uppercase tracking-widest py-4 rounded-xl transition flex items-center justify-center space-x-2 disabled:opacity-50 mt-4">
              {status === 'loading' ? <Loader2 className="animate-spin" /> : <span>Create Account</span>}
          </button>

          <div className="text-center mt-6">
            <p className="text-sm text-white/50">Already have an account? <Link href="/login" className="text-[#00e5ff] hover:underline font-bold">Sign In</Link></p>
          </div>
        </form>
      </div>
    </div>
  );
}
