'use client';

import { useState, useEffect } from 'react';
import { ShoppingBag, Star, ShoppingCart, Loader2, AlertCircle, PackageOpen } from 'lucide-react';
import api from '@/lib/axios';
import { useCartStore } from '@/store/cartStore';

interface Product {
  id: number;
  name: string;
  description: string | null;
  price: number;
  stock_quantity: number;
  image_url: string | null;
  category: string;
  artist?: {
    name: string;
    user?: { name: string };
  };
}

export default function MerchStorePage() {
  const { addItem } = useCartStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [added, setAdded] = useState<number | null>(null);

  useEffect(() => {
    api.get('/api/products/category/Merchandise')
      .then(res => setProducts(res.data))
      .catch(() => setError('Failed to load merchandise.'))
      .finally(() => setLoading(false));
  }, []);

  const handleAddToCart = (product: Product) => {
    addItem({
      id: product.id,
      type: 'product',
      name: product.name,
      price: product.price,
      image_url: product.image_url ?? undefined,
      quantity: 1,
      creator_name: product.artist?.name,
    });
    setAdded(product.id);
    setTimeout(() => setAdded(null), 1800);
  };

  if (loading) {
    return (
      <div className="p-8 flex flex-col items-center justify-center h-64 space-y-4">
        <Loader2 size={32} className="text-primary animate-spin" />
        <p className="text-muted-foreground">Loading merchandise…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 flex flex-col items-center justify-center h-64 space-y-3">
        <AlertCircle size={32} className="text-red-500" />
        <p className="text-red-400">{error}</p>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex items-center space-x-4 mb-10">
        <div className="p-3 bg-purple-500/20 text-purple-500 rounded-2xl">
          <ShoppingBag size={24} />
        </div>
        <div>
          <h1 className="text-3xl font-bold">Artist Merchandise</h1>
          <p className="text-muted-foreground text-sm mt-0.5">{products.length} item{products.length !== 1 ? 's' : ''} available</p>
        </div>
      </div>

      {products.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 space-y-3">
          <PackageOpen size={48} className="text-muted-foreground/40" />
          <p className="text-muted-foreground text-lg font-semibold">No merchandise available yet.</p>
          <p className="text-muted-foreground/60 text-sm">Check back soon for artist drops.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {products.map(product => (
            <div key={product.id} className="glass-card rounded-3xl overflow-hidden group hover:border-primary/50 transition duration-500">
              {/* Image */}
              <div className="aspect-[4/5] bg-secondary relative overflow-hidden">
                {product.image_url ? (
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition duration-700"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-900/40 to-primary/20">
                    <ShoppingBag size={48} className="text-muted-foreground/30" />
                  </div>
                )}

                {/* Hover overlay with Add to Cart */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition duration-500 flex items-end p-6">
                  <button
                    onClick={() => handleAddToCart(product)}
                    className={`w-full py-3 rounded-xl font-bold translate-y-4 group-hover:translate-y-0 transition duration-500 shadow-lg flex items-center justify-center space-x-2 ${
                      added === product.id
                        ? 'bg-green-500 text-white shadow-green-500/30'
                        : 'bg-primary text-primary-foreground shadow-primary/30'
                    }`}
                  >
                    <ShoppingCart size={16} />
                    <span>{added === product.id ? 'Added!' : 'Add to Cart'}</span>
                  </button>
                </div>

                {/* Stock badge */}
                {product.stock_quantity <= 10 && product.stock_quantity > 0 && (
                  <div className="absolute top-4 left-4 px-3 py-1 bg-orange-500/90 text-white rounded-full text-xs font-bold">
                    Only {product.stock_quantity} left
                  </div>
                )}
                {product.stock_quantity === 0 && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                    <span className="bg-red-500/90 text-white px-4 py-2 rounded-full font-bold text-sm">Sold Out</span>
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="p-6">
                <p className="text-[10px] font-bold text-primary uppercase tracking-widest mb-1">
                  {product.artist?.name ?? 'Artist'}
                </p>
                <h3 className="text-lg font-bold truncate mb-1">{product.name}</h3>
                {product.description && (
                  <p className="text-xs text-muted-foreground line-clamp-2 mb-3 leading-relaxed">
                    {product.description}
                  </p>
                )}
                <div className="flex items-center justify-between">
                  <p className="text-xl font-black">${Number(product.price).toFixed(2)}</p>
                  <button
                    onClick={() => handleAddToCart(product)}
                    disabled={product.stock_quantity === 0}
                    className="p-2.5 glass rounded-xl hover:bg-primary hover:text-primary-foreground transition disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <ShoppingCart size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
