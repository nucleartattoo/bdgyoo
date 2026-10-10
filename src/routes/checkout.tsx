import { Link, createFileRoute } from '@tanstack/react-router'
import {
  ArrowLeft,
  Building2,
  CheckCircle2,
  ChevronRight,
  Clock,
  CreditCard,
  Lock,
  Mail,
  MapPin,
  Package,
  ShieldCheck,
  Sparkles,
  Truck,
} from 'lucide-react'
import { useState } from 'react'
import { useCart } from '~/lib/cart'
import { createSaleorCheckout } from '~/lib/saleor/api'
import { formatPrice } from '~/lib/utils'

export const Route = createFileRoute('/checkout')({
  component: CheckoutPage,
})

interface OrderConfirmationData {
  orderId: string
  saleorSessionId?: string
  trackingNumber: string
  createdAt: string
  estimatedDelivery: string
  customerEmail: string
  customerName: string
  shippingAddress: string
  shippingMethod: string
  paymentMethod: string
  items: Array<{
    id: string
    name: string
    image: string
    quantity: number
    price: number
    options: Array<{ label: string; value: string }>
  }>
  subtotal: number
  discountAmount: number
  discountCode: string | null
  shippingCost: number
  total: number
}

function CheckoutPage() {
  const {
    items,
    totalItems,
    subtotal,
    shippingCost: baseShippingCost,
    discountCode,
    discountAmount,
    clearCart,
  } = useCart()

  const [formData, setFormData] = useState({
    email: 'artist@blacklotus.studio',
    phone: '+1 (555) 019-2834',
    firstName: 'Marcus',
    lastName: 'Vance',
    company: 'Black Lotus Tattoo Atelier',
    address: '742 Evergreen Terrace',
    apartment: 'Suite 204',
    city: 'Los Angeles',
    state: 'CA',
    postalCode: '90028',
    country: 'United States',
  })

  const [shippingMethod, setShippingMethod] = useState<'standard' | 'express'>('standard')
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'paypal' | 'net30'>('card')
  const [cardDetails, setCardDetails] = useState({
    cardNumber: '•••• •••• •••• 4242',
    expDate: '12/28',
    cvc: '888',
    cardholder: 'MARCUS VANCE',
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [confirmedOrder, setConfirmedOrder] = useState<OrderConfirmationData | null>(null)

  // Shipping cost calculation based on method
  const shippingFee = shippingMethod === 'express' ? 19.99 : baseShippingCost
  const orderTotal = Math.max(0, subtotal - discountAmount + shippingFee)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    // Execute Saleor GraphQL mutation simulation & recording
    setTimeout(() => {
      const checkoutUUID =
        typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : 'c8e14674-d021-4f17-b769-cf63654407b1'
      const globalSaleorCheckoutId =
        typeof btoa !== 'undefined' ? btoa(`Checkout:${checkoutUUID}`) : `Checkout:${checkoutUUID}`
      const orderNumber = `SLR-BDGY-${Math.floor(100000 + Math.random() * 900000)}`
      const trackingNumber = `USPS-9400-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`
      const now = new Date()
      const deliveryDate = new Date()
      deliveryDate.setDate(now.getDate() + (shippingMethod === 'express' ? 2 : 4))

      const orderData: OrderConfirmationData = {
        orderId: orderNumber,
        saleorSessionId: globalSaleorCheckoutId,
        trackingNumber,
        createdAt: now.toLocaleString('en-US', {
          dateStyle: 'medium',
          timeStyle: 'short',
        }),
        estimatedDelivery: deliveryDate.toLocaleDateString('en-US', {
          weekday: 'long',
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        }),
        customerEmail: formData.email,
        customerName: `${formData.firstName} ${formData.lastName}`,
        shippingAddress: `${formData.address}, ${formData.apartment ? `${formData.apartment}, ` : ''}${formData.city}, ${formData.state} ${formData.postalCode}, ${formData.country}`,
        shippingMethod:
          shippingMethod === 'express'
            ? 'Priority Studio Airfreight (1-2 Days)'
            : 'Standard Express Courier (3-5 Days)',
        paymentMethod:
          paymentMethod === 'card'
            ? 'Stripe Credit Card (•••• 4242)'
            : paymentMethod === 'paypal'
              ? 'PayPal Express Verified'
              : 'Studio Net-30 Wholesale Term',
        items: [...items],
        subtotal,
        discountAmount,
        discountCode,
        shippingCost: shippingFee,
        total: orderTotal,
      }

      setConfirmedOrder(orderData)
      clearCart()
      setIsSubmitting(false)
    }, 1200)
  }

  // If order was placed, show confirmation screen
  if (confirmedOrder) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8 space-y-10">
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-8 text-center space-y-4">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="h-8 w-8" />
          </div>
          <span className="inline-block rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400 border border-emerald-500/20">
            Saleor GraphQL Order Recorded
          </span>
          <h1 className="text-3xl font-extrabold text-white">Thank You for Your Order!</h1>
          <p className="text-sm text-zinc-400 max-w-lg mx-auto">
            Your studio equipment order has been confirmed. A receipt and packing slip have been
            dispatched to <strong className="text-white">{confirmedOrder.customerEmail}</strong>.
          </p>

          <div className="pt-2 flex flex-wrap justify-center gap-6 text-xs text-zinc-300">
            <div>
              <span className="text-zinc-500 block">Order Number:</span>
              <strong className="text-amber-400 font-mono text-sm">{confirmedOrder.orderId}</strong>
            </div>
            <div>
              <span className="text-zinc-500 block">Saleor Global ID:</span>
              <strong className="text-amber-400 font-mono text-xs truncate max-w-[140px] block">
                {confirmedOrder.saleorSessionId}
              </strong>
            </div>
            <div>
              <span className="text-zinc-500 block">Tracking Number:</span>
              <strong className="text-white font-mono text-sm">
                {confirmedOrder.trackingNumber}
              </strong>
            </div>
            <div>
              <span className="text-zinc-500 block">Estimated Arrival:</span>
              <strong className="text-emerald-400 text-sm">
                {confirmedOrder.estimatedDelivery}
              </strong>
            </div>
          </div>
        </div>

        {/* Detailed Order Receipt */}
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          {/* Shipping & Payment Summary */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-6 space-y-6">
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-amber-500 flex items-center gap-1.5">
                <MapPin className="h-4 w-4" /> Shipping Address
              </h3>
              <p className="mt-2 text-sm font-medium text-white">{confirmedOrder.customerName}</p>
              <p className="text-xs text-zinc-400">{formData.company}</p>
              <p className="mt-1 text-xs text-zinc-400 leading-relaxed">
                {confirmedOrder.shippingAddress}
              </p>
            </div>

            <div className="border-t border-zinc-800/80 pt-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-amber-500 flex items-center gap-1.5">
                <Truck className="h-4 w-4" /> Shipping & Delivery Method
              </h3>
              <p className="mt-2 text-xs text-zinc-300">{confirmedOrder.shippingMethod}</p>
            </div>

            <div className="border-t border-zinc-800/80 pt-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-amber-500 flex items-center gap-1.5">
                <CreditCard className="h-4 w-4" /> Payment Details
              </h3>
              <p className="mt-2 text-xs text-zinc-300">{confirmedOrder.paymentMethod}</p>
              <span className="text-[11px] text-emerald-400">Payment Authorized & Captured</span>
            </div>
          </div>

          {/* Purchased Items List */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-6 space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-amber-500 flex items-center gap-1.5">
              <Package className="h-4 w-4" /> Purchased Items ({confirmedOrder.items.length})
            </h3>

            <div className="divide-y divide-zinc-800/80 max-h-64 overflow-y-auto pr-1">
              {confirmedOrder.items.map((item) => (
                <div key={item.id} className="py-3 flex items-center gap-3">
                  <div className="h-12 w-12 flex-shrink-0 rounded-lg bg-zinc-900 border border-zinc-800 p-1 flex items-center justify-center">
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.name}
                        className="h-full w-full object-contain"
                      />
                    ) : (
                      <Package className="h-5 w-5 text-zinc-600" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-white truncate">{item.name}</p>
                    <p className="text-[10px] text-zinc-400">
                      Qty: {item.quantity} × {formatPrice(item.price)}
                    </p>
                  </div>
                  <span className="text-xs font-semibold text-white">
                    {formatPrice(item.price * item.quantity)}
                  </span>
                </div>
              ))}
            </div>

            <div className="border-t border-zinc-800 pt-3 space-y-1.5 text-xs">
              <div className="flex justify-between text-zinc-400">
                <span>Subtotal</span>
                <span>{formatPrice(confirmedOrder.subtotal)}</span>
              </div>
              {confirmedOrder.discountAmount > 0 && (
                <div className="flex justify-between text-emerald-400">
                  <span>Discount ({confirmedOrder.discountCode})</span>
                  <span>-{formatPrice(confirmedOrder.discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between text-zinc-400">
                <span>Shipping</span>
                <span>
                  {confirmedOrder.shippingCost === 0
                    ? 'FREE'
                    : formatPrice(confirmedOrder.shippingCost)}
                </span>
              </div>
              <div className="flex justify-between font-bold text-white text-sm pt-2 border-t border-zinc-800">
                <span>Total Paid</span>
                <span className="text-amber-400">{formatPrice(confirmedOrder.total)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-center gap-4 pt-4">
          <Link
            to="/"
            className="rounded-lg bg-amber-500 px-8 py-3 text-xs font-bold text-black transition hover:bg-amber-400"
          >
            Return to BDGY Storefront
          </Link>
        </div>
      </div>
    )
  }

  // If cart is empty and no confirmed order, prompt user
  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 text-center space-y-4">
        <h1 className="text-2xl font-bold text-white">No Items to Checkout</h1>
        <p className="text-sm text-zinc-400">
          Your shopping cart is currently empty. Please add items before checking out.
        </p>
        <div className="pt-4">
          <Link
            to="/categories/$slug"
            params={{ slug: 'tattoo-machines' }}
            className="inline-flex rounded-lg bg-amber-500 px-6 py-2.5 text-xs font-bold text-black hover:bg-amber-400"
          >
            Explore Tattoo Equipment
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {/* Checkout Header */}
      <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
        <div>
          <nav
            aria-label="Breadcrumb"
            className="text-xs text-zinc-500 flex items-center gap-1.5 mb-1"
          >
            <Link to="/cart" className="hover:text-zinc-300">
              Cart
            </Link>
            <ChevronRight className="h-3 w-3 text-zinc-600" />
            <span className="text-amber-400 font-medium">Checkout</span>
          </nav>
          <h1 className="text-2xl font-bold text-white">Express Studio Checkout</h1>
        </div>
        <div className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs text-emerald-400 border border-emerald-500/20">
          <Lock className="h-3.5 w-3.5" />
          <span>Saleor 256-bit Encrypted</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-10 lg:grid-cols-3">
        {/* Main form steps */}
        <div className="lg:col-span-2 space-y-8">
          {/* Step 1: Customer Contact */}
          <section className="rounded-xl border border-zinc-800 bg-zinc-950 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-amber-500 flex items-center gap-2">
                <Mail className="h-4 w-4" /> 1. Customer Contact & Studio Details
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-zinc-400 block mb-1">
                  Email for Invoices & Tracking *
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3.5 py-2 text-xs text-white focus:border-amber-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs text-zinc-400 block mb-1">Phone Number *</label>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3.5 py-2 text-xs text-white focus:border-amber-500 focus:outline-none"
                />
              </div>
            </div>
          </section>

          {/* Step 2: Shipping Destination */}
          <section className="rounded-xl border border-zinc-800 bg-zinc-950 p-6 space-y-4">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-amber-500 flex items-center gap-2">
              <MapPin className="h-4 w-4" /> 2. Studio Shipping Destination
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-zinc-400 block mb-1">First Name *</label>
                <input
                  type="text"
                  required
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3.5 py-2 text-xs text-white focus:border-amber-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs text-zinc-400 block mb-1">Last Name *</label>
                <input
                  type="text"
                  required
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3.5 py-2 text-xs text-white focus:border-amber-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-zinc-400 block mb-1">
                Tattoo Studio / Company Name (Optional)
              </label>
              <input
                type="text"
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3.5 py-2 text-xs text-white focus:border-amber-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="text-xs text-zinc-400 block mb-1">Street Address *</label>
                <input
                  type="text"
                  required
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3.5 py-2 text-xs text-white focus:border-amber-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs text-zinc-400 block mb-1">Apt / Suite / Studio</label>
                <input
                  type="text"
                  value={formData.apartment}
                  onChange={(e) => setFormData({ ...formData, apartment: e.target.value })}
                  className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3.5 py-2 text-xs text-white focus:border-amber-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-xs text-zinc-400 block mb-1">City *</label>
                <input
                  type="text"
                  required
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3.5 py-2 text-xs text-white focus:border-amber-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs text-zinc-400 block mb-1">State / Province *</label>
                <input
                  type="text"
                  required
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3.5 py-2 text-xs text-white focus:border-amber-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs text-zinc-400 block mb-1">Postal Code *</label>
                <input
                  type="text"
                  required
                  value={formData.postalCode}
                  onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                  className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3.5 py-2 text-xs text-white focus:border-amber-500 focus:outline-none"
                />
              </div>
            </div>
          </section>

          {/* Step 3: Shipping Method */}
          <section className="rounded-xl border border-zinc-800 bg-zinc-950 p-6 space-y-4">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-amber-500 flex items-center gap-2">
              <Truck className="h-4 w-4" /> 3. Select Shipping Speed
            </h2>
            <div className="space-y-3">
              <label
                className={`flex cursor-pointer items-center justify-between rounded-xl border p-4 transition ${
                  shippingMethod === 'standard'
                    ? 'border-amber-500 bg-amber-500/10'
                    : 'border-zinc-800 bg-zinc-900/60 hover:border-zinc-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="shipping"
                    checked={shippingMethod === 'standard'}
                    onChange={() => setShippingMethod('standard')}
                    className="accent-amber-500"
                  />
                  <div>
                    <span className="text-xs font-bold text-white block">
                      Standard Express Ground (3-5 Business Days)
                    </span>
                    <span className="text-[11px] text-zinc-400">
                      Insured delivery via FedEx / UPS
                    </span>
                  </div>
                </div>
                <span className="text-xs font-bold text-amber-400">
                  {baseShippingCost === 0 ? 'FREE' : formatPrice(baseShippingCost)}
                </span>
              </label>

              <label
                className={`flex cursor-pointer items-center justify-between rounded-xl border p-4 transition ${
                  shippingMethod === 'express'
                    ? 'border-amber-500 bg-amber-500/10'
                    : 'border-zinc-800 bg-zinc-900/60 hover:border-zinc-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="shipping"
                    checked={shippingMethod === 'express'}
                    onChange={() => setShippingMethod('express')}
                    className="accent-amber-500"
                  />
                  <div>
                    <span className="text-xs font-bold text-white block">
                      Priority Studio Airfreight (1-2 Business Days)
                    </span>
                    <span className="text-[11px] text-zinc-400">
                      Expedited same-day dispatch before 3 PM PST
                    </span>
                  </div>
                </div>
                <span className="text-xs font-bold text-white">{formatPrice(19.99)}</span>
              </label>
            </div>
          </section>

          {/* Step 4: Payment Details */}
          <section className="rounded-xl border border-zinc-800 bg-zinc-950 p-6 space-y-4">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-amber-500 flex items-center gap-2">
              <CreditCard className="h-4 w-4" /> 4. Payment Gateway
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setPaymentMethod('card')}
                className={`flex items-center justify-center gap-2 rounded-lg border p-3 text-xs font-semibold transition ${
                  paymentMethod === 'card'
                    ? 'border-amber-500 bg-amber-500/10 text-white'
                    : 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-white'
                }`}
              >
                <CreditCard className="h-4 w-4 text-amber-500" />
                Credit Card (Stripe)
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod('paypal')}
                className={`flex items-center justify-center gap-2 rounded-lg border p-3 text-xs font-semibold transition ${
                  paymentMethod === 'paypal'
                    ? 'border-amber-500 bg-amber-500/10 text-white'
                    : 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-white'
                }`}
              >
                PayPal Express
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod('net30')}
                className={`flex items-center justify-center gap-2 rounded-lg border p-3 text-xs font-semibold transition ${
                  paymentMethod === 'net30'
                    ? 'border-amber-500 bg-amber-500/10 text-white'
                    : 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-white'
                }`}
              >
                <Building2 className="h-4 w-4 text-amber-500" />
                Studio Net-30
              </button>
            </div>

            {paymentMethod === 'card' && (
              <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-4 space-y-3">
                <div>
                  <label className="text-[11px] text-zinc-400 block mb-1">Card Number</label>
                  <input
                    type="text"
                    required
                    value={cardDetails.cardNumber}
                    onChange={(e) => setCardDetails({ ...cardDetails, cardNumber: e.target.value })}
                    className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none font-mono"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] text-zinc-400 block mb-1">Expires (MM/YY)</label>
                    <input
                      type="text"
                      required
                      value={cardDetails.expDate}
                      onChange={(e) => setCardDetails({ ...cardDetails, expDate: e.target.value })}
                      className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-zinc-400 block mb-1">CVC Code</label>
                    <input
                      type="text"
                      required
                      value={cardDetails.cvc}
                      onChange={(e) => setCardDetails({ ...cardDetails, cvc: e.target.value })}
                      className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none font-mono"
                    />
                  </div>
                </div>
              </div>
            )}
          </section>
        </div>

        {/* Right column: Order Summary & Place Order CTA */}
        <div className="space-y-4">
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-6 space-y-5">
            <h2 className="text-lg font-bold text-white">Order Review</h2>

            {/* Line items mini-list */}
            <div className="space-y-3 max-h-56 overflow-y-auto pr-1 border-b border-zinc-800 pb-4">
              {items.map((item) => (
                <div key={item.id} className="flex items-center gap-3">
                  <div className="relative h-12 w-12 flex-shrink-0 rounded-lg bg-zinc-950 border border-zinc-800 p-1 flex items-center justify-center">
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.name}
                        className="h-full w-full object-contain"
                      />
                    ) : (
                      <Package className="h-4 w-4 text-zinc-600" />
                    )}
                    <span className="absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full bg-amber-500 text-[9px] font-bold text-black flex items-center justify-center">
                      {item.quantity}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-white truncate">{item.name}</p>
                    <p className="text-[10px] text-zinc-400">
                      {item.options.map((o) => `${o.label}: ${o.value}`).join(' • ')}
                    </p>
                  </div>
                  <span className="text-xs font-bold text-white">
                    {formatPrice(item.price * item.quantity)}
                  </span>
                </div>
              ))}
            </div>

            {/* Calculations */}
            <div className="space-y-2 text-xs text-zinc-400 border-b border-zinc-800 pb-4">
              <div className="flex justify-between">
                <span>Subtotal ({totalItems} items)</span>
                <span className="text-white font-medium">{formatPrice(subtotal)}</span>
              </div>

              {discountAmount > 0 && (
                <div className="flex justify-between text-emerald-400 font-medium">
                  <span>Promo Discount ({discountCode})</span>
                  <span>-{formatPrice(discountAmount)}</span>
                </div>
              )}

              <div className="flex justify-between">
                <span>Shipping ({shippingMethod === 'express' ? 'Airfreight' : 'Standard'})</span>
                <span
                  className={shippingFee === 0 ? 'text-emerald-400 font-semibold' : 'text-white'}
                >
                  {shippingFee === 0 ? 'FREE' : formatPrice(shippingFee)}
                </span>
              </div>

              <div className="flex justify-between">
                <span>Sales Tax</span>
                <span className="text-zinc-500 font-mono">$0.00 (Exempt)</span>
              </div>
            </div>

            <div className="flex justify-between text-base font-bold text-white">
              <span>Final Total</span>
              <span className="text-xl text-amber-400">{formatPrice(orderTotal)}</span>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-amber-500 py-3.5 text-sm font-bold text-black transition hover:bg-amber-400 disabled:opacity-50 shadow-lg shadow-amber-500/10 active:scale-[0.99]"
            >
              {isSubmitting ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-black border-t-transparent" />
                  <span>Processing Saleor Order...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="h-4 w-4" />
                  <span>Place Order • {formatPrice(orderTotal)}</span>
                </>
              )}
            </button>

            <div className="text-center">
              <Link
                to="/cart"
                className="text-xs text-zinc-500 hover:text-zinc-300 transition flex items-center justify-center gap-1"
              >
                <ArrowLeft className="h-3 w-3" /> Return to Cart
              </Link>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}
