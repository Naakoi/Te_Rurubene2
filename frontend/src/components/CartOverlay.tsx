'use client';

import { useState } from 'react';
import { useCartStore } from '@/store/cartStore';
import { X, Trash2, ShoppingBag, Plus, Minus, CreditCard, ArrowRight } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';
import api from '@/lib/axios';

export default function CartOverlay() {
    const [isProcessing, setIsProcessing] = useState(false);
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

            alert('Purchase successful! Items added to your collection.');
            clearCart();
            toggleCart();
            router.push('/library'); // Redirect to library to see new tracks
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
            </div>
        </div>
    );
}
