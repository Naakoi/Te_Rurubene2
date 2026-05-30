'use client';

import { useEffect, useState } from 'react';
import { Plus, Trash2, Edit2, ShoppingBag, Save, X, Tag, DollarSign, Package } from 'lucide-react';
import api from '@/lib/axios';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';

export default function StoreManagementPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const searchParams = useSearchParams();
  const editId = searchParams.get('edit');
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    stock_quantity: '0',
    image_url: '',
    category: 'Merch'
  });

  useEffect(() => {
    if (user === null) {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        router.push('/login');
        return;
      }
    } else if (user.role !== 'artist' && user.role !== 'studio' && user.role !== 'admin') {
      router.push('/');
      return;
    }

    fetchProducts();
  }, [user, router]);

  useEffect(() => {
    if (editId && products.length > 0) {
      const productToEdit = products.find(p => p.id === Number(editId));
      if (productToEdit) {
        handleEdit(productToEdit);
      }
    }
  }, [editId, products]);

  const fetchProducts = () => {
    setLoading(true);
    api.get('/api/my-products')
      .then(res => setProducts(res.data))
      .catch(err => console.error('Failed to fetch products', err))
      .finally(() => setLoading(false));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      stock_quantity: '0',
      image_url: '',
      category: 'Merch'
    });
    setEditingProduct(null);
    setIsAdding(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...formData,
      price: parseFloat(formData.price),
      stock_quantity: parseInt(formData.stock_quantity)
    };

    if (editingProduct) {
      api.put(`/api/products/${editingProduct.id}`, payload)
        .then(() => {
          fetchProducts();
          resetForm();
        })
        .catch(err => alert('Failed to update product'));
    } else {
      api.post('/api/products', payload)
        .then(() => {
          fetchProducts();
          resetForm();
        })
        .catch(err => alert('Failed to create product'));
    }
  };

  const handleEdit = (product: any) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description || '',
      price: product.price.toString(),
      stock_quantity: product.stock_quantity.toString(),
      image_url: product.image_url || '',
      category: product.category || 'Merch'
    });
    setIsAdding(true);
  };

  const handleDelete = (id: number) => {
    if (confirm('Are you sure you want to delete this product?')) {
      api.delete(`/api/products/${id}`)
        .then(() => fetchProducts())
        .catch(err => alert('Failed to delete product'));
    }
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-10">
        <div>
            <h1 className="text-3xl font-bold tracking-tight">Store Management</h1>
            <p className="text-muted-foreground">Manage your merchandise and products.</p>
        </div>
        {!isAdding && (
            <button 
                onClick={() => setIsAdding(true)}
                className="flex items-center space-x-2 bg-primary text-primary-foreground px-6 py-3 rounded-full font-bold hover:bg-primary/90 transition shadow-lg shadow-primary/20"
            >
                <Plus size={20} />
                <span>Add Product</span>
            </button>
        )}
      </div>

      {isAdding && (
        <div className="glass-card p-8 rounded-3xl border border-primary/20 mb-10 animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold">{editingProduct ? 'Edit Product' : 'Add New Product'}</h2>
            <button onClick={resetForm} className="p-2 hover:bg-white/5 rounded-full transition">
              <X size={20} />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-muted-foreground uppercase tracking-widest flex items-center space-x-2">
                    <Tag size={14} />
                    <span>Product Name</span>
                </label>
                <input 
                  type="text" 
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="e.g. Official T-Shirt"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-primary outline-none transition"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-muted-foreground uppercase tracking-widest flex items-center space-x-2">
                    <DollarSign size={14} />
                    <span>Price (AUD)</span>
                </label>
                <input 
                  type="number" 
                  step="0.01"
                  name="price"
                  value={formData.price}
                  onChange={handleInputChange}
                  placeholder="29.99"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-primary outline-none transition"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-muted-foreground uppercase tracking-widest flex items-center space-x-2">
                    <Package size={14} />
                    <span>Stock Quantity</span>
                </label>
                <input 
                  type="number" 
                  name="stock_quantity"
                  value={formData.stock_quantity}
                  onChange={handleInputChange}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-primary outline-none transition"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-muted-foreground uppercase tracking-widest flex items-center space-x-2">
                    <Tag size={14} />
                    <span>Category</span>
                </label>
                <select 
                  name="category"
                  value={formData.category}
                  onChange={(e: any) => handleInputChange(e)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-primary outline-none transition appearance-none"
                >
                  <option value="Merch">Merchandise</option>
                  <option value="Production">Production (Beats/Mixing)</option>
                  <option value="Tickets">Event Tickets</option>
                  <option value="Service">Other Services</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-muted-foreground uppercase tracking-widest flex items-center space-x-2">
                    <ShoppingBag size={14} />
                    <span>Image URL</span>
                </label>
                <input 
                  type="text" 
                  name="image_url"
                  value={formData.image_url}
                  onChange={handleInputChange}
                  placeholder="https://..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-primary outline-none transition"
                />
              </div>
            </div>
            <div className="space-y-2">
                <label className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Description</label>
                <textarea 
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-primary outline-none transition resize-none"
                />
            </div>
            <div className="flex justify-end space-x-4">
              <button 
                type="button" 
                onClick={resetForm}
                className="px-6 py-2 rounded-xl border border-white/10 hover:bg-white/5 transition"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="flex items-center space-x-2 bg-primary text-primary-foreground px-8 py-2 rounded-xl font-bold hover:bg-primary/90 transition shadow-lg shadow-primary/20"
              >
                <Save size={20} />
                <span>{editingProduct ? 'Update Product' : 'Save Product'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="space-y-4">
            {[1, 2, 3].map(i => <div key={i} className="h-24 bg-white/5 rounded-2xl animate-pulse"></div>)}
        </div>
      ) : products.length > 0 ? (
        <div className="grid grid-cols-1 gap-4">
          {products.map((product) => (
            <div key={product.id} className="glass flex items-center p-4 rounded-2xl border border-white/5 hover:border-white/10 transition group">
              <div className="w-16 h-16 rounded-xl bg-secondary mr-6 overflow-hidden flex-shrink-0">
                  {product.image_url ? (
                      <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                  ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                          <ShoppingBag size={24} />
                      </div>
                  )}
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-lg">{product.name}</h3>
                <p className="text-sm text-muted-foreground line-clamp-1">{product.description || 'No description provided.'}</p>
              </div>
              <div className="px-6 text-right">
                <p className="text-xl font-black text-primary">${Number(product.price).toFixed(2)}</p>
                <p className="text-xs text-muted-foreground">{product.stock_quantity} in stock</p>
              </div>
              <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition duration-300">
                <button 
                    onClick={() => handleEdit(product)}
                    className="p-2 glass rounded-lg text-primary hover:bg-primary hover:text-primary-foreground transition"
                >
                    <Edit2 size={18} />
                </button>
                <button 
                    onClick={() => handleDelete(product.id)}
                    className="p-2 glass rounded-lg text-red-500 hover:bg-red-500 hover:text-white transition"
                >
                    <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-20 text-center glass rounded-3xl border-dashed border-2 border-white/10">
          <ShoppingBag size={48} className="mx-auto mb-4 text-muted-foreground opacity-20" />
          <h3 className="text-xl font-bold mb-2">Your store is empty</h3>
          <p className="text-muted-foreground mb-6">Start adding products to reach your fans!</p>
          {!isAdding && (
              <button 
                onClick={() => setIsAdding(true)}
                className="bg-primary/10 text-primary px-6 py-2 rounded-xl font-bold border border-primary/20 hover:bg-primary hover:text-primary-foreground transition"
              >
                Create My First Product
              </button>
          )}
        </div>
      )}
    </div>
  );
}
