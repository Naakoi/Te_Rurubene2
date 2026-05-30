import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
    id: number | string;
    type: 'product' | 'track' | 'ticket';
    name: string;
    price: number;
    image_url?: string;
    quantity: number;
    creator_id?: number;
    creator_name?: string;
}

interface CartState {
    items: CartItem[];
    isOpen: boolean;
    addItem: (item: CartItem) => void;
    removeItem: (id: number | string) => void;
    updateQuantity: (id: number | string, quantity: number) => void;
    clearCart: () => void;
    toggleCart: () => void;
    total: () => number;
}

export const useCartStore = create<CartState>()(
    persist(
        (set, get) => ({
            items: [],
            isOpen: false,
            addItem: (item) => {
                const currentItems = get().items;
                const existingItem = currentItems.find((i) => i.id === item.id && i.type === item.type);

                if (existingItem) {
                    set({
                        items: currentItems.map((i) =>
                            i.id === item.id && i.type === item.type
                                ? { ...i, quantity: i.quantity + (item.quantity || 1) }
                                : i
                        ),
                    });
                } else {
                    set({ items: [...currentItems, { ...item, quantity: item.quantity || 1 }] });
                }
                set({ isOpen: true }); // Open cart when item added
            },
            removeItem: (id) => {
                set({ items: get().items.filter((i) => i.id !== id) });
            },
            updateQuantity: (id, quantity) => {
                if (quantity <= 0) {
                    get().removeItem(id);
                    return;
                }
                set({
                    items: get().items.map((i) =>
                        i.id === id ? { ...i, quantity } : i
                    ),
                });
            },
            clearCart: () => set({ items: [] }),
            toggleCart: () => set({ isOpen: !get().isOpen }),
            total: () => {
                return get().items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
            },
        }),
        {
            name: 'rurubene-cart',
        }
    )
);
