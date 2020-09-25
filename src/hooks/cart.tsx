import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Omit<Product, 'quantity'>): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      const response = await AsyncStorage.getItem('@GoMarketPlace:products');

      response && setProducts([...JSON.parse(response)]);
    }

    loadProducts();
  }, []);

  const setStorage = useCallback(
    async product => {
      await AsyncStorage.setItem(
        '@GoMarketPlace:products',
        JSON.stringify(product),
      );
    },
    [products],
  );

  const increment = useCallback(
    async id => {
      const newProducts = products.map(product =>
        product.id === id
          ? { ...product, quantity: product.quantity + 1 }
          : product,
      );
      setProducts(newProducts);
      await setStorage(newProducts);
    },
    [products, setStorage],
  );
  const decrement = useCallback(
    async id => {
      const newProducts = products.map(product =>
        product.id === id
          ? { ...product, quantity: product.quantity - 1 }
          : product,
      );
      setProducts(newProducts);
      await setStorage(newProducts);
    },
    [products, setStorage],
  );

  const addToCart = useCallback(
    async product => {
      const productExists = products.find(item => item.id === product.id);
      if (productExists) {
        increment(product.id);
      } else {
        setProducts([...products, { ...product, quantity: 1 }]);
      }
      await setStorage(products);
    },
    [products, increment, setStorage],
  );

  const value = React.useMemo(
    () => ({ addToCart, increment, decrement, products }),
    [products, addToCart, increment, decrement],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };
