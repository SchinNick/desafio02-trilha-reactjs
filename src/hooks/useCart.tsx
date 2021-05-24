import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
   children: ReactNode;
}

interface UpdateProductAmount {
   productId: number;
   amount: number;
}

interface CartContextData {
   cart: Product[];
   addProduct: (productId: number) => Promise<void>;
   removeProduct: (productId: number) => void;
   updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
   const [cart, setCart] = useState<Product[]>(() => {
      const storagedCart = localStorage.getItem('@RocketShoes:cart');

      if (storagedCart) {
         return JSON.parse(storagedCart);
      }

      return [];
   });

   const addProduct = async (productId: number) => {
      try {
         const cartCopy = [...cart]
         const productOnCart = cartCopy.find(product => product.id === productId)

         const stock = await api.get(`/stock/${productId}`)
         const stockAmount = stock.data.amount

         const productAmount = productOnCart ? productOnCart.amount : 0

         if (productAmount + 1 > stockAmount) {
            toast.error('Quantidade solicitada fora de estoque')
            return
         }

         if (productOnCart) {
            productOnCart.amount = productAmount + 1
         } else {
            const product = await api.get(`/products/${productId}`)

            const newProduct = {
               ...product.data,
               amount: 1
            }

            cartCopy.push(newProduct)
         }

         setCart(cartCopy)
         localStorage.setItem('@RocketShoes:cart', JSON.stringify(cartCopy));
      } catch {
         toast.error('Erro na adição do produto')
      }
   };

   const removeProduct = (productId: number) => {
      try {
         const productIndex = cart.findIndex(product => product.id === productId);

         if (productIndex === -1) {
            toast.error('Erro na remoção do produto')
            return
         }

         const cartCopy = [...cart]
         cartCopy.splice(productIndex, 1)

         setCart(cartCopy)

         localStorage.setItem('@RocketShoes:cart', JSON.stringify(cartCopy))
      } catch {
         toast.error('Erro na remoção do produto')
      }
   };

   const updateProductAmount = async ({
      productId,
      amount,
   }: UpdateProductAmount) => {
      try {
         if (amount <= 0) {
            return
         }

         const stock = await api.get(`/stock/${productId}`)
         const stockAmount = stock.data.amount
         const cartCopy = [...cart]

         if (amount > stockAmount) {
            toast.error('Quantidade solicitada fora de estoque');
            return
         }
         const productUpdate = cartCopy.find(product => product.id === productId)

         if (productUpdate) {
            productUpdate.amount = amount
         }

         setCart(cartCopy)

         localStorage.setItem('@RocketShoes:cart', JSON.stringify(cartCopy))

      } catch {
         toast.error('Erro na alteração de quantidade do produto')
      }
   };

   return (
      <CartContext.Provider
         value={{ cart, addProduct, removeProduct, updateProductAmount }}
      >
         {children}
      </CartContext.Provider>
   );
}

export function useCart(): CartContextData {
   const context = useContext(CartContext);

   return context;
}
