'use client';

import { useEffect, useRef, useState } from 'react';
import api from '@/lib/axios';
import {
  Wallet, Plus, CreditCard, History, ArrowUpRight, ArrowDownLeft,
  X, Lock, CheckCircle, Loader2, Shield, AlertCircle, TrendingUp,
  Building, Upload, FileText, KeyRound, RefreshCw, Send,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import OfflineView from '@/components/OfflineView';

// ── Stripe.js loader (dynamic — must not be bundled per PCI-DSS) ──────────────
function useStripeJs(publishableKey: string | null) {
  const [stripe, setStripe] = useState<any>(null);

  useEffect(() => {
    if (!publishableKey) return;
    if ((window as any).Stripe) {
      setStripe((window as any).Stripe(publishableKey));
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://js.stripe.com/v3/';
    script.async = true;
    script.onload = () => setStripe((window as any).Stripe(publishableKey));
    document.head.appendChild(script);
  }, [publishableKey]);

  return stripe;
}

// ── Gateway Checkout Modal ────────────────────────────────────────────────────
function GatewayModal({
  amount,
  onClose,
  onSuccess,
}: {
  amount: number;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [stage, setStage] = useState<'form' | 'processing' | 'success' | 'error'>('form');
  const [errorMsg, setErrorMsg] = useState('');

  // Simulation path state
  const [cardNum, setCardNum] = useState('4242 4242 4242 4242');
  const [expiry, setExpiry] = useState('12/28');
  const [cvv, setCvv] = useState('');
  const [name, setName] = useState('');

  // Live Stripe path state
  const [paymentMode, setPaymentMode] = useState<'simulation' | 'live' | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [publishableKey, setPublishableKey] = useState<string | null>(null);
  const [stripeElements, setStripeElements] = useState<any>(null);
  const [cardElement, setCardElement] = useState<any>(null);
  const stripeRef = useStripeJs(publishableKey);

  // Mount Stripe Elements when live mode is active and Stripe.js is ready
  useEffect(() => {
    if (paymentMode !== 'live' || !stripeRef || stripeElements) return;
    const elements = stripeRef.elements();
    const card = elements.create('card', {
      style: {
        base: {
          color: '#ffffff',
          fontFamily: 'inherit',
          fontSize: '15px',
          '::placeholder': { color: '#6b7280' },
          iconColor: '#6b7280',
        },
        invalid: { color: '#f87171' },
      },
    });
    card.mount('#stripe-card-element');
    setStripeElements(elements);
    setCardElement(card);
  }, [paymentMode, stripeRef, stripeElements]);

  const handlePay = async () => {
    if (paymentMode === 'live') {
      handleLivePay();
    } else {
      handleSimulationPay();
    }
  };

  // ── Simulation path ──────────────────────────────────────────────────────────
  const handleSimulationPay = async () => {
    if (!name.trim() || !cvv.trim()) return;
    setStage('processing');
    try {
      const intentRes = await api.post('/api/wallet/topup/intent', { amount, source: 'stripe' });
      const { checkout_url, mode, client_secret, publishable_key } = intentRes.data;

      if (mode === 'live') {
        // Backend switched to live mode mid-session — re-route
        setPaymentMode('live');
        setClientSecret(client_secret);
        setPublishableKey(publishable_key);
        setStage('form');
        return;
      }

      // Simulation: trigger the signed callback
      await api.get(checkout_url, { baseURL: '' });
      setStage('success');
      setTimeout(() => { onSuccess(); onClose(); }, 2200);
    } catch (err: any) {
      console.error('Top-up failed', err);
      setErrorMsg(err?.response?.data?.message || 'Something went wrong. Please try again.');
      setStage('error');
    }
  };

  // ── Live Stripe path ─────────────────────────────────────────────────────────
  const initializeLiveIntent = async () => {
    try {
      const intentRes = await api.post('/api/wallet/topup/intent', { amount, source: 'stripe' });
      const { mode, client_secret, publishable_key } = intentRes.data;

      if (mode === 'simulation') {
        // Admin switched back to simulation mode
        setPaymentMode('simulation');
        return;
      }

      setPaymentMode('live');
      setClientSecret(client_secret);
      setPublishableKey(publishable_key);
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.message || 'Could not initialize payment.');
      setStage('error');
    }
  };

  const handleLivePay = async () => {
    if (!stripeRef || !cardElement || !clientSecret) return;
    setStage('processing');
    try {
      const { error, paymentIntent } = await stripeRef.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
          billing_details: { name: name.trim() || 'Rurubene Listener' },
        },
      });

      if (error) {
        setErrorMsg(error.message || 'Card declined.');
        setStage('error');
        return;
      }

      if (paymentIntent?.status === 'succeeded') {
        // Stripe has confirmed — the backend webhook will credit the wallet.
        // We poll briefly or just show success; the balance refetch will pick it up.
        setStage('success');
        setTimeout(() => { onSuccess(); onClose(); }, 2800);
      }
    } catch (err) {
      setErrorMsg('An unexpected error occurred.');
      setStage('error');
    }
  };

  // Detect mode on first mount by fetching the wallet config
  useEffect(() => {
    api.get('/api/wallet/config').then(res => {
      setPaymentMode(res.data.wallet_testing_mode ? 'simulation' : 'live');
      if (!res.data.wallet_testing_mode) {
        initializeLiveIntent();
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const formatCard = (v: string) =>
    v.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();

  const formatExpiry = (v: string) => {
    const d = v.replace(/\D/g, '').slice(0, 4);
    return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
  };

  const canSubmitSimulation = name.trim() && cvv.trim();
  const canSubmitLive = !!stripeRef && !!cardElement && !!clientSecret;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
      <div className="w-full max-w-md glass-card rounded-3xl overflow-hidden shadow-2xl border border-white/10 animate-in fade-in zoom-in-95 duration-300">
        {/* Header */}
        <div className={`p-6 relative bg-gradient-to-r ${paymentMode === 'live' ? 'from-violet-600 to-purple-700' : 'from-blue-600 to-indigo-700'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
                <Lock size={18} className="text-white" />
              </div>
              <div>
                <p className="text-white font-black text-lg">Secure Checkout</p>
                <p className="text-blue-200 text-xs">
                  {paymentMode === 'live' ? 'Powered by Stripe' : 'Powered by Rurubene Pay'}
                </p>
              </div>
            </div>
            {stage === 'form' && (
              <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition">
                <X size={16} className="text-white" />
              </button>
            )}
          </div>

          {/* Amount badge */}
          <div className="mt-5 bg-white/10 rounded-2xl p-4 flex items-center justify-between">
            <div>
              <p className="text-blue-200 text-xs font-bold uppercase tracking-widest">Amount Due</p>
              <p className="text-white text-3xl font-black mt-0.5">${amount.toFixed(2)} <span className="text-base font-medium text-blue-200">AUD</span></p>
            </div>
            <div className="flex space-x-1">
              {['visa', 'mc', 'amex'].map(b => (
                <div key={b} className="w-10 h-6 bg-white/20 rounded text-white text-[8px] font-black flex items-center justify-center uppercase">{b}</div>
              ))}
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-6">
          {stage === 'form' && paymentMode === null && (
            <div className="flex flex-col items-center justify-center py-10 space-y-3">
              <Loader2 size={32} className="animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Initializing payment…</p>
            </div>
          )}

          {/* ── Simulation form ── */}
          {stage === 'form' && paymentMode === 'simulation' && (
            <div className="space-y-4">
              <div className="flex items-center space-x-2 px-3 py-2 bg-yellow-500/10 border border-yellow-500/20 rounded-xl mb-2">
                <Shield size={13} className="text-yellow-500 shrink-0" />
                <p className="text-yellow-400 text-[11px] font-medium">Simulation mode — no real charges</p>
              </div>

              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1.5 block">Card Number</label>
                <div className="relative">
                  <input type="text" value={cardNum} onChange={e => setCardNum(formatCard(e.target.value))} placeholder="0000 0000 0000 0000" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10" />
                  <CreditCard size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1.5 block">Cardholder Name</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Full name on card" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1.5 block">Expiry</label>
                  <input type="text" value={expiry} onChange={e => setExpiry(formatExpiry(e.target.value))} placeholder="MM/YY" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1.5 block">CVV</label>
                  <input type="password" value={cvv} onChange={e => setCvv(e.target.value.slice(0, 4))} placeholder="•••" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>

              <div className="flex items-center space-x-2 p-3 bg-green-500/10 border border-green-500/20 rounded-xl">
                <Shield size={14} className="text-green-500 shrink-0" />
                <p className="text-green-400 text-xs">256-bit SSL encrypted. Your card is safe.</p>
              </div>

              <button onClick={handlePay} disabled={!canSubmitSimulation} className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-black rounded-2xl transition shadow-lg shadow-blue-500/20 text-lg">
                Pay ${amount.toFixed(2)} AUD
              </button>
            </div>
          )}

          {/* ── Live Stripe form ── */}
          {stage === 'form' && paymentMode === 'live' && (
            <div className="space-y-4">
              <div className="flex items-center space-x-2 px-3 py-2 bg-violet-500/10 border border-violet-500/20 rounded-xl mb-2">
                <Shield size={13} className="text-violet-400 shrink-0" />
                <p className="text-violet-300 text-[11px] font-medium">Secured by Stripe — PCI-DSS compliant</p>
              </div>

              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1.5 block">Cardholder Name</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Full name on card" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
              </div>

              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1.5 block">Card Details</label>
                {/* Stripe mounts its secure iframe here */}
                <div id="stripe-card-element" className="bg-white/5 border border-white/10 rounded-xl px-4 py-4 focus-within:ring-2 focus-within:ring-violet-500 transition" />
                {!stripeRef && (
                  <p className="text-xs text-muted-foreground mt-1.5 flex items-center space-x-1">
                    <Loader2 size={11} className="animate-spin" />
                    <span>Loading secure card fields…</span>
                  </p>
                )}
              </div>

              <div className="flex items-center space-x-2 p-3 bg-green-500/10 border border-green-500/20 rounded-xl">
                <Shield size={14} className="text-green-500 shrink-0" />
                <p className="text-green-400 text-xs">Card data goes directly to Stripe — never touches our servers.</p>
              </div>

              <button onClick={handleLivePay} disabled={!canSubmitLive} className="w-full py-4 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-black rounded-2xl transition shadow-lg shadow-violet-500/20 text-lg">
                Pay ${amount.toFixed(2)} AUD via Stripe
              </button>
            </div>
          )}

          {stage === 'processing' && (
            <div className="flex flex-col items-center justify-center py-10 space-y-4">
              <div className="w-16 h-16 rounded-full border-4 border-blue-500/20 border-t-blue-500 animate-spin" />
              <p className="text-lg font-bold">Processing Payment…</p>
              <p className="text-sm text-muted-foreground text-center">Please don't close this window</p>
            </div>
          )}

          {stage === 'success' && (
            <div className="flex flex-col items-center justify-center py-10 space-y-4">
              <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center">
                <CheckCircle size={32} className="text-green-500" />
              </div>
              <p className="text-xl font-black text-green-400">Payment Successful!</p>
              <p className="text-sm text-muted-foreground text-center">${amount.toFixed(2)} AUD has been added to your Rurubene wallet.</p>
              {paymentMode === 'live' && (
                <p className="text-xs text-muted-foreground text-center">Your balance will reflect shortly after Stripe confirms the transaction.</p>
              )}
            </div>
          )}

          {stage === 'error' && (
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
              <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center">
                <AlertCircle size={32} className="text-red-500" />
              </div>
              <p className="text-lg font-bold text-red-400">Payment Failed</p>
              <p className="text-sm text-muted-foreground text-center">{errorMsg || 'Something went wrong. Please try again.'}</p>
              <button onClick={() => { setStage('form'); setErrorMsg(''); }} className="px-6 py-2 bg-white/10 rounded-xl font-bold text-sm hover:bg-white/20 transition">
                Try Again
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


// ── ANZ Kiribati Bank Deposit Modal ───────────────────────────────────────────
function BankDepositModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [stage, setStage] = useState<'form' | 'processing' | 'success' | 'error'>('form');
  const [amount, setAmount] = useState<string>('');
  const [file, setFile] = useState<File | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) {
      setErrorMsg('Please enter a valid amount.');
      return;
    }
    if (!file) {
      setErrorMsg('Please upload a screenshot or PDF of your internet banking receipt.');
      return;
    }

    setStage('processing');
    setErrorMsg('');

    try {
      const formData = new FormData();
      formData.append('amount', amount);
      formData.append('receipt', file);

      const res = await api.post('/api/wallet/bank-deposit', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setSuccessMsg(res.data.message || 'Receipt submitted successfully!');
      setStage('success');
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 2500);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.response?.data?.message || 'Failed to submit receipt. Please try again.');
      setStage('error');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
      <div className="w-full max-w-md glass-card rounded-3xl overflow-hidden shadow-2xl border border-white/10 animate-in fade-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="p-6 relative bg-gradient-to-r from-blue-600 to-indigo-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
                <Building size={18} className="text-white" />
              </div>
              <div>
                <p className="text-white font-black text-lg">Bank Transfer Receipt</p>
                <p className="text-blue-200 text-xs font-bold">ANZ Kiribati Internet Banking</p>
              </div>
            </div>
            {stage === 'form' && (
              <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition">
                <X size={16} className="text-white" />
              </button>
            )}
          </div>
        </div>

        {/* Body */}
        <div className="p-6">
          {stage === 'form' && (
            <form onSubmit={handleUpload} className="space-y-4">
              {/* Bank Details Panel */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-2">
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold">Transfer Instructions</p>
                <p className="text-sm text-white/90">Please transfer the desired amount to the following ANZ Kiribati account, then upload your receipt below:</p>
                
                <div className="grid grid-cols-2 gap-2 pt-2 text-sm border-t border-white/5">
                  <span className="text-muted-foreground">Account Name:</span>
                  <span className="font-bold text-white text-right">Nakoi Mathew</span>

                  <span className="text-muted-foreground">Account Number:</span>
                  <span className="font-bold text-white text-right">1179859</span>

                  <span className="text-muted-foreground">Bank:</span>
                  <span className="font-bold text-white text-right">ANZ Kiribati</span>
                </div>
              </div>

              {/* Amount Field */}
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1.5 block">Transfer Amount (AUD)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <span className="text-white/50 font-bold">$</span>
                  </div>
                  <input
                    type="number"
                    min="1"
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="e.g. 50.00"
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-8 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold text-white"
                    required
                  />
                </div>
              </div>

              {/* File Upload Field */}
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1.5 block">Upload Receipt Image or PDF</label>
                <label className="flex flex-col items-center justify-center w-full bg-white/5 hover:bg-white/10 border-2 border-dashed border-white/20 hover:border-white/30 rounded-2xl p-6 cursor-pointer transition">
                  <Upload size={28} className="text-primary mb-2" />
                  <span className="text-xs font-bold text-white/80 text-center truncate max-w-[250px]">
                    {file ? file.name : 'Choose receipt image or PDF'}
                  </span>
                  <span className="text-[10px] text-muted-foreground mt-1">Max file size 10MB</span>
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setFile(e.target.files[0]);
                      }
                    }}
                    className="hidden"
                    required
                  />
                </label>
              </div>

              {errorMsg && (
                <div className="flex items-center space-x-2 text-red-500 bg-red-500/10 p-3 rounded-xl border border-red-500/20 text-xs font-semibold">
                  <AlertCircle size={14} className="shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={!amount || !file}
                className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-black rounded-2xl transition shadow-lg shadow-blue-500/20 text-lg"
              >
                Submit Receipt
              </button>
            </form>
          )}

          {stage === 'processing' && (
            <div className="flex flex-col items-center justify-center py-10 space-y-4">
              <div className="w-16 h-16 rounded-full border-4 border-blue-500/20 border-t-blue-500 animate-spin" />
              <p className="text-lg font-bold">Uploading Receipt…</p>
              <p className="text-sm text-muted-foreground text-center">Please don't close this window</p>
            </div>
          )}

          {stage === 'success' && (
            <div className="flex flex-col items-center justify-center py-10 space-y-4">
              <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center">
                <CheckCircle size={32} className="text-green-500" />
              </div>
              <p className="text-xl font-black text-green-400">Submitted!</p>
              <p className="text-sm text-muted-foreground text-center leading-relaxed">
                {successMsg}
              </p>
            </div>
          )}

          {stage === 'error' && (
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
              <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center">
                <AlertCircle size={32} className="text-red-500" />
              </div>
              <p className="text-lg font-bold text-red-400">Upload Failed</p>
              <p className="text-sm text-muted-foreground text-center">{errorMsg || 'Something went wrong. Please try again.'}</p>
              <button onClick={() => { setStage('form'); setErrorMsg(''); }} className="px-6 py-2 bg-white/10 rounded-xl font-bold text-sm hover:bg-white/20 transition">
                Try Again
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


// ── Withdrawal Modal ─────────────────────────────────────────────────────────
function WithdrawalModal({
  onClose,
  onSuccess,
  availableBalance,
}: {
  onClose: () => void;
  onSuccess: () => void;
  availableBalance: number;
}) {
  const [stage, setStage] = useState<'form' | 'processing' | 'success' | 'error'>('form');
  const [amount, setAmount] = useState<string>('');
  const [method, setMethod] = useState<'anz' | 'mpaisa' | 'other'>('anz');
  const [accountName, setAccountName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [bankName, setBankName] = useState('ANZ Kiribati');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = Number(amount);
    if (!amount || amt < 5) {
      setErrorMsg('Minimum withdrawal amount is $5.00 AUD.');
      return;
    }
    if (amt > availableBalance) {
      setErrorMsg('Insufficient available balance (including any pending withdrawals).');
      return;
    }
    if (!accountName.trim() || !accountNumber.trim() || !bankName.trim()) {
      setErrorMsg('All bank account details are required.');
      return;
    }

    setStage('processing');
    setErrorMsg('');

    try {
      await api.post('/api/wallet/withdraw', {
        amount: amt,
        method,
        account_name: accountName,
        account_number: accountNumber,
        bank_name: bankName,
      });

      setStage('success');
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 2500);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.response?.data?.message || 'Failed to submit withdrawal request. Please try again.');
      setStage('error');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
      <div className="w-full max-w-md glass-card rounded-3xl overflow-hidden shadow-2xl border border-white/10 animate-in fade-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="p-6 relative bg-gradient-to-r from-violet-600 to-indigo-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
                <ArrowUpRight size={18} className="text-white" />
              </div>
              <div>
                <p className="text-white font-black text-lg">Request Withdrawal</p>
                <p className="text-violet-200 text-xs font-bold">Transfer funds out of your wallet</p>
              </div>
            </div>
            {stage === 'form' && (
              <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition">
                <X size={16} className="text-white" />
              </button>
            )}
          </div>
        </div>

        {/* Body */}
        <div className="p-6">
          {stage === 'form' && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-xs space-y-1 text-muted-foreground">
                <div className="flex justify-between">
                  <span>Available Balance:</span>
                  <span className="font-bold text-white">${availableBalance.toFixed(2)} AUD</span>
                </div>
                <div className="flex justify-between">
                  <span>Min Withdrawal:</span>
                  <span className="font-bold text-white">$5.00 AUD</span>
                </div>
              </div>

              {/* Amount Field */}
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1.5 block">Amount (AUD)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <span className="text-white/50 font-bold">$</span>
                  </div>
                  <input
                    type="number"
                    min="5"
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-8 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 font-bold text-white"
                    required
                  />
                </div>
              </div>

              {/* Method Field */}
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1.5 block">Payout Method</label>
                <select
                  value={method}
                  onChange={(e) => {
                    const m = e.target.value as 'anz' | 'mpaisa' | 'other';
                    setMethod(m);
                    if (m === 'anz') setBankName('ANZ Kiribati');
                    else if (m === 'mpaisa') setBankName('mPaisa Kiribati');
                    else setBankName('');
                  }}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 font-bold text-white"
                >
                  <option value="anz" className="bg-neutral-900 text-white">ANZ Bank Transfer</option>
                  <option value="mpaisa" className="bg-neutral-900 text-white">mPaisa Mobile Wallet</option>
                  <option value="other" className="bg-neutral-900 text-white">Other Payout Method</option>
                </select>
              </div>

              {/* Account Name */}
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1.5 block">Account Name</label>
                <input
                  type="text"
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                  placeholder="e.g. John Doe"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 text-white"
                  required
                />
              </div>

              {/* Account Number / Phone */}
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1.5 block">
                  {method === 'mpaisa' ? 'mPaisa Mobile Number' : 'Account Number'}
                </label>
                <input
                  type="text"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  placeholder={method === 'mpaisa' ? 'e.g. +686 73000000' : 'e.g. 12345678'}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 text-white"
                  required
                />
              </div>

              {/* Bank Name */}
              {method === 'other' && (
                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1.5 block">Bank / Provider Name</label>
                  <input
                    type="text"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    placeholder="e.g. Westpac"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 text-white"
                    required
                  />
                </div>
              )}

              {errorMsg && (
                <div className="flex items-center space-x-2 text-red-500 bg-red-500/10 p-3 rounded-xl border border-red-500/20 text-xs font-semibold">
                  <AlertCircle size={14} className="shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={!amount || !accountName || !accountNumber}
                className="w-full py-4 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-black rounded-2xl transition shadow-lg shadow-violet-500/20 text-lg"
              >
                Submit Request
              </button>
            </form>
          )}

          {stage === 'processing' && (
            <div className="flex flex-col items-center justify-center py-10 space-y-4">
              <div className="w-16 h-16 rounded-full border-4 border-violet-500/20 border-t-violet-500 animate-spin" />
              <p className="text-lg font-bold">Submitting Request…</p>
              <p className="text-sm text-muted-foreground text-center">Please don't close this window</p>
            </div>
          )}

          {stage === 'success' && (
            <div className="flex flex-col items-center justify-center py-10 space-y-4">
              <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center">
                <CheckCircle size={32} className="text-green-500" />
              </div>
              <p className="text-xl font-black text-green-400">Request Received!</p>
              <p className="text-sm text-muted-foreground text-center leading-relaxed">
                Your withdrawal request has been submitted. An administrator will process your transfer via ANZ and upload proof.
              </p>
            </div>
          )}

          {stage === 'error' && (
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
              <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center">
                <AlertCircle size={32} className="text-red-500" />
              </div>
              <p className="text-lg font-bold text-red-400">Request Failed</p>
              <p className="text-sm text-muted-foreground text-center">{errorMsg || 'Something went wrong. Please try again.'}</p>
              <button onClick={() => { setStage('form'); setErrorMsg(''); }} className="px-6 py-2 bg-white/10 rounded-xl font-bold text-sm hover:bg-white/20 transition">
                Try Again
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


// ── Transfer Credit Modal ──────────────────────────────────────────────────
function TransferModal({
  onClose,
  onSuccess,
  availableBalance,
  hasPin,
}: {
  onClose: () => void;
  onSuccess: () => void;
  availableBalance: number;
  hasPin: boolean;
}) {
  const [stage, setStage] = useState<'form' | 'processing' | 'success' | 'error'>('form');
  const [walletId, setWalletId] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [pin, setPin] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Auto-format wallet ID input: ensure RURU- prefix and uppercase
  const handleWalletIdChange = (raw: string) => {
    let val = raw.toUpperCase().replace(/[^A-Z0-9-]/g, '');
    if (!val.startsWith('RURU-')) {
      const digits = val.replace(/^RURU-?/, '');
      val = 'RURU-' + digits;
    }
    setWalletId(val);
  };

  const walletIdValid = /^RURU-\d{1,}$/.test(walletId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = Number(amount);
    if (!walletId.trim() || !walletIdValid) {
      setErrorMsg('Please enter a valid Wallet ID (e.g. RURU-000001).');
      return;
    }
    if (!amount || amt <= 0) {
      setErrorMsg('Please enter a valid transfer amount.');
      return;
    }
    if (amt > availableBalance) {
      setErrorMsg('Insufficient available balance.');
      return;
    }
    if (hasPin && (!pin || pin.length !== 4)) {
      setErrorMsg('Please enter your 4-digit Wallet PIN.');
      return;
    }

    setStage('processing');
    setErrorMsg('');

    try {
      await api.post('/api/wallet/transfer', {
        wallet_id: walletId.trim(),
        amount: amt,
        description: description.trim() || undefined,
        pin: hasPin ? pin : undefined,
      });

      setStage('success');
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 2500);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.response?.data?.message || 'Failed to complete credit transfer.');
      setStage('error');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
      <div className="w-full max-w-md glass-card rounded-3xl overflow-hidden shadow-2xl border border-white/10 animate-in fade-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="p-6 relative bg-gradient-to-r from-emerald-600 to-teal-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
                <Send size={18} className="text-white" />
              </div>
              <div>
                <p className="text-white font-black text-lg">Transfer Credits</p>
                <p className="text-emerald-200 text-xs font-bold">Instantly send credits to another user</p>
              </div>
            </div>
            {stage === 'form' && (
              <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition">
                <X size={16} className="text-white" />
              </button>
            )}
          </div>
        </div>

        {/* Body */}
        <div className="p-6">
          {stage === 'form' && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-xs space-y-1 text-muted-foreground">
                <div className="flex justify-between">
                  <span>Available Balance:</span>
                  <span className="font-bold text-white">${availableBalance.toFixed(2)} AUD</span>
                </div>
              </div>

              {/* Recipient Wallet ID */}
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1.5 block">Recipient Wallet ID</label>
                <input
                  type="text"
                  value={walletId}
                  onChange={(e) => handleWalletIdChange(e.target.value)}
                  placeholder="RURU-000001"
                  spellCheck={false}
                  className={`w-full bg-white/5 border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-white font-mono tracking-widest uppercase transition ${
                    walletId && !walletIdValid
                      ? 'border-red-500/50 focus:ring-red-500'
                      : walletId && walletIdValid
                      ? 'border-emerald-500/50'
                      : 'border-white/10'
                  }`}
                  required
                />
                <p className="text-[10px] text-muted-foreground mt-1.5">Ask the recipient to share their Wallet ID from their wallet page.</p>
              </div>

              {/* Amount Field */}
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1.5 block">Amount (AUD)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <span className="text-white/50 font-bold">$</span>
                  </div>
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-8 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold text-white"
                    required
                  />
                </div>
              </div>

              {/* Description Field */}
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1.5 block">Description (Optional)</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Thanks for the help!"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-white"
                />
              </div>

              {/* Wallet PIN Field */}
              {hasPin && (
                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1.5 block">4-Digit Wallet PIN</label>
                  <input
                    type="password"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={4}
                    value={pin}
                    onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    placeholder="••••"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-white tracking-[0.5em] font-mono text-center"
                    required
                  />
                </div>
              )}

              {errorMsg && (
                <div className="flex items-center space-x-2 text-red-500 bg-red-500/10 p-3 rounded-xl border border-red-500/20 text-xs font-semibold">
                  <AlertCircle size={14} className="shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={!walletId || !walletIdValid || !amount}
                className="w-full py-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-black rounded-2xl transition shadow-lg shadow-emerald-500/20 text-lg"
              >
                Send Credits
              </button>
            </form>
          )}

          {stage === 'processing' && (
            <div className="flex flex-col items-center justify-center py-10 space-y-4">
              <div className="w-16 h-16 rounded-full border-4 border-emerald-500/20 border-t-emerald-500 animate-spin" />
              <p className="text-lg font-bold">Processing Transfer…</p>
              <p className="text-sm text-muted-foreground text-center">Please don't close this window</p>
            </div>
          )}

          {stage === 'success' && (
            <div className="flex flex-col items-center justify-center py-10 space-y-4">
              <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center">
                <CheckCircle size={32} className="text-green-500" />
              </div>
              <p className="text-xl font-black text-green-400">Transfer Initiated!</p>
              <p className="text-sm text-muted-foreground text-center leading-relaxed">
                The transfer was initiated. The recipient has been notified and must accept the transfer to receive the funds.
              </p>
            </div>
          )}

          {stage === 'error' && (
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
              <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center">
                <AlertCircle size={32} className="text-red-500" />
              </div>
              <p className="text-lg font-bold text-red-400">Transfer Failed</p>
              <p className="text-sm text-muted-foreground text-center">{errorMsg || 'Something went wrong. Please try again.'}</p>
              <button onClick={() => { setStage('form'); setErrorMsg(''); }} className="px-6 py-2 bg-white/10 rounded-xl font-bold text-sm hover:bg-white/20 transition">
                Try Again
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


// ── Main Wallet Page ──────────────────────────────────────────────────────────
export default function WalletPage() {
  const user = useAuthStore((state) => state.user);
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [gateway, setGateway] = useState<{ open: boolean; amount: number }>({ open: false, amount: 0 });
  const [testingMode, setTestingMode] = useState<boolean>(true);
  const [hoveredPoint, setHoveredPoint] = useState<{ x: number; y: number; value: number; index: number } | null>(null);
  const [isOffline, setIsOffline] = useState(false);

  // ── Wallet PIN Lock Screen State ───────────────────────────────────────────
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [hasPin, setHasPin] = useState<boolean | null>(null); // null = loading
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');
  const [pinLoading, setPinLoading] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [forgotStep, setForgotStep] = useState<'request' | 'verify'>('request');
  const [forgotOtp, setForgotOtp] = useState('');
  const [newPin, setNewPin] = useState('');
  const [forgotMsg, setForgotMsg] = useState('');
  const [forgotError, setForgotError] = useState('');
  const pinRef = useRef<HTMLInputElement>(null);

  // Bank Deposits State
  const [bankDeposits, setBankDeposits] = useState<any[]>([]);
  const [bankModalOpen, setBankModalOpen] = useState(false);

  // Withdrawals State
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [withdrawModalOpen, setWithdrawModalOpen] = useState(false);
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [incomingTransfers, setIncomingTransfers] = useState<any[]>([]);
  const [outgoingTransfers, setOutgoingTransfers] = useState<any[]>([]);
  const [toast, setToast] = useState<string | null>(null);

  // Redeem Code State
  const [redeemCode, setRedeemCode] = useState('');
  const [redeemStatus, setRedeemStatus] = useState<{ loading: boolean; error: string | null; success: string | null }>({
    loading: false, error: null, success: null
  });

  // Creator Earnings State
  const [earnings, setEarnings] = useState<any>(null);

  useEffect(() => {
    // Connection tracking
    const updateOnlineStatus = () => setIsOffline(!navigator.onLine);
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
    updateOnlineStatus();

    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    };
  }, []);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleConfirmWithdrawal = async (id: number) => {
    try {
      const res = await api.post(`/api/wallet/withdrawals/${id}/confirm`);
      showToast(res.data.message || 'Withdrawal confirmed and balance debited.');
      fetchWallet();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to confirm withdrawal.');
    }
  };

  const fetchPendingTransfers = () => {
    if (isOffline) return;
    api.get('/api/wallet/transfers/pending').then(res => {
      setIncomingTransfers(res.data.incoming || []);
      setOutgoingTransfers(res.data.outgoing || []);
    }).catch(() => {});
  };

  const handleAcceptTransfer = async (id: number) => {
    try {
      const res = await api.post(`/api/wallet/transfers/${id}/accept`);
      showToast(res.data.message || 'Transfer accepted successfully.');
      fetchWallet();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to accept transfer.');
    }
  };

  const handleRejectTransfer = async (id: number) => {
    try {
      const res = await api.post(`/api/wallet/transfers/${id}/reject`);
      showToast(res.data.message || 'Transfer rejected.');
      fetchWallet();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to reject transfer.');
    }
  };

  const handleCancelTransfer = async (id: number) => {
    try {
      const res = await api.post(`/api/wallet/transfers/${id}/cancel`);
      showToast(res.data.message || 'Transfer cancelled and refunded.');
      fetchWallet();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to cancel transfer.');
    }
  };

  const fetchWallet = () => {
    if (isOffline) return;
    api.get('/api/wallet').then(res => {
      setBalance(res.data.balance);
      setTransactions(res.data.transactions?.data || []);
    });
    
    fetchPendingTransfers();

    if (user?.role === 'artist' || user?.role === 'studio') {
      api.get('/api/wallet/earnings').then(res => {
        setEarnings(res.data);
      }).catch(() => {
        // Ignore if not a creator
      });
    }

    api.get('/api/wallet/bank-deposits').then(res => {
      setBankDeposits(res.data);
    }).catch(() => {
      // Ignore errors
    });

    api.get('/api/wallet/withdrawals').then(res => {
      setWithdrawals(res.data);
    }).catch(() => {
      // Ignore errors
    });
  };

  const handleRedeem = async () => {
    if (!redeemCode.trim()) return;
    setRedeemStatus({ loading: true, error: null, success: null });
    try {
      const res = await api.post('/api/wallet/redeem', { code: redeemCode.trim() });
      setRedeemStatus({ loading: false, error: null, success: res.data.message });
      setRedeemCode('');
      fetchWallet();
    } catch (err: any) {
      setRedeemStatus({
        loading: false,
        error: err.response?.data?.message || 'Failed to redeem code',
        success: null
      });
    }
  };

  // Compute balance progression points chronologically
  const points = (() => {
    const current = Number(balance);
    const pts = [current];
    if (transactions.length === 0) {
      return [current, current];
    }
    let trackingBalance = current;
    for (let i = 0; i < transactions.length; i++) {
      const tx = transactions[i];
      const amount = Number(tx.amount);
      if (tx.type === 'credit') {
        trackingBalance -= amount;
      } else {
        trackingBalance += amount;
      }
      pts.push(trackingBalance);
    }
    return pts.reverse();
  })();

  const pendingAmount = withdrawals
    .filter(w => w.status === 'pending' || w.status === 'approved')
    .reduce((acc, w) => acc + Number(w.amount), 0);
  const availableBalance = Math.max(0, balance - pendingAmount);

  const minVal = Math.min(...points, 0);
  const maxVal = Math.max(...points, 10);
  const svgWidth = 800;
  const svgHeight = 240;
  const paddingX = 60;
  const paddingY = 40;

  const coords = points.map((p, i) => {
    const x = paddingX + (i * (svgWidth - 2 * paddingX)) / (points.length - 1 || 1);
    const y = svgHeight - paddingY - ((p - minVal) / (maxVal - minVal || 1) * (svgHeight - 2 * paddingY));
    return { x, y, value: p, index: i };
  });

  const linePath = coords.length > 1 
    ? `M ${coords[0].x} ${coords[0].y} ` + coords.slice(1).map(c => `L ${c.x} ${c.y}`).join(' ') 
    : '';

  const areaPath = coords.length > 1
    ? `${linePath} L ${coords[coords.length - 1].x} ${svgHeight - paddingY} L ${coords[0].x} ${svgHeight - paddingY} Z`
    : '';

  // Check PIN status on mount
  useEffect(() => {
    if (isOffline) return;
    api.get('/api/wallet/pin/status')
      .then(res => setHasPin(res.data.has_pin))
      .catch(() => setHasPin(false));
  }, [isOffline]);

  // Once unlocked, fetch wallet data and poll every 30s for live balance updates
  useEffect(() => {
    if (!isUnlocked || isOffline) return;
    fetchWallet();
    api.get('/api/wallet/config')
      .then(res => setTestingMode(res.data.wallet_testing_mode))
      .catch(() => setTestingMode(true));

    const interval = setInterval(() => {
      fetchWallet();
    }, 30_000);

    return () => clearInterval(interval);
  }, [isUnlocked, isOffline]);

  const handleVerifyPin = async () => {
    if (!/^\d{4}$/.test(pinInput)) {
      setPinError('Please enter all 4 digits.');
      return;
    }
    setPinLoading(true);
    setPinError('');
    try {
      await api.post('/api/wallet/pin/verify', { pin: pinInput });
      setIsUnlocked(true);
    } catch {
      setPinError('Incorrect PIN. Please try again.');
      setPinInput('');
      pinRef.current?.focus();
    } finally {
      setPinLoading(false);
    }
  };

  const handleSetPin = async () => {
    if (!/^\d{4}$/.test(pinInput)) {
      setPinError('PIN must be exactly 4 digits.');
      return;
    }
    setPinLoading(true);
    setPinError('');
    try {
      await api.post('/api/wallet/pin/set', { pin: pinInput });
      setHasPin(true);
      setIsUnlocked(true);
    } catch (err: any) {
      setPinError(err.response?.data?.message || 'Failed to set PIN.');
    } finally {
      setPinLoading(false);
    }
  };

  const handleForgotRequest = async () => {
    setForgotError('');
    setForgotMsg('');
    setPinLoading(true);
    try {
      const res = await api.post('/api/wallet/pin/forgot');
      setForgotMsg(res.data.message);
      setForgotStep('verify');
    } catch (err: any) {
      setForgotError(err.response?.data?.message || 'Failed to send reset code.');
    } finally {
      setPinLoading(false);
    }
  };

  const handleForgotReset = async () => {
    if (!forgotOtp || !/^\d{4}$/.test(newPin)) {
      setForgotError('Enter the 6-digit OTP and a new 4-digit PIN.');
      return;
    }
    setPinLoading(true);
    setForgotError('');
    try {
      await api.post('/api/wallet/pin/reset', { otp: forgotOtp, new_pin: newPin });
      setForgotMsg('PIN reset! Please enter your new PIN.');
      setShowForgot(false);
      setForgotStep('request');
      setForgotOtp('');
      setNewPin('');
      setPinInput('');
    } catch (err: any) {
      setForgotError(err.response?.data?.message || 'Invalid or expired OTP.');
    } finally {
      setPinLoading(false);
    }
  };

  const openGateway = (amount: number) => setGateway({ open: true, amount });

  // ── Lock Screen ─────────────────────────────────────────────────────────────
  if (isOffline) {
    return <OfflineView pageName="Wallet" description="Your wallet balance, transactions, and security systems require an active internet connection. You can still listen to your downloaded music in your library." />;
  }

  if (!isUnlocked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden p-4">
        {/* Decorative blobs */}
        <div className="absolute top-[-15%] left-[-10%] w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute bottom-[-15%] right-[-10%] w-[500px] h-[500px] bg-violet-500/10 rounded-full blur-[140px] pointer-events-none" />

        <div className="w-full max-w-sm relative z-10">
          {/* Lock icon header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-cyan-500/20 to-violet-500/20 border border-white/10 mb-4 relative">
              <KeyRound size={36} className="text-[#00e5ff]" />
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#00e5ff] animate-ping opacity-70" />
            </div>
            <h1 className="text-3xl font-black text-white tracking-tight">
              {hasPin === null ? 'Loading…' : hasPin ? 'Wallet Locked' : 'Set Wallet PIN'}
            </h1>
            <p className="text-sm text-white/50 mt-2 max-w-xs mx-auto">
              {hasPin === null
                ? ''
                : hasPin
                ? 'Enter your 4-digit PIN to access your wallet'
                : 'Create a 4-digit PIN to secure your wallet'}
            </p>
          </div>

          {hasPin !== null && !showForgot && (
            <div className="glass-card rounded-3xl border border-white/10 p-8 shadow-2xl space-y-6">
              {/* PIN dots display */}
              <div className="flex justify-center space-x-4 mb-2">
                {[0, 1, 2, 3].map(i => (
                  <div
                    key={i}
                    className={`w-5 h-5 rounded-full border-2 transition-all duration-200 ${
                      pinInput.length > i
                        ? 'bg-[#00e5ff] border-[#00e5ff] scale-110'
                        : 'bg-transparent border-white/30'
                    }`}
                  />
                ))}
              </div>

              {/* Hidden real input */}
              <input
                ref={pinRef}
                type="password"
                inputMode="numeric"
                autoFocus
                value={pinInput}
                onChange={e => {
                  const val = e.target.value.replace(/\D/g, '').slice(0, 4);
                  setPinInput(val);
                  setPinError('');
                }}
                onKeyDown={e => {
                  if (e.key === 'Enter') hasPin ? handleVerifyPin() : handleSetPin();
                }}
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white text-center font-mono tracking-[0.5em] text-2xl focus:border-[#00e5ff] focus:outline-none transition-all placeholder:text-white/20"
                placeholder="••••"
                maxLength={4}
              />

              {pinError && (
                <div className="flex items-center space-x-2 text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-sm font-medium">
                  <AlertCircle size={15} className="shrink-0" />
                  <span>{pinError}</span>
                </div>
              )}

              {forgotMsg && (
                <div className="flex items-center space-x-2 text-green-400 bg-green-500/10 border border-green-500/20 rounded-xl px-4 py-3 text-sm font-medium">
                  <CheckCircle size={15} className="shrink-0" />
                  <span>{forgotMsg}</span>
                </div>
              )}

              <button
                onClick={hasPin ? handleVerifyPin : handleSetPin}
                disabled={pinLoading || pinInput.length < 4}
                className="w-full py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all duration-300 bg-gradient-to-r from-cyan-500 to-violet-500 text-white shadow-lg shadow-cyan-500/20 hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {pinLoading ? <Loader2 size={18} className="animate-spin" /> : <span>{hasPin ? 'Unlock Wallet' : 'Set PIN & Enter'}</span>}
              </button>

              {hasPin && (
                <button
                  onClick={() => { setShowForgot(true); setPinError(''); }}
                  className="w-full text-center text-sm text-white/40 hover:text-[#00e5ff] transition-colors font-medium py-1"
                >
                  Forgot PIN? Reset via email
                </button>
              )}
            </div>
          )}

          {/* Forgot PIN Modal */}
          {showForgot && (
            <div className="glass-card rounded-3xl border border-white/10 p-8 shadow-2xl space-y-5">
              <div className="text-center">
                <RefreshCw size={28} className="text-[#00e5ff] mx-auto mb-3" />
                <h2 className="text-xl font-black text-white">Reset Wallet PIN</h2>
                <p className="text-xs text-white/50 mt-1">
                  {forgotStep === 'request'
                    ? 'We\'ll send a reset code to your registered email.'
                    : 'Enter the code from your email and choose a new PIN.'}
                </p>
              </div>

              {forgotError && (
                <div className="flex items-center space-x-2 text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-sm">
                  <AlertCircle size={14} className="shrink-0" /><span>{forgotError}</span>
                </div>
              )}
              {forgotMsg && (
                <div className="flex items-center space-x-2 text-green-400 bg-green-500/10 border border-green-500/20 rounded-xl px-4 py-3 text-sm">
                  <CheckCircle size={14} className="shrink-0" /><span>{forgotMsg}</span>
                </div>
              )}

              {forgotStep === 'request' ? (
                <button
                  onClick={handleForgotRequest}
                  disabled={pinLoading}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-cyan-500 to-violet-500 text-white font-black text-sm uppercase tracking-widest disabled:opacity-40 flex items-center justify-center space-x-2"
                >
                  {pinLoading ? <Loader2 size={16} className="animate-spin" /> : <span>Send Reset Code</span>}
                </button>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-white/50 uppercase tracking-widest">6-Digit OTP from Email</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={forgotOtp}
                      onChange={e => setForgotOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="000000"
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3 text-white font-mono text-center tracking-[0.4em] text-lg focus:border-[#00e5ff] focus:outline-none"
                      maxLength={6}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-white/50 uppercase tracking-widest">New 4-Digit PIN</label>
                    <input
                      type="password"
                      inputMode="numeric"
                      value={newPin}
                      onChange={e => setNewPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                      placeholder="••••"
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3 text-white font-mono text-center tracking-[0.5em] text-xl focus:border-[#00e5ff] focus:outline-none"
                      maxLength={4}
                    />
                  </div>
                  <button
                    onClick={handleForgotReset}
                    disabled={pinLoading}
                    className="w-full py-4 rounded-2xl bg-gradient-to-r from-cyan-500 to-violet-500 text-white font-black text-sm uppercase tracking-widest disabled:opacity-40 flex items-center justify-center"
                  >
                    {pinLoading ? <Loader2 size={16} className="animate-spin" /> : 'Confirm New PIN'}
                  </button>
                </div>
              )}

              <button
                onClick={() => { setShowForgot(false); setForgotStep('request'); setForgotError(''); setForgotMsg(''); }}
                className="w-full text-center text-sm text-white/40 hover:text-white transition-colors py-1"
              >
                ← Back to Login
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  const walletUid = user ? `RURU-${String(user.id).padStart(6, '0')}` : 'RURU-000000';

  return (
    <>
      {gateway.open && (
        <GatewayModal
          amount={gateway.amount}
          onClose={() => setGateway({ open: false, amount: 0 })}
          onSuccess={fetchWallet}
        />
      )}

      {bankModalOpen && (
        <BankDepositModal
          onClose={() => setBankModalOpen(false)}
          onSuccess={fetchWallet}
        />
      )}

      {withdrawModalOpen && (
        <WithdrawalModal
          onClose={() => setWithdrawModalOpen(false)}
          onSuccess={fetchWallet}
          availableBalance={availableBalance}
        />
      )}

      {transferModalOpen && (
        <TransferModal
          onClose={() => setTransferModalOpen(false)}
          onSuccess={fetchWallet}
          availableBalance={availableBalance}
          hasPin={!!user?.wallet_pin || hasPin === true}
        />
      )}

      {toast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[200] px-5 py-3 bg-primary text-primary-foreground rounded-full font-semibold text-sm shadow-xl shadow-primary/30 animate-in fade-in slide-in-from-top-2 duration-200">
          {toast}
        </div>
      )}

      <div className="p-8">
        <div className="flex items-center space-x-4 mb-10">
          <div className="p-3 bg-primary/20 text-primary rounded-2xl">
            <Wallet size={24} />
          </div>
          <h1 className="text-3xl font-bold">My Wallet</h1>
        </div>

        {/* ── Top Row: 3-card layout ────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">

          {/* Card 1 — Total Balance */}
          <div className="glass-card rounded-3xl p-8 bg-gradient-to-br from-primary/20 to-blue-600/10 relative overflow-hidden flex flex-col justify-between">
            <div className="absolute -right-12 -top-12 w-48 h-48 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
            <div className="relative z-10">
              <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground mb-3">Total Balance</p>
              <h2 className="text-5xl font-black text-white leading-none mb-2">${Number(balance).toFixed(2)}</h2>
              <p className="text-xs text-muted-foreground font-medium">AUD</p>
            </div>
            {/* Wallet ID sub-section */}
            <div className="relative z-10 mt-6 pt-4 border-t border-white/10">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground mb-1">Your Wallet ID</p>
                  <p className="text-lg font-black font-mono text-primary tracking-wider">{walletUid}</p>
                </div>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(walletUid);
                    showToast('Wallet ID copied to clipboard!');
                  }}
                  title="Copy Wallet ID"
                  className="w-9 h-9 rounded-xl bg-white/5 hover:bg-primary/20 border border-white/10 hover:border-primary/30 flex items-center justify-center transition-all duration-200 text-muted-foreground hover:text-primary shrink-0"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>
                  </svg>
                </button>
              </div>
              <p className="text-[10px] text-muted-foreground mt-1">Share to receive transfers</p>
            </div>
          </div>

          {/* Card 2 — Payment Methods */}
          <div className="glass-card rounded-3xl p-7 flex flex-col gap-5">
            <div>
              <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground mb-4">Payment Methods</p>
              <div className="space-y-3">
                <button
                  onClick={() => openGateway(50)}
                  disabled={!testingMode}
                  className="w-full py-3.5 glass rounded-2xl flex items-center justify-center space-x-3 hover:border-primary transition disabled:opacity-40 disabled:cursor-not-allowed text-sm font-bold"
                >
                  <CreditCard size={18} />
                  <span>Add Custom Amount</span>
                </button>

                <button
                  onClick={() => setBankModalOpen(true)}
                  className="w-full py-3.5 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 hover:border-primary/40 rounded-2xl flex items-center justify-center space-x-3 transition text-sm font-bold"
                >
                  <Building size={18} />
                  <span>ANZ Kiribati Deposit</span>
                </button>

                {!testingMode && (
                  <div className="flex items-center space-x-3 p-3 bg-orange-500/10 border border-orange-500/20 rounded-2xl">
                    <Shield className="text-orange-500 shrink-0" size={15} />
                    <p className="text-[11px] text-orange-400 font-medium leading-relaxed">
                      Card payments are disabled by the Administrator.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Top-up pills */}
            {testingMode && (
              <div>
                <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground mb-3">Quick Top-up</p>
                <div className="flex flex-wrap gap-2">
                  {[10, 25, 50, 100].map(amt => (
                    <button
                      key={amt}
                      onClick={() => openGateway(amt)}
                      className="px-4 py-2 glass rounded-xl text-sm font-bold hover:bg-primary hover:text-primary-foreground transition flex items-center space-x-1.5"
                    >
                      <Plus size={14} />
                      <span>${amt}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Redeem Code */}
            <div className="pt-4 border-t border-white/10">
              <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground mb-3">Redeem Code</p>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={redeemCode}
                  onChange={e => setRedeemCode(e.target.value.toUpperCase())}
                  placeholder="e.g. PROMO-50"
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary uppercase"
                />
                <button
                  onClick={handleRedeem}
                  disabled={!redeemCode.trim() || redeemStatus.loading}
                  className="px-5 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[90px] text-sm"
                >
                  {redeemStatus.loading ? <Loader2 size={16} className="animate-spin" /> : 'Redeem'}
                </button>
              </div>
              {redeemStatus.error && (
                <p className="text-red-400 text-xs mt-2 flex items-center"><AlertCircle size={12} className="mr-1"/>{redeemStatus.error}</p>
              )}
              {redeemStatus.success && (
                <p className="text-green-400 text-xs mt-2 flex items-center"><CheckCircle size={12} className="mr-1"/>{redeemStatus.success}</p>
              )}
            </div>
          </div>

          {/* Card 3 — Withdraw & Transfer */}
          <div className="glass-card rounded-3xl p-7 flex flex-col gap-5">
            <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Money Movements</p>

            {/* Withdraw */}
            <div className="flex flex-col gap-3">
              <div className="p-4 bg-violet-500/5 border border-violet-500/15 rounded-2xl">
                <div className="flex items-center space-x-2 mb-3">
                  <div className="w-8 h-8 rounded-xl bg-violet-500/20 flex items-center justify-center">
                    <ArrowUpRight size={16} className="text-[#00e5ff]" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">Withdraw Funds</p>
                    <p className="text-[10px] text-muted-foreground">Transfer to your bank account</p>
                  </div>
                </div>
                <button
                  onClick={() => setWithdrawModalOpen(true)}
                  className="w-full py-3 bg-violet-500/15 hover:bg-violet-500/25 text-[#00e5ff] border border-violet-500/20 hover:border-violet-500/40 rounded-xl flex items-center justify-center space-x-2 transition font-bold text-sm"
                >
                  <ArrowUpRight size={16} />
                  <span>Withdraw Now</span>
                </button>
              </div>

              {/* Transfer */}
              <div className="p-4 bg-emerald-500/5 border border-emerald-500/15 rounded-2xl">
                <div className="flex items-center space-x-2 mb-3">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                    <Send size={16} className="text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">Transfer Credits</p>
                    <p className="text-[10px] text-muted-foreground">Send credits to another user via Wallet ID</p>
                  </div>
                </div>
                <button
                  onClick={() => setTransferModalOpen(true)}
                  className="w-full py-3 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/20 hover:border-emerald-500/40 rounded-xl flex items-center justify-center space-x-2 transition font-bold text-sm"
                >
                  <Send size={16} />
                  <span>Send Transfer</span>
                </button>
              </div>
            </div>

            {/* Saved Methods hint */}
            <div className="mt-auto p-4 bg-white/5 rounded-2xl">
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-2">Saved Methods</p>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-6 bg-blue-600 rounded" />
                <p className="font-mono text-sm">**** 4242</p>
              </div>
            </div>
          </div>

        </div>


        {/* Balance Progression Trend Chart */}
        <div className="glass-card rounded-3xl p-8 mb-12 relative overflow-hidden">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-2">
              <TrendingUp size={20} className="text-primary" />
              <h2 className="text-xl font-bold">Balance Progression Trend</h2>
            </div>
            <span className="text-xs text-muted-foreground bg-white/5 px-3 py-1 rounded-full">
              {points.length - 1} recent updates
            </span>
          </div>

          <div className="relative w-full overflow-hidden" style={{ minHeight: '240px' }}>
            {points.length <= 1 ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground italic text-sm">
                <p>No transaction history recorded yet.</p>
                <p className="text-xs text-muted-foreground/60 mt-1">Complete a top-up or ticket purchase to initialize tracking.</p>
              </div>
            ) : (
              <>
                {/* SVG Graph */}
                <svg
                  viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                  className="w-full h-auto overflow-visible select-none"
                  style={{ maxHeight: '260px' }}
                >
                  <defs>
                    <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--primary-color, #3b82f6)" stopOpacity={0.25} />
                      <stop offset="100%" stopColor="var(--primary-color, #3b82f6)" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>

                  {/* Horizontal Gridlines */}
                  <line
                    x1={paddingX}
                    y1={paddingY}
                    x2={svgWidth - paddingX}
                    y2={paddingY}
                    stroke="rgba(255, 255, 255, 0.05)"
                    strokeWidth={1}
                    strokeDasharray="4 4"
                  />
                  <line
                    x1={paddingX}
                    y1={svgHeight / 2}
                    x2={svgWidth - paddingX}
                    y2={svgHeight / 2}
                    stroke="rgba(255, 255, 255, 0.05)"
                    strokeWidth={1}
                    strokeDasharray="4 4"
                  />
                  <line
                    x1={paddingX}
                    y1={svgHeight - paddingY}
                    x2={svgWidth - paddingX}
                    y2={svgHeight - paddingY}
                    stroke="rgba(255, 255, 255, 0.1)"
                    strokeWidth={1.5}
                  />

                  {/* Left Axis Label Indicators */}
                  <text
                    x={paddingX - 10}
                    y={paddingY + 4}
                    textAnchor="end"
                    className="text-[10px] font-mono fill-muted-foreground font-bold"
                  >
                    ${maxVal.toFixed(0)}
                  </text>
                  <text
                    x={paddingX - 10}
                    y={svgHeight / 2 + 4}
                    textAnchor="end"
                    className="text-[10px] font-mono fill-muted-foreground font-bold"
                  >
                    ${((maxVal + minVal) / 2).toFixed(0)}
                  </text>
                  <text
                    x={paddingX - 10}
                    y={svgHeight - paddingY + 4}
                    textAnchor="end"
                    className="text-[10px] font-mono fill-muted-foreground font-bold"
                  >
                    ${minVal.toFixed(0)}
                  </text>

                  {/* Filled Area */}
                  {areaPath && (
                    <path
                      d={areaPath}
                      fill="url(#chartGradient)"
                      className="transition-all duration-500 ease-in-out"
                    />
                  )}

                  {/* Stroke Line */}
                  {linePath && (
                    <path
                      d={linePath}
                      fill="none"
                      stroke="var(--primary-color, #3b82f6)"
                      strokeWidth={3}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="transition-all duration-500 ease-in-out"
                    />
                  )}

                  {/* Dynamic Nodes / Hover Anchors */}
                  {coords.map((c) => (
                    <g key={c.index} className="group">
                      {/* Invisible hover zone */}
                      <circle
                        cx={c.x}
                        cy={c.y}
                        r={16}
                        fill="transparent"
                        className="cursor-pointer"
                        onMouseEnter={() => setHoveredPoint(c)}
                        onMouseLeave={() => setHoveredPoint(null)}
                      />

                      {/* Visible active dot */}
                      <circle
                        cx={c.x}
                        cy={c.y}
                        r={hoveredPoint?.index === c.index ? 6 : 4}
                        fill={hoveredPoint?.index === c.index ? '#ffffff' : 'var(--primary-color, #3b82f6)'}
                        stroke="rgba(0, 0, 0, 0.4)"
                        strokeWidth={2}
                        className="transition-all duration-200 pointer-events-none"
                      />
                    </g>
                  ))}
                </svg>

                {/* Animated Interactive Tooltip */}
                {hoveredPoint && (
                  <div
                    className="absolute bg-neutral-900/95 border border-white/10 rounded-2xl p-4 text-xs font-bold pointer-events-none shadow-2xl backdrop-blur-lg animate-in fade-in zoom-in-95 duration-150 z-20"
                    style={{
                      left: `${(hoveredPoint.x / svgWidth) * 100}%`,
                      top: `${(hoveredPoint.y / svgHeight) * 100 - 30}%`,
                      transform: 'translate(-50%, -100%)',
                    }}
                  >
                    <div className="space-y-1">
                      <p className="text-[9px] uppercase tracking-widest text-muted-foreground">Cumulative Balance</p>
                      <p className="text-primary text-base font-black">${hoveredPoint.value.toFixed(2)} AUD</p>
                      <p className="text-[9px] text-muted-foreground font-mono">
                        {hoveredPoint.index === coords.length - 1 ? 'Current State' : `Step ${hoveredPoint.index + 1}`}
                      </p>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Transaction History */}
        <div className="glass-card rounded-3xl overflow-hidden">
          <div className="p-6 border-b border-white/10 flex items-center space-x-2">
            <History size={20} className="text-primary" />
            <h2 className="text-xl font-bold">Transaction History</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-white/5 text-xs font-bold uppercase text-muted-foreground">
                <tr>
                  <th className="px-6 py-4">Type</th>
                  <th className="px-6 py-4">Description</th>
                  <th className="px-6 py-4">Party</th>
                  <th className="px-6 py-4">Amount</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {transactions.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-10 text-center text-muted-foreground italic">No transactions yet.</td>
                  </tr>
                )}
                {transactions.map(tx => (
                  <tr key={tx.id} className="hover:bg-white/5 transition">
                    <td className="px-6 py-4">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${tx.type === 'credit' ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}`}>
                        {tx.type === 'credit' ? <ArrowUpRight size={16} /> : <ArrowDownLeft size={16} />}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-medium">{tx.description}</td>
                    <td className="px-6 py-4">
                      {tx.related_user ? (
                        <div className="flex items-center space-x-2">
                          <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-bold text-primary">
                            {tx.related_user.name.charAt(0)}
                          </div>
                          <span>{tx.related_user.name}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground italic">Platform</span>
                      )}
                    </td>
                    <td className={`px-6 py-4 font-bold ${tx.type === 'credit' ? 'text-green-500' : 'text-red-500'}`}>
                      {tx.type === 'credit' ? '+' : '-'}${Math.abs(tx.amount).toFixed(2)}
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-white/10 rounded text-[10px] font-bold uppercase">{tx.status}</span>
                    </td>
                    <td className="px-6 py-4 text-right text-muted-foreground text-sm">
                      {new Date(tx.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pending Transfers (Incoming & Outgoing) */}
        {(incomingTransfers.length > 0 || outgoingTransfers.length > 0) && (
          <div className="glass-card rounded-3xl overflow-hidden mt-8 border border-white/5">
            <div className="p-6 border-b border-white/10 flex items-center justify-between bg-gradient-to-r from-emerald-950/20 to-transparent">
              <div className="flex items-center space-x-2">
                <Shield size={20} className="text-emerald-400" />
                <h2 className="text-xl font-bold">Pending Transfers</h2>
              </div>
              <span className="text-xs text-muted-foreground bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full text-emerald-400 font-bold">
                Action Required
              </span>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Incoming Transfers */}
              {incomingTransfers.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Incoming Transfers (Awaiting Your Acceptance)</h3>
                  <div className="grid grid-cols-1 gap-4">
                    {incomingTransfers.map((t) => (
                      <div key={t.id} className="flex flex-col md:flex-row md:items-center justify-between bg-white/5 hover:bg-white/10 transition border border-white/10 rounded-2xl p-5 gap-4">
                        <div className="flex items-start space-x-3">
                          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                            <ArrowDownLeft size={20} />
                          </div>
                          <div>
                            <p className="font-bold text-white">From: {t.sender?.name}</p>
                            <p className="text-xs text-muted-foreground">{t.sender?.email}</p>
                            {t.description && <p className="text-xs text-emerald-300/80 mt-1 italic">"{t.description}"</p>}
                          </div>
                        </div>
                        <div className="flex items-center justify-between md:justify-end space-x-4">
                          <span className="text-xl font-black text-emerald-400 font-mono">+${Number(t.amount).toFixed(2)} AUD</span>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleAcceptTransfer(t.id)}
                              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition shadow-lg shadow-emerald-500/10"
                            >
                              Accept
                            </button>
                            <button
                              onClick={() => handleRejectTransfer(t.id)}
                              className="px-4 py-2 bg-white/5 hover:bg-red-500/20 hover:text-red-400 text-white font-bold text-xs rounded-xl border border-white/10 hover:border-red-500/30 transition"
                            >
                              Reject
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Outgoing Transfers */}
              {outgoingTransfers.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Outgoing Transfers (Awaiting Recipient Acceptance)</h3>
                  <div className="grid grid-cols-1 gap-4">
                    {outgoingTransfers.map((t) => (
                      <div key={t.id} className="flex flex-col md:flex-row md:items-center justify-between bg-white/5 hover:bg-white/10 transition border border-white/10 rounded-2xl p-5 gap-4">
                        <div className="flex items-start space-x-3">
                          <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white shrink-0">
                            <ArrowUpRight size={20} />
                          </div>
                          <div>
                            <p className="font-bold text-white">To: {t.receiver?.name}</p>
                            <p className="text-xs text-muted-foreground">{t.receiver?.email}</p>
                            {t.description && <p className="text-xs text-muted-foreground mt-1 italic">"{t.description}"</p>}
                          </div>
                        </div>
                        <div className="flex items-center justify-between md:justify-end space-x-4">
                          <span className="text-xl font-black text-white/70 font-mono">${Number(t.amount).toFixed(2)} AUD</span>
                          <button
                            onClick={() => handleCancelTransfer(t.id)}
                            className="px-4 py-2 bg-white/5 hover:bg-red-500/20 hover:text-red-400 text-white font-bold text-xs rounded-xl border border-white/10 hover:border-red-500/30 transition"
                          >
                            Cancel Transfer
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Bank Deposits History */}
        <div className="glass-card rounded-3xl overflow-hidden mt-8">
          <div className="p-6 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Building size={20} className="text-primary" />
              <h2 className="text-xl font-bold">ANZ Bank Transfer Submissions</h2>
            </div>
            <span className="text-xs text-muted-foreground bg-white/5 px-3 py-1 rounded-full">
              {bankDeposits.length} total submissions
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-white/5 text-xs font-bold uppercase text-muted-foreground">
                <tr>
                  <th className="px-6 py-4">Submission Date</th>
                  <th className="px-6 py-4">Amount</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Receipt File</th>
                  <th className="px-6 py-4">Admin Note / Rejection Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {bankDeposits.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-10 text-center text-muted-foreground italic">No bank deposit receipts uploaded yet.</td>
                  </tr>
                )}
                {bankDeposits.map((dep) => (
                  <tr key={dep.id} className="hover:bg-white/5 transition text-sm">
                    <td className="px-6 py-4 text-muted-foreground">
                      {new Date(dep.created_at).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 font-bold text-white">
                      ${Number(dep.amount).toFixed(2)} AUD
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        dep.status === 'approved' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                        dep.status === 'rejected' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                        'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 animate-pulse'
                      }`}>
                        {dep.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <a
                        href={dep.receipt_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline font-bold flex items-center space-x-1"
                      >
                        <FileText size={14} />
                        <span>View Receipt</span>
                      </a>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {dep.admin_note || <span className="italic text-white/20">—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Withdrawals History */}
        <div className="glass-card rounded-3xl overflow-hidden mt-8">
          <div className="p-6 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <ArrowUpRight size={20} className="text-[#00e5ff]" />
              <h2 className="text-xl font-bold">Withdrawal Requests</h2>
            </div>
            <span className="text-xs text-muted-foreground bg-white/5 px-3 py-1 rounded-full">
              {withdrawals.length} total requests
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-white/5 text-xs font-bold uppercase text-muted-foreground">
                <tr>
                  <th className="px-6 py-4">Request Date</th>
                  <th className="px-6 py-4">Amount</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Payout Method / Bank details</th>
                  <th className="px-6 py-4">Receipt / Notes</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {withdrawals.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-10 text-center text-muted-foreground italic">No withdrawal requests submitted yet.</td>
                  </tr>
                )}
                {withdrawals.map((w) => (
                  <tr key={w.id} className="hover:bg-white/5 transition text-sm">
                    <td className="px-6 py-4 text-muted-foreground">
                      {new Date(w.created_at).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 font-bold text-white">
                      ${Number(w.amount).toFixed(2)} AUD
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        w.status === 'confirmed' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                        w.status === 'approved' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30 font-bold animate-pulse' :
                        w.status === 'rejected' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                        'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                      }`}>
                        {w.status === 'approved' ? 'Awaiting Confirmation' : w.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-white">{w.account_name}</div>
                      <div className="text-xs text-muted-foreground">
                        {w.bank_name} • {w.account_number} ({w.method.toUpperCase()})
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {w.receipt_url ? (
                        <a
                          href={w.receipt_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline font-bold flex items-center space-x-1 mb-1"
                        >
                          <FileText size={14} />
                          <span>View Payout Receipt</span>
                        </a>
                      ) : (
                        <span className="italic text-white/20">No receipt yet</span>
                      )}
                      {w.admin_notes && (
                        <div className="text-xs text-red-400 font-medium max-w-xs truncate" title={w.admin_notes}>
                          Note: {w.admin_notes}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {w.status === 'approved' && (
                        <button
                          onClick={() => handleConfirmWithdrawal(w.id)}
                          className="ml-auto px-4 py-2 bg-green-500 hover:bg-green-600 text-white font-bold text-xs rounded-xl transition flex items-center justify-center space-x-1.5 shadow-md shadow-green-500/20"
                        >
                          <CheckCircle size={13} />
                          <span>Confirm Deduction</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Creator Earnings Dashboard */}
        {earnings && (
          <div className="glass-card rounded-3xl overflow-hidden mt-8">
            <div className="p-6 border-b border-white/10 flex items-center space-x-2">
              <TrendingUp size={20} className="text-primary" />
              <h2 className="text-xl font-bold">Creator Earnings</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6">
              <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Available to Withdraw</p>
                <p className="text-3xl font-black text-green-400 mt-2">${Number(earnings.available).toFixed(2)} AUD</p>
              </div>
              <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Pending (Escrow)</p>
                <p className="text-3xl font-black text-yellow-400 mt-2">${Number(earnings.pending).toFixed(2)} AUD</p>
              </div>
              <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Total Withdrawn</p>
                <p className="text-3xl font-black text-blue-400 mt-2">${Number(earnings.withdrawn).toFixed(2)} AUD</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-t border-white/10">
                <thead className="bg-white/5 text-xs font-bold uppercase text-muted-foreground">
                  <tr>
                    <th className="px-6 py-4">Purchase ID</th>
                    <th className="px-6 py-4">Recipient</th>
                    <th className="px-6 py-4">Amount</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Release Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {earnings.history?.data?.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-10 text-center text-muted-foreground italic">No earnings yet.</td>
                    </tr>
                  )}
                  {earnings.history?.data?.map((earning: any) => (
                    <tr key={earning.id} className="hover:bg-white/5 transition">
                      <td className="px-6 py-4 font-mono font-bold text-primary">#{earning.purchase_id}</td>
                      <td className="px-6 py-4 uppercase font-bold text-xs">{earning.recipient_type}</td>
                      <td className="px-6 py-4 font-bold text-green-400">+${Number(earning.amount).toFixed(2)}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                          earning.status === 'available' ? 'bg-green-500/20 text-green-500' :
                          earning.status === 'pending' ? 'bg-yellow-500/20 text-yellow-500' :
                          'bg-white/10 text-white'
                        }`}>{earning.status}</span>
                      </td>
                      <td className="px-6 py-4 text-right text-muted-foreground text-sm">
                        {earning.release_at ? new Date(earning.release_at).toLocaleString() : 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
