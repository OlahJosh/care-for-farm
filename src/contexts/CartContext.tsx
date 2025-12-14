import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export interface CartItem {
  id: string;
  name: string;
  price: number;
  image: string;
  seller: string;
  quantity: number;
  stock?: number; // Available stock
}

interface CartContextType {
  items: CartItem[];
  addToCart: (item: Omit<CartItem, "quantity">, quantity?: number) => boolean;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => boolean;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  getItemQuantity: (id: string) => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = "farmcare-cart";

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const stored = localStorage.getItem(CART_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Persist cart to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
      console.warn("Could not save cart to localStorage", e);
    }
  }, [items]);

  const addToCart = (item: Omit<CartItem, "quantity">, quantity: number = 1): boolean => {
    const existing = items.find((i) => i.id === item.id);
    const currentQty = existing?.quantity || 0;
    const newQty = currentQty + quantity;
    
    // Check stock limit
    if (item.stock && newQty > item.stock) {
      return false;
    }
    
    setItems((prev) => {
      if (existing) {
        return prev.map((i) =>
          i.id === item.id ? { ...i, quantity: newQty } : i
        );
      }
      return [...prev, { ...item, quantity }];
    });
    return true;
  };

  const removeFromCart = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const updateQuantity = (id: string, quantity: number): boolean => {
    if (quantity < 1) {
      removeFromCart(id);
      return true;
    }
    
    const item = items.find(i => i.id === id);
    if (item?.stock && quantity > item.stock) {
      return false;
    }
    
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, quantity } : i))
    );
    return true;
  };

  const clearCart = () => {
    setItems([]);
  };

  const getItemQuantity = (id: string): number => {
    const item = items.find(i => i.id === id);
    return item?.quantity || 0;
  };

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        totalItems,
        totalPrice,
        isCartOpen,
        setIsCartOpen,
        getItemQuantity,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};
