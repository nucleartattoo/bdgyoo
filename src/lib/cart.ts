import { useSyncExternalStore } from 'react'

export interface CartItemOption {
  label: string
  value: string
}

export interface CartItem {
  id: string // Compound key: `${productId}-${variantIdentifier}`
  productId: string
  name: string
  slug: string
  sku: string
  image: string
  price: number
  quantity: number
  options: CartItemOption[]
}

export interface CartState {
  items: CartItem[]
  discountCode: string | null
  discountPercent: number
}

const STORAGE_KEY = 'bdgy_cart_state_v1'

const defaultState: CartState = {
  items: [],
  discountCode: null,
  discountPercent: 0,
}

let currentState: CartState = defaultState
const listeners = new Set<() => void>()

function emitChange() {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(currentState))
    } catch {
      // ignore quota / storage errors
    }
  }
  for (const listener of listeners) {
    listener()
  }
}

// Initial load on client
if (typeof window !== 'undefined') {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed.items)) {
        currentState = parsed
      }
    }
  } catch {
    currentState = defaultState
  }
}

export const cartStore = {
  getSnapshot(): CartState {
    return currentState
  },

  getServerSnapshot(): CartState {
    return defaultState
  },

  subscribe(listener: () => void): () => void {
    listeners.add(listener)
    return () => listeners.delete(listener)
  },

  addItem(
    item: Omit<CartItem, 'id' | 'quantity' | 'options' | 'productId' | 'slug'> & {
      id?: string
      productId?: string
      slug?: string
      options?: CartItemOption[]
      quantity?: number
    },
    quantity = 1,
  ): void {
    const opts = item.options || []
    const optionKey = opts
      .map((o) => `${o.label}:${o.value}`)
      .sort()
      .join('|')
    const itemId = item.id || `${item.productId || item.sku}__${optionKey || 'default'}`

    const existingIndex = currentState.items.findIndex((i) => i.id === itemId)

    let newItems: CartItem[]
    if (existingIndex > -1) {
      newItems = [...currentState.items]
      newItems[existingIndex] = {
        ...newItems[existingIndex],
        quantity: newItems[existingIndex].quantity + quantity,
      }
    } else {
      newItems = [
        ...currentState.items,
        {
          productId: item.productId || item.sku,
          name: item.name,
          slug: item.slug || '',
          sku: item.sku,
          image: item.image,
          price: item.price,
          options: opts,
          id: itemId,
          quantity,
        },
      ]
    }

    currentState = {
      ...currentState,
      items: newItems,
    }
    emitChange()
  },

  removeItem(itemId: string): void {
    currentState = {
      ...currentState,
      items: currentState.items.filter((i) => i.id !== itemId),
    }
    emitChange()
  },

  updateQuantity(itemId: string, quantity: number): void {
    if (quantity <= 0) {
      cartStore.removeItem(itemId)
      return
    }

    currentState = {
      ...currentState,
      items: currentState.items.map((i) => (i.id === itemId ? { ...i, quantity } : i)),
    }
    emitChange()
  },

  applyDiscount(code: string): { success: boolean; message: string } {
    const normalized = code.trim().toUpperCase()
    if (normalized === 'BDGY10' || normalized === 'PRO10') {
      currentState = {
        ...currentState,
        discountCode: normalized,
        discountPercent: 10,
      }
      emitChange()
      return { success: true, message: '10% Studio Pro discount applied!' }
    }
    if (normalized === 'SALEOR20' || normalized === 'VIP20') {
      currentState = {
        ...currentState,
        discountCode: normalized,
        discountPercent: 20,
      }
      emitChange()
      return { success: true, message: '20% Saleor VIP discount applied!' }
    }
    return { success: false, message: 'Invalid or expired promo code.' }
  },

  removeDiscount(): void {
    currentState = {
      ...currentState,
      discountCode: null,
      discountPercent: 0,
    }
    emitChange()
  },

  clearCart(): void {
    currentState = {
      items: [],
      discountCode: null,
      discountPercent: 0,
    }
    emitChange()
  },
}

/**
 * React hook to access and mutate cart state
 */
export function useCart() {
  const state = useSyncExternalStore(
    cartStore.subscribe,
    cartStore.getSnapshot,
    cartStore.getServerSnapshot,
  )

  const totalItems = state.items.reduce((sum, item) => sum + item.quantity, 0)
  const subtotal = state.items.reduce((sum, item) => sum + item.price * item.quantity, 0)

  // Free shipping threshold: $99
  const freeShippingThreshold = 99
  const shippingCost = subtotal >= freeShippingThreshold || subtotal === 0 ? 0 : 9.99

  const discountAmount = (subtotal * state.discountPercent) / 100
  const estimatedTax = 0 // Calculated on checkout or 0 for wholesale
  const total = Math.max(0, subtotal - discountAmount + shippingCost + estimatedTax)

  return {
    items: state.items,
    totalItems,
    subtotal,
    shippingCost,
    freeShippingThreshold,
    discountCode: state.discountCode,
    discountPercent: state.discountPercent,
    discountAmount,
    total,
    addItem: cartStore.addItem,
    removeItem: cartStore.removeItem,
    updateQuantity: cartStore.updateQuantity,
    applyDiscount: cartStore.applyDiscount,
    removeDiscount: cartStore.removeDiscount,
    clearCart: cartStore.clearCart,
  }
}
