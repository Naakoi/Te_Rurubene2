'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/axios';
import {
  Wallet, Plus, CreditCard, History, ArrowUpRight, ArrowDownLeft,
  X, Lock, CheckCircle, Loader2, Shield, AlertCircle, TrendingUp,
} from 'lucide-react';

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


// ── Main Wallet Page ──────────────────────────────────────────────────────────
export default function WalletPage() {
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [gateway, setGateway] = useState<{ open: boolean; amount: number }>({ open: false, amount: 0 });
  const [testingMode, setTestingMode] = useState<boolean>(true);
  const [hoveredPoint, setHoveredPoint] = useState<{ x: number; y: number; value: number; index: number } | null>(null);

  // Redeem Code State
  const [redeemCode, setRedeemCode] = useState('');
  const [redeemStatus, setRedeemStatus] = useState<{ loading: boolean; error: string | null; success: string | null }>({
    loading: false, error: null, success: null
  });

  // Creator Earnings State
  const [earnings, setEarnings] = useState<any>(null);

  const fetchWallet = () => {
    api.get('/api/wallet').then(res => {
      setBalance(res.data.balance);
      setTransactions(res.data.transactions?.data || []);
    });
    api.get('/api/wallet/earnings').then(res => {
      setEarnings(res.data);
    }).catch(() => {
      // Ignore if not a creator
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

  useEffect(() => { 
    fetchWallet(); 
    api.get('/api/wallet/config')
      .then(res => setTestingMode(res.data.wallet_testing_mode))
      .catch(() => setTestingMode(true));
  }, []);

  const openGateway = (amount: number) => setGateway({ open: true, amount });

  return (
    <>
      {gateway.open && (
        <GatewayModal
          amount={gateway.amount}
          onClose={() => setGateway({ open: false, amount: 0 })}
          onSuccess={fetchWallet}
        />
      )}

      <div className="p-8">
        <div className="flex items-center space-x-4 mb-10">
          <div className="p-3 bg-primary/20 text-primary rounded-2xl">
            <Wallet size={24} />
          </div>
          <h1 className="text-3xl font-bold">My Wallet</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          {/* Balance Card */}
          <div className="lg:col-span-2 glass-card rounded-3xl p-10 bg-gradient-to-br from-primary/20 to-blue-600/10 relative overflow-hidden">
            <div className="absolute -right-20 -top-20 w-64 h-64 bg-primary/10 rounded-full blur-3xl" />
            <div className="relative z-10">
              <p className="text-muted-foreground font-bold uppercase tracking-widest text-xs mb-2">Total Balance</p>
              <h2 className="text-6xl font-black mb-10">${Number(balance).toFixed(2)}</h2>

              <p className="text-xs text-muted-foreground mb-4 uppercase tracking-widest font-bold">Quick Top-up</p>
              {testingMode ? (
                <div className="flex flex-wrap gap-4">
                  {[10, 25, 50, 100].map(amount => (
                    <button
                      key={amount}
                      onClick={() => openGateway(amount)}
                      className="px-6 py-3 glass rounded-xl font-bold hover:bg-primary hover:text-primary-foreground transition flex items-center space-x-2"
                    >
                      <Plus size={18} />
                      <span>${amount}</span>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="flex items-center space-x-3 p-4 bg-orange-500/10 border border-orange-500/20 rounded-2xl max-w-lg">
                  <Shield className="text-orange-500 shrink-0" size={18} />
                  <p className="text-xs text-orange-400 font-medium leading-relaxed">
                    Simulated payments are currently disabled by the Administrator for security reasons.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="glass-card rounded-3xl p-8 flex flex-col justify-between">
            <h3 className="text-xl font-bold mb-6">Payment Methods</h3>
            <div className="space-y-4">
              <button
                onClick={() => openGateway(50)}
                disabled={!testingMode}
                className="w-full py-4 glass rounded-2xl flex items-center justify-center space-x-3 hover:border-primary transition disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <CreditCard size={20} />
                <span className="font-bold">Add Custom Amount</span>
              </button>
              <div className="p-4 bg-white/5 rounded-2xl">
                <p className="text-xs text-muted-foreground mb-2">Saved Methods</p>
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-6 bg-blue-600 rounded" />
                  <p className="font-mono text-sm">**** 4242</p>
                </div>
              </div>

              {/* Redeem Code Section */}
              <div className="pt-4 border-t border-white/10 mt-4">
                <h4 className="text-sm font-bold mb-3">Redeem Code</h4>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={redeemCode}
                    onChange={e => setRedeemCode(e.target.value.toUpperCase())}
                    placeholder="e.g. PROMO-50"
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary uppercase"
                  />
                  <button
                    onClick={handleRedeem}
                    disabled={!redeemCode.trim() || redeemStatus.loading}
                    className="px-6 py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[100px]"
                  >
                    {redeemStatus.loading ? <Loader2 size={18} className="animate-spin" /> : 'Redeem'}
                  </button>
                </div>
                {redeemStatus.error && (
                  <p className="text-red-400 text-xs mt-2 flex items-center"><AlertCircle size={12} className="mr-1"/> {redeemStatus.error}</p>
                )}
                {redeemStatus.success && (
                  <p className="text-green-400 text-xs mt-2 flex items-center"><CheckCircle size={12} className="mr-1"/> {redeemStatus.success}</p>
                )}
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
