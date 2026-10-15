import { Link, createFileRoute } from '@tanstack/react-router'
import {
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  Package,
  RotateCcw,
  Shield,
  ShoppingBag,
  Sparkles,
  Tag,
  Trash2,
  Truck,
  X,
} from 'lucide-react'
import { useState } from 'react'
import { useCart } from '~/lib/cart'
import { formatPrice } from '~/lib/utils'

export const Route = createFileRoute('/cart')({
  component: CartPage,
})

function CartPage() {
  const {
    items,
    totalItems,
    subtotal,
    shippingCost,
    freeShippingThreshold,
    discountCode,
    discountPercent,
    discountAmount,
    total,
    removeItem,
    updateQuantity,
    applyDiscount,
    removeDiscount,
    clearCart,
  } = useCart()

  const [promoInput, setPromoInput] = useState('')
  const [promoFeedback, setPromoFeedback] = useState<{
    type: 'success' | 'error'
    message: string
  } | null>(null)

  const handleApplyPromo = (e: React.FormEvent) => {
    e.preventDefault()
    if (!promoInput.trim()) return

    const res = applyDiscount(promoInput)
    if (res.success) {
      setPromoFeedback({ type: 'success', message: res.message })
      setPromoInput('')
    } else {
      setPromoFeedback({ type: 'error', message: res.message })
    }
  }

  // Calculate free shipping progress
  const freeShippingDifference = Math.max(0, freeShippingThreshold - subtotal)
  const shippingProgress = Math.min(100, Math.round((subtotal / freeShippingThreshold) * 100))

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-12 text-center max-w-2xl mx-auto space-y-6">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-zinc-800/80 border border-zinc-700/50">
            <ShoppingBag className="h-10 w-10 text-zinc-500" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-white">Your Cart is Currently Empty</h1>
            <p className="text-sm text-zinc-400">
              You have not added any professional tattoo machines, needle cartridges, or supplies
              yet.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link
              to="/categories/$slug"
              params={{ slug: 'tattoo-machines' }}
              className="w-full sm:w-auto rounded-lg bg-amber-500 px-6 py-2.5 text-xs font-bold text-black transition hover:bg-amber-400"
            >
              Browse Tattoo Machines
            </Link>
            <Link
              to="/categories/$slug"
              params={{ slug: 'tattoo-needles' }}
              className="w-full sm:w-auto rounded-lg border border-zinc-700 bg-zinc-800 px-6 py-2.5 text-xs font-semibold text-white transition hover:bg-zinc-700"
            >
              Explore Needles & Cartridges
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {/* Breadcrumbs */}
      <nav aria-label="Breadcrumb" className="text-xs text-zinc-500 flex items-center gap-1.5">
        <Link to="/" className="hover:text-zinc-300">
          Home
        </Link>
        <ChevronRight className="h-3 w-3 text-zinc-600" />
        <span className="text-amber-400 font-medium">Shopping Cart</span>
      </nav>

      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-zinc-800 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            Shopping Cart
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            Review your studio order before proceeding to secure Saleor checkout.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="rounded-full bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-400 border border-amber-500/20">
            {totalItems} {totalItems === 1 ? 'item' : 'items'}
          </span>
          <button
            type="button"
            onClick={clearCart}
            className="text-xs text-zinc-500 hover:text-red-400 transition"
          >
            Clear Cart
          </button>
        </div>
      </div>

      {/* Free Shipping Progress Meter */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
        <div className="flex items-center justify-between text-xs mb-2">
          <div className="flex items-center gap-2">
            <Truck className="h-4 w-4 text-amber-500" />
            {freeShippingDifference > 0 ? (
              <span className="text-zinc-300">
                Add{' '}
                <strong className="text-amber-400">{formatPrice(freeShippingDifference)}</strong>{' '}
                more to get <strong className="text-white">FREE Express Shipping</strong>!
              </span>
            ) : (
              <span className="text-emerald-400 font-semibold flex items-center gap-1">
                <CheckCircle2 className="h-4 w-4" /> You unlocked FREE Express Shipping!
              </span>
            )}
          </div>
          <span className="text-zinc-500 font-mono">{shippingProgress}%</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-800">
          <div
            className={`h-full transition-all duration-300 ${
              shippingProgress >= 100 ? 'bg-emerald-500' : 'bg-amber-500'
            }`}
            style={{ width: `${shippingProgress}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-3">
        {/* Cart Item Cards List */}
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 sm:p-5 transition hover:border-zinc-700"
            >
              <div className="flex items-center gap-4">
                <Link
                  to="/products/$slug"
                  params={{ slug: item.slug }}
                  className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg bg-zinc-950 p-2 border border-zinc-800 flex items-center justify-center hover:opacity-80 transition"
                >
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.name}
                      className="h-full w-full object-contain"
                    />
                  ) : (
                    <Package className="h-8 w-8 text-zinc-600" />
                  )}
                </Link>

                <div className="space-y-1">
                  <Link
                    to="/products/$slug"
                    params={{ slug: item.slug }}
                    className="text-sm font-semibold text-white hover:text-amber-400 transition line-clamp-1"
                  >
                    {item.name}
                  </Link>
                  <p className="text-[11px] font-mono text-zinc-500">SKU: {item.sku}</p>

                  {item.options.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {item.options.map((opt) => (
                        <span
                          key={`${opt.label}-${opt.value}`}
                          className="rounded bg-zinc-800 px-2 py-0.5 text-[10px] text-zinc-300"
                        >
                          <span className="text-zinc-500">{opt.label}:</span> {opt.value}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="text-xs text-amber-400 sm:hidden pt-1">
                    {formatPrice(item.price)} each
                  </div>
                </div>
              </div>

              {/* Quantity Controls & Line Total */}
              <div className="flex items-center justify-between sm:justify-end gap-6 pt-3 sm:pt-0 border-t sm:border-t-0 border-zinc-800">
                <div className="hidden sm:block text-right">
                  <div className="text-xs text-zinc-400">{formatPrice(item.price)}</div>
                  <div className="text-sm font-bold text-white">
                    {formatPrice(item.price * item.quantity)}
                  </div>
                </div>

                {/* Quantity Stepper */}
                <div className="flex items-center rounded-lg border border-zinc-800 bg-zinc-900 p-0.5">
                  <button
                    type="button"
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    className="h-7 w-7 flex items-center justify-center rounded text-zinc-400 hover:bg-zinc-800 hover:text-white transition"
                    aria-label="Decrease quantity"
                  >
                    -
                  </button>
                  <span className="w-8 text-center text-xs font-semibold text-white">
                    {item.quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    className="h-7 w-7 flex items-center justify-center rounded text-zinc-400 hover:bg-zinc-800 hover:text-white transition"
                    aria-label="Increase quantity"
                  >
                    +
                  </button>
                </div>

                <div className="sm:hidden text-sm font-bold text-white">
                  {formatPrice(item.price * item.quantity)}
                </div>

                <button
                  type="button"
                  onClick={() => removeItem(item.id)}
                  className="text-zinc-500 hover:text-red-400 transition p-1"
                  aria-label="Remove item"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}

          {/* Promo code application box */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-wider text-zinc-300 flex items-center gap-1.5">
                <Tag className="h-3.5 w-3.5 text-amber-500" />
                Promo or Studio Discount Code
              </label>
              <span className="text-[11px] text-zinc-500">
                Try <code className="text-amber-400">BDGY10</code> or{' '}
                <code className="text-amber-400">SALEOR20</code>
              </span>
            </div>

            {discountCode ? (
              <div className="flex items-center justify-between rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-3 py-2 text-xs text-emerald-400">
                <span className="flex items-center gap-2 font-medium">
                  <Sparkles className="h-4 w-4" /> Code <strong>{discountCode}</strong> applied (
                  {discountPercent}% off)!
                </span>
                <button
                  type="button"
                  onClick={removeDiscount}
                  className="rounded p-1 text-emerald-400 hover:text-white transition"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <form onSubmit={handleApplyPromo} className="flex gap-2">
                <input
                  type="text"
                  value={promoInput}
                  onChange={(e) => setPromoInput(e.target.value)}
                  placeholder="Enter code..."
                  className="flex-1 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-white placeholder-zinc-500 focus:border-amber-500 focus:outline-none uppercase"
                />
                <button
                  type="submit"
                  className="rounded-lg bg-zinc-800 px-4 py-2 text-xs font-bold text-white hover:bg-zinc-700 transition"
                >
                  Apply
                </button>
              </form>
            )}

            {promoFeedback && (
              <p
                className={`text-[11px] ${
                  promoFeedback.type === 'success' ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {promoFeedback.message}
              </p>
            )}
          </div>
        </div>

        {/* Order Summary Sidebar */}
        <div className="space-y-4">
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-6 space-y-5">
            <h2 className="text-lg font-bold text-white">Order Summary</h2>

            <div className="space-y-3 text-xs text-zinc-400 border-b border-zinc-800 pb-4">
              <div className="flex justify-between">
                <span>Items Subtotal ({totalItems})</span>
                <span className="text-white font-medium">{formatPrice(subtotal)}</span>
              </div>

              {discountAmount > 0 && (
                <div className="flex justify-between text-emerald-400">
                  <span>Discount ({discountCode})</span>
                  <span>-{formatPrice(discountAmount)}</span>
                </div>
              )}

              <div className="flex justify-between">
                <span>Standard Express Shipping</span>
                <span
                  className={shippingCost === 0 ? 'text-emerald-400 font-semibold' : 'text-white'}
                >
                  {shippingCost === 0 ? 'FREE' : formatPrice(shippingCost)}
                </span>
              </div>

              <div className="flex justify-between">
                <span>Estimated Sales Tax</span>
                <span className="text-zinc-500 font-medium">Exempt (B2B Studio)</span>
              </div>
            </div>

            <div className="flex justify-between text-base font-bold text-white">
              <span>Estimated Total</span>
              <span className="text-xl text-amber-400">{formatPrice(total)}</span>
            </div>

            <Link
              to="/checkout"
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#E50914] py-3.5 text-sm font-bold text-white transition hover:bg-red-600 shadow-lg shadow-red-900/30 active:scale-[0.99]"
            >
              <span>Proceed to Checkout</span>
              <ArrowRight className="h-4 w-4" />
            </Link>

            <div className="text-center">
              <Link to="/" className="text-xs text-zinc-400 hover:text-white transition">
                ← Or Continue Shopping
              </Link>
            </div>
          </div>

          {/* Trust Guarantees */}
          <div className="rounded-xl border border-zinc-800/80 bg-zinc-950 p-4 space-y-2 text-xs text-zinc-400">
            <div className="flex items-center gap-2 text-zinc-300 font-medium">
              <Shield className="h-4 w-4 text-amber-500" />
              <span>Studio Purchase Protection</span>
            </div>
            <p className="text-[11px] text-zinc-500 leading-relaxed">
              All orders are processed through Saleor GraphQL checkout with 256-bit encryption. 100%
              genuine BDGY studio equipment with full manufacturer warranty.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
