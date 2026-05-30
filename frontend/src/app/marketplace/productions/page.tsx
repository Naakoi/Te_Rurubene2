'use client';

import { useEffect, useState } from 'react';
import { Music, ShoppingBag, ArrowLeft, Star, Clock, User, ShoppingCart } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/axios';
import { useCartStore } from '@/store/cartStore';
import { useAuthStore } from '@/store/authStore';

export default function ProductionsPage() {
  const [productions, setProductions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { addItem } = useCartStore();
  const { user } = useAuthStore();

  useEffect(() => {
    api.get('/api/products/category/Production')
      .then(res => setProductions(res.data))
      .catch(err => console.error('Failed to fetch productions', err))
      .finally(() => setLoading(false));
  }, []);

  const handleBuy = (product: any) => {
      addItem({
          id: product.id,
          type: 'product',
          name: product.name,
          price: Number(product.price),
          image_url: product.image_url,
          quantity: 1,
          creator_id: product.artist_id || product.studio_id,
          creator_name: product.artist?.user?.name || product.studio?.user?.name
      });
  };

  return (
    <div className="p-8">
      <div className="mb-10 flex items-center justify-between">
        <div className="flex items-center space-x-4">
            <Link href="/marketplace" className="p-2 glass rounded-full hover:text-primary transition">
                <ArrowLeft size={20} />
            </Link>
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Productions</h1>
                <p className="text-muted-foreground text-sm">Professional mixing, mastering, and exclusive beats.</p>
            </div>
        </div>
        <div className="flex items-center space-x-2 px-4 py-1 bg-amber-500/10 text-amber-500 rounded-full border border-amber-500/20 text-xs font-bold uppercase tracking-widest">
            <Star size={12} fill="currentColor" />
            <span>Top Rated</span>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-pulse">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-48 bg-white/5 rounded-3xl border border-white/10"></div>
          ))}
        </div>
      ) : productions.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {productions.map((prod) => (
            <div key={prod.id} className="glass-card p-6 rounded-3xl border border-white/5 hover:border-amber-500/30 transition-all duration-300 flex space-x-6 group">
                <div className="w-32 h-32 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex-shrink-0 overflow-hidden relative shadow-lg">
                    {prod.image_url ? (
                        <img src={prod.image_url} alt={prod.name} className="w-full h-full object-cover" />
                    ) : (
                        <Music size={48} className="absolute inset-0 m-auto text-white/40" />
                    )}
                </div>
                 <div className="flex-1 flex flex-col justify-between">
                     <div>
                         <div className="flex justify-between items-start">
                             <div>
                                 <h3 className="text-xl font-bold mb-1 group-hover:text-amber-500 transition">{prod.name}</h3>
                                 <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                                     <User size={12} />
                                     <Link 
                                         href={prod.artist_id ? `/marketplace/stores/artist/${prod.artist_id}` : `/marketplace/stores/studio/${prod.studio_id}`}
                                         className="hover:text-amber-500 transition font-medium"
                                     >
                                         {prod.artist?.user?.name || prod.studio?.user?.name || 'Top Producer'}
                                     </Link>
                                 </div>
                             </div>
                         </div>
                         <p className="text-sm text-muted-foreground mt-3 line-clamp-2">{prod.description || 'Professional production services tailored for Pacific artists.'}</p>
                     </div>
                     
                     <div className="mt-6 border-t border-white/5 pt-6">
                         <button 
                             onClick={() => handleBuy(prod)}
                             className="w-full py-3 bg-amber-500 text-white rounded-xl font-black text-xs hover:bg-amber-600 transition shadow-lg shadow-amber-500/20 flex items-center justify-between px-6 group/btn"
                         >
                             <ShoppingCart size={16} className="group-hover/btn:scale-110 transition" />
                             <span className="tracking-widest uppercase">Hire for ${Number(prod.price).toFixed(2)}</span>
                         </button>
                     </div>
                 </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-20 text-center glass rounded-3xl border-dashed border-2 border-white/10">
          <Music size={48} className="mx-auto mb-4 text-muted-foreground opacity-20" />
          <h3 className="text-xl font-bold mb-2">No productions listed yet</h3>
          <p className="text-muted-foreground">Professional services from our top engineers are coming soon.</p>
        </div>
      )}

      {(user?.role === 'artist' || user?.role === 'studio' || user?.role === 'admin') && (
        <div className="mt-16 glass-card p-10 rounded-[3rem] border border-white/5 relative overflow-hidden">
            <div className="relative z-10 max-w-2xl">
                <h2 className="text-3xl font-black mb-4">Are you a Producer?</h2>
                <p className="text-muted-foreground text-lg mb-8">List your beats, mixing services, and studio sessions to the global Pacific community.</p>
                <Link href="/studio/store" className="inline-block bg-white text-black px-8 py-3 rounded-full font-black hover:bg-amber-500 hover:text-white transition duration-300">
                    OPEN YOUR PRODUCTION SHOP
                </Link>
            </div>
            <Music size={200} className="absolute -bottom-10 -right-10 opacity-5 text-white" />
        </div>
      )}
    </div>
  );
}
