import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { cartApi } from '../api/cart';
import { ApiError } from '../api/client';
import { useAuth } from './AuthContext';
import type { CartResponse } from '../types';

interface CartContextValue {
  cart: CartResponse;
  loading: boolean;
  refreshCart: () => Promise<void>;
  addToCart: (pizzaSizeId: number, quantity?: number) => Promise<void>;
  changeQuantity: (itemId: number, quantity: number) => Promise<void>;
  removeItem: (itemId: number) => Promise<void>;
  clearCart: () => Promise<void>;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

const emptyCart: CartResponse = { items: [], totalPrice: 0 };

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { token } = useAuth();
  const [cart, setCart] = useState<CartResponse>(emptyCart);
  const [loading, setLoading] = useState(false);

  const refreshCart = async () => {
    if (!token) {
      setCart(emptyCart);
      return;
    }

    setLoading(true);
    try {
      const data = await cartApi.get(token);
      setCart(data);
    } catch {
      setCart(emptyCart);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshCart();
  }, [token]);

  const addToCart = async (pizzaSizeId: number, quantity = 1) => {
    if (!token) {
      throw new ApiError('Сначала войди в аккаунт', 401);
    }
    await cartApi.add(token, { pizzaSizeId, quantity });
    await refreshCart();
  };

  const changeQuantity = async (itemId: number, quantity: number) => {
    if (!token) return;
    await cartApi.update(token, itemId, quantity);
    await refreshCart();
  };

  const removeItem = async (itemId: number) => {
    if (!token) return;
    await cartApi.remove(token, itemId);
    await refreshCart();
  };

  const clearCart = async () => {
    if (!token) return;
    await cartApi.clear(token);
    await refreshCart();
  };

  const value = useMemo(
    () => ({ cart, loading, refreshCart, addToCart, changeQuantity, removeItem, clearCart }),
    [cart, loading],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used inside CartProvider');
  }
  return context;
}
