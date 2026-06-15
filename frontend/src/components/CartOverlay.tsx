'use client';

import { useState } from 'react';
import { useCartStore } from '@/store/cartStore';
import { X, Trash2, ShoppingBag, Plus, Minus, CreditCard, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';
import api from '@/lib/axios';

export default function CartOverlay() {
    const [isProcessing, setIsProcessing] = useState(false);
    const [successDetails, setSuccessDetails] = useState<{ total: number; platformFee: number; signature?: string } | null>(null);
    const { items, isOpen, toggleCart, removeItem, updateQuantity, total, clearCart } = useCartStore();
    const { user } = useAuthStore();
    const router = useRouter();

    if (!isOpen) return null;

    const handleCheckout = async () => {
        if (!user) {
            router.push('/login');
            toggleCart();
            return;
        }

        if (items.length === 0) return;

        setIsProcessing(true);
        try {
            const res = await api.post('/api/checkout', {
                items: items,
                total: total(),
                shipping_address: 'Pacific Digital Delivery'
            });

            // Set details of the completed transaction
            const totalPaid = total();
            const platformFeeVal = res.data.platform_fee ?? (totalPaid * 0.10);
            
            setSuccessDetails({
                total: totalPaid,
                platformFee: platformFeeVal,
                signature: res.data.purchase?.transaction_signature || res.data.purchase?.id?.toString()
            });

            clearCart();
        } catch (err: any) {
            console.error('Checkout failed:', err);
            const msg = err.response?.data?.message || 'Checkout failed. Please check your wallet balance.';
            alert(msg);
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex justify-end">
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300"
                onClick={toggleCart}
            />
            
            {/* Cart Drawer */}
            <div className="relative w-full max-w-md bg-background/95 backdrop-blur-2xl h-full shadow-2xl border-l border-white/10 flex flex-col animate-in slide-in-from-right duration-300">
                {/* Header */}
                <div className="p-6 border-b border-white/5 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <ShoppingBag className="text-primary" size={24} />
                        <h2 className="text-xl font-black italic tracking-tighter">Your Bag</h2>
                    </div>
                    <button 
                        onClick={toggleCart}
                        className="p-2 hover:bg-white/5 rounded-full transition"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Success View / Receipt */}
                {successDetails ? (
                    <div className="flex-1 flex flex-col p-6 items-center justify-center space-y-6 text-center animate-in fade-in zoom-in-95 duration-300">
                        <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 animate-pulse border border-emerald-500/30">
                            <CheckCircle2 size={36} />
                        </div>
                        <div>
                            <h3 className="text-2xl font-black italic tracking-tighter">ORDER COMPLETED</h3>
                            <p className="text-xs text-muted-foreground mt-1 uppercase tracking-widest font-semibold">Thank you for your purchase</p>
                        </div>

                        {/* Receipt Card */}
                        <div className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 text-left space-y-4">
                            <div className="flex justify-between items-center pb-3 border-b border-white/5">
                                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Payment Receipt</span>
                                {successDetails.signature && (
                                    <span className="text-[9px] font-mono text-muted-foreground/60 max-w-[150px] truncate">
                                        SIG: {successDetails.signature}
                                    </span>
                                )}
                            </div>

                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Total Paid:</span>
                                    <span className="font-bold text-white">${successDetails.total.toFixed(2)} AUD</span>
                                </div>
                                <div className="flex justify-between text-xs">
                                    <span className="text-muted-foreground">Payment Method:</span>
                                    <span className="text-white font-semibold">Te Rurubene Wallet Balance</span>
                                </div>
                                <div className="flex justify-between text-xs">
                                    <span className="text-muted-foreground">Status:</span>
                                    <span className="text-emerald-400 font-bold">Paid & Completed</span>
                                </div>
                            </div>
                        </div>

                        <div className="w-full space-y-3 pt-4">
                            <button
                                onClick={() => {
                                    setSuccessDetails(null);
                                    toggleCart();
                                    router.push('/library');
                                }}
                                className="w-full bg-primary text-primary-foreground py-3.5 rounded-xl font-black transition active:scale-95 hover:scale-[1.02] text-sm uppercase tracking-wider"
                            >
                                VIEW IN MY LIBRARY
                            </button>
                            <button
                                onClick={() => {
                                    setSuccessDetails(null);
                                    toggleCart();
                                }}
                                className="w-full bg-white/5 hover:bg-white/10 border border-white/10 text-white py-3.5 rounded-xl font-bold transition text-sm uppercase tracking-wider"
                            >
                                CONTINUE BROWSING
                            </button>
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Items List */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            {items.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-50">
                                    <ShoppingBag size={64} className="stroke-1" />
                                    <p className="text-lg">Your cart is empty</p>
                                    <button 
                                        onClick={toggleCart}
                                        className="text-primary font-bold hover:underline"
                                    >
                                        Continue Shopping
                                    </button>
                                </div>
                            ) : (
                                items.map((item) => (
                                    <div key={`${item.type}-${item.id}`} className="flex space-x-4 group">
                                        <div className="w-20 h-20 rounded-xl bg-secondary overflow-hidden shrink-0 border border-white/5">
                                            {item.image_url ? (
                                                <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full bg-primary/20 flex items-center justify-center text-primary">
                                                    <ShoppingBag size={24} />
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-start">
                                                <h4 className="font-bold text-sm truncate group-hover:text-primary transition">{item.name}</h4>
                                                <button 
                                                    onClick={() => removeItem(item.id)}
                                                    className="text-muted-foreground hover:text-red-500 transition ml-2"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                            <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-1">
                                                {item.creator_name || 'Creator'} • {item.type}
                                            </p>
                                            <div className="flex items-center justify-between mt-3">
                                                <div className="flex items-center space-x-3 bg-white/5 rounded-lg px-2 py-1 border border-white/10">
                                                    <button 
                                                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                                        className="hover:text-primary transition"
                                                    >
                                                        <Minus size={14} />
                                                    </button>
                                                    <span className="text-xs font-bold w-4 text-center">{item.quantity}</span>
                                                    <button 
                                                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                                        className="hover:text-primary transition"
                                                    >
                                                        <Plus size={14} />
                                                    </button>
                                                </div>
                                                <span className="font-black text-white">${(item.price * item.quantity).toFixed(2)}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Footer */}
                        {items.length > 0 && (
                            <div className="p-6 bg-white/5 border-t border-white/10 space-y-4">
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Subtotal</span>
                                        <span>${total().toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Service Fee</span>
                                        <span>$0.00</span>
                                    </div>
                                    <div className="flex justify-between text-xl font-black pt-2 border-t border-white/5">
                                        <span className="italic tracking-tighter uppercase">Total</span>
                                        <span className="text-primary">${total().toFixed(2)}</span>
                                    </div>
                                </div>
                                <button 
                                    onClick={handleCheckout}
                                    disabled={isProcessing}
                                    className={`w-full bg-primary text-primary-foreground py-4 rounded-2xl font-black flex items-center justify-center space-x-3 transition shadow-xl shadow-primary/20 active:scale-95 ${isProcessing ? 'opacity-50 cursor-not-allowed' : 'hover:scale-[1.02]'}`}
                                >
                                    <CreditCard size={20} />
                                    <span>{isProcessing ? 'PROCESSING...' : 'FINALIZE PURCHASE'}</span>
                                    {!isProcessing && <ArrowRight size={20} />}
                                </button>
                                <p className="text-[10px] text-center text-muted-foreground uppercase tracking-widest">
                                    Secure payment processed via Te Rurubene Wallet
                                </p>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
