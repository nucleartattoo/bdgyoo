import { createFileRoute } from '@tanstack/react-router'
import {
  Activity,
  ArrowRight,
  CheckCircle2,
  Database,
  ExternalLink,
  Layers,
  Play,
  RefreshCw,
  Server,
  ShoppingBag,
  Zap,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import {
  type ShopInfo,
  completeSaleorCheckout,
  createSaleorCheckout,
  createSaleorTransaction,
  fetchSaleorProducts,
  fetchSaleorShopInfo,
  updateSaleorBillingAddress,
  updateSaleorDeliveryMethod,
  updateSaleorShippingAddress,
} from '~/lib/saleor/api'
import { getSaleorConfig, setSaleorConfig } from '~/lib/saleor/client'
import type { Product } from '~/lib/saleor/types'
import { formatPrice } from '~/lib/utils'

export const Route = createFileRoute('/saleor')({
  component: SaleorIntegrationPage,
})

function SaleorIntegrationPage() {
  const [config, setConfig] = useState(() => getSaleorConfig())
  const [customEndpoint, setCustomEndpoint] = useState(config.endpoint)
  const [customChannel, setCustomChannel] = useState(config.channel)

  // Ping status
  const [pingStatus, setPingStatus] = useState<{
    loading: boolean
    success?: boolean
    shop?: ShopInfo
    latency?: number
    error?: string
  }>({ loading: false })

  // Live products
  const [productsLoading, setProductsLoading] = useState(false)
  const [products, setProducts] = useState<Product[]>([])
  const [productsTotal, setProductsTotal] = useState<number | undefined>(undefined)
  const [productsError, setProductsError] = useState<string | null>(null)

  // Checkout simulation
  const [checkoutTesting, setCheckoutTesting] = useState(false)
  const [checkoutResult, setCheckoutResult] = useState<any>(null)

  // Auto-ping on initial mount
  useEffect(() => {
    handlePing(config.endpoint)
    handleFetchProducts()
  }, [config.endpoint])

  const handlePing = async (endpointToTest?: string) => {
    setPingStatus({ loading: true })
    const res = await fetchSaleorShopInfo()
    if (res.success && res.data) {
      setPingStatus({
        loading: false,
        success: true,
        shop: res.data,
        latency: res.latencyMs,
      })
    } else {
      setPingStatus({
        loading: false,
        success: false,
        latency: res.latencyMs,
        error: res.error || 'Connection failed',
      })
    }
  }

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault()
    setSaleorConfig(customEndpoint, customChannel)
    const updated = getSaleorConfig()
    setConfig(updated)
    handlePing(updated.endpoint)
    handleFetchProducts()
  }

  const handleApplyPreset = (endpoint: string, channel: string) => {
    setCustomEndpoint(endpoint)
    setCustomChannel(channel)
    setSaleorConfig(endpoint, channel)
    const updated = getSaleorConfig()
    setConfig(updated)
    handlePing(endpoint)
    handleFetchProducts()
  }

  const handleFetchProducts = async () => {
    setProductsLoading(true)
    setProductsError(null)
    const res = await fetchSaleorProducts({ first: 8 })
    setProductsLoading(false)
    if (res.error) {
      setProductsError(res.error)
    } else {
      setProducts(res.products)
      setProductsTotal(res.totalCount)
    }
  }

  const [checkoutStep, setCheckoutStep] = useState<string>('')

  const handleTestCheckout = async () => {
    if (products.length === 0 || !products[0]?.variants?.[0]) {
      alert('Please load products first to acquire a real Saleor variant ID.')
      return
    }

    setCheckoutTesting(true)
    setCheckoutResult(null)

    // Find first product with purchasable variant
    let targetProduct = products[0]
    let targetVariant = products[0].variants?.[0]
    for (const p of products) {
      if (p.variants && p.variants.length > 0) {
        targetProduct = p
        targetVariant = p.variants[0]
        break
      }
    }

    if (!targetVariant?.id) {
      alert('Selected product has no purchasable variants.')
      setCheckoutTesting(false)
      return
    }

    try {
      // 1. Create Checkout
      setCheckoutStep('1/5 Creating checkout session...')
      const createRes = await createSaleorCheckout({
        email: 'customer@bdgyoo.com',
        lines: [{ variantId: targetVariant.id, quantity: 1 }],
      })

      if (!createRes.success || !createRes.checkout?.id) {
        setCheckoutTesting(false)
        setCheckoutResult({
          productName: targetProduct.name,
          variantId: targetVariant.id,
          step: 'checkoutCreate',
          error: createRes.errors?.[0]?.message || 'Failed to create checkout',
        })
        return
      }

      const checkoutId = createRes.checkout.id

      // 2. Set Shipping Address
      setCheckoutStep('2/5 Setting shipping address...')
      const shipRes = await updateSaleorShippingAddress(checkoutId, {
        firstName: 'Austin',
        lastName: 'Artist',
        streetAddress1: '742 Evergreen Terrace',
        city: 'Los Angeles',
        countryArea: 'CA',
        postalCode: '90001',
        country: 'US',
        phone: '+12135550199',
      })

      if (!shipRes.success) {
        setCheckoutTesting(false)
        setCheckoutResult({
          productName: targetProduct.name,
          variantId: targetVariant.id,
          step: 'checkoutShippingAddressUpdate',
          error: shipRes.errors?.[0]?.message || 'Failed to update shipping address',
        })
        return
      }

      // 3. Set Billing Address
      setCheckoutStep('3/5 Setting billing address...')
      const billRes = await updateSaleorBillingAddress(checkoutId, {
        firstName: 'Austin',
        lastName: 'Artist',
        streetAddress1: '742 Evergreen Terrace',
        city: 'Los Angeles',
        countryArea: 'CA',
        postalCode: '90001',
        country: 'US',
        phone: '+12135550199',
      })

      if (!billRes.success) {
        setCheckoutTesting(false)
        setCheckoutResult({
          productName: targetProduct.name,
          variantId: targetVariant.id,
          step: 'checkoutBillingAddressUpdate',
          error: billRes.errors?.[0]?.message || 'Failed to update billing address',
        })
        return
      }

      // 4. Select Delivery Method
      setCheckoutStep('4/5 Binding shipping method & charging transaction...')
      const deliveryMethod = shipRes.availableShippingMethods?.[0]
      let grandTotal = createRes.checkout.totalPrice?.gross.amount || 20.0
      const currency = createRes.checkout.totalPrice?.gross.currency || 'USD'

      if (deliveryMethod?.id) {
        const delivRes = await updateSaleorDeliveryMethod(checkoutId, deliveryMethod.id)
        if (delivRes.success && delivRes.totalPrice?.gross.amount) {
          grandTotal = delivRes.totalPrice.gross.amount
        }
      }

      // Record transaction
      const txRes = await createSaleorTransaction(checkoutId, {
        amount: grandTotal,
        currency,
        name: 'Storefront Credit Card',
      })

      if (!txRes.success) {
        setCheckoutTesting(false)
        setCheckoutResult({
          productName: targetProduct.name,
          variantId: targetVariant.id,
          step: 'transactionCreate',
          error: txRes.errors?.[0]?.message || 'Failed to authorize payment transaction',
        })
        return
      }

      // 5. Complete Checkout
      setCheckoutStep('5/5 Finalizing checkout into official order...')
      const completeRes = await completeSaleorCheckout(checkoutId)

      setCheckoutTesting(false)
      if (completeRes.success && completeRes.order) {
        setCheckoutResult({
          success: true,
          productName: targetProduct.name,
          variantId: targetVariant.id,
          checkoutId,
          order: completeRes.order,
          shippingMethod: deliveryMethod?.name || 'Standard Ground',
          grandTotal,
          currency,
        })
      } else {
        setCheckoutResult({
          productName: targetProduct.name,
          variantId: targetVariant.id,
          step: 'checkoutComplete',
          error: completeRes.errors?.[0]?.message || 'Failed to complete order in Saleor',
        })
      }
    } catch (err: any) {
      setCheckoutTesting(false)
      setCheckoutResult({
        productName: targetProduct.name,
        variantId: targetVariant.id,
        step: 'exception',
        error: err.message,
      })
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-10">
      {/* Page Header */}
      <div className="border-b border-zinc-800 pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded bg-amber-500 font-bold text-black text-xs">
              S
            </span>
            <span className="text-xs font-mono uppercase tracking-wider text-amber-500 font-semibold">
              Saleor Headless Commerce GraphQL Engine
            </span>
          </div>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            Saleor Backend Live Integration
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            Real-time verification, GraphQL introspection, and live checkout mutation runner.
          </p>
        </div>

        {/* Live Status Badge */}
        <div className="flex items-center gap-3">
          <div
            className={`flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold border ${
              pingStatus.loading
                ? 'border-zinc-700 bg-zinc-800 text-zinc-400'
                : pingStatus.success
                  ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                  : 'border-rose-500/30 bg-rose-500/10 text-rose-400'
            }`}
          >
            <span
              className={`h-2 w-2 rounded-full ${
                pingStatus.loading
                  ? 'bg-zinc-500 animate-pulse'
                  : pingStatus.success
                    ? 'bg-emerald-400 animate-pulse'
                    : 'bg-rose-500'
              }`}
            />
            {pingStatus.loading
              ? 'Probing GraphQL Endpoint...'
              : pingStatus.success
                ? `Saleor Connected • ${pingStatus.latency}ms`
                : 'Connection Refused'}
          </div>

          <button
            type="button"
            onClick={() => handlePing()}
            disabled={pingStatus.loading}
            className="flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs font-medium text-zinc-300 hover:bg-zinc-800 hover:text-white transition"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${pingStatus.loading ? 'animate-spin text-amber-400' : ''}`}
            />
            Ping
          </button>
        </div>
      </div>

      {/* Grid: Endpoint Settings & Diagnostics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Endpoint Configuration Panel */}
        <div className="lg:col-span-2 rounded-xl border border-zinc-800 bg-zinc-950 p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-amber-500 flex items-center gap-2">
              <Server className="h-4 w-4" /> Endpoint Configuration
            </h2>
            <span className="text-xs text-zinc-500 font-mono">Channel: {config.channel}</span>
          </div>

          <form onSubmit={handleSaveConfig} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">
                GraphQL Endpoint URL
              </label>
              <input
                type="url"
                required
                value={customEndpoint}
                onChange={(e) => setCustomEndpoint(e.target.value)}
                placeholder="https://.../graphql/"
                className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3.5 py-2.5 text-xs text-white font-mono focus:border-amber-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">
                Default Channel
              </label>
              <input
                type="text"
                required
                value={customChannel}
                onChange={(e) => setCustomChannel(e.target.value)}
                placeholder="default-channel"
                className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3.5 py-2.5 text-xs text-white font-mono focus:border-amber-500 focus:outline-none"
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] text-zinc-500">Quick Presets:</span>
                <button
                  type="button"
                  onClick={() =>
                    handleApplyPreset('https://learn.saleor.cloud/graphql/', 'default-channel')
                  }
                  className="rounded border border-zinc-800 bg-zinc-900/80 px-2.5 py-1 text-[11px] text-zinc-300 hover:border-amber-500/50 hover:text-white"
                >
                  Saleor Cloud (Public)
                </button>
                <button
                  type="button"
                  onClick={() =>
                    handleApplyPreset(
                      'https://ntms-saleor.kubernetes.nucleartattoosupply.com/graphql/',
                      'default-channel',
                    )
                  }
                  className="rounded border border-zinc-800 bg-zinc-900/80 px-2.5 py-1 text-[11px] text-zinc-300 hover:border-amber-500/50 hover:text-white"
                >
                  Kubernetes Private
                </button>
              </div>

              <button
                type="submit"
                className="rounded-lg bg-amber-500 px-5 py-2 text-xs font-bold text-black hover:bg-amber-400 transition"
              >
                Apply & Save Configuration
              </button>
            </div>
          </form>

          {/* Introspection Data Card */}
          {pingStatus.shop && (
            <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-4 space-y-2">
              <h3 className="text-xs font-semibold text-white flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                Live Shop Introspection Response
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs pt-1">
                <div>
                  <span className="text-zinc-500 block">Shop Name:</span>
                  <span className="text-zinc-200 font-medium">{pingStatus.shop.name}</span>
                </div>
                <div>
                  <span className="text-zinc-500 block">Roundtrip Latency:</span>
                  <span className="text-emerald-400 font-mono font-medium">
                    {pingStatus.latency} ms
                  </span>
                </div>
                <div>
                  <span className="text-zinc-500 block">Saleor Version:</span>
                  <span className="text-zinc-200 font-mono">
                    {pingStatus.shop.version || '3.x'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {pingStatus.error && (
            <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-4 text-xs text-rose-300">
              <p className="font-semibold">GraphQL Error / Connection Failure:</p>
              <p className="mt-1 font-mono text-[11px]">{pingStatus.error}</p>
            </div>
          )}
        </div>

        {/* Live GraphQL Checkout Mutation Runner */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-6 space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-amber-500 flex items-center gap-2">
              <Zap className="h-4 w-4" /> Live Checkout Mutation
            </h2>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Dispatches a live <code className="text-amber-400">checkoutCreate</code> GraphQL
              mutation directly to the target Saleor endpoint.
            </p>

            <button
              type="button"
              onClick={handleTestCheckout}
              disabled={checkoutTesting || products.length === 0}
              className="w-full flex items-center justify-center gap-2 rounded-lg bg-emerald-500 py-3 text-xs font-bold text-black transition hover:bg-emerald-400 disabled:opacity-50"
            >
              <Play className={`h-4 w-4 ${checkoutTesting ? 'animate-spin' : ''}`} />
              {checkoutTesting ? checkoutStep || 'Processing...' : 'Run Full E2E Checkout Flow'}
            </button>

            {checkoutResult && (
              <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-3.5 space-y-2 text-[11px] font-mono overflow-hidden">
                <div className="text-zinc-400">
                  Product: <span className="text-white">{checkoutResult.productName}</span>
                </div>
                {checkoutResult.success && checkoutResult.order ? (
                  <div className="space-y-1.5 text-emerald-400">
                    <p className="font-bold flex items-center gap-1.5 text-xs text-emerald-300">
                      <CheckCircle2 className="h-4 w-4 text-emerald-400" /> Official Order #
                      {checkoutResult.order.number} Created!
                    </p>
                    <div className="bg-zinc-950 p-2.5 rounded border border-emerald-500/30 text-[10px] space-y-1">
                      <p className="text-zinc-300">
                        Order ID: <span className="text-amber-400">{checkoutResult.order.id}</span>
                      </p>
                      <p className="text-zinc-300">
                        Status:{' '}
                        <span className="text-emerald-400 font-bold">
                          {checkoutResult.order.status}
                        </span>
                      </p>
                      <p className="text-zinc-300">
                        Shipping:{' '}
                        <span className="text-white">{checkoutResult.shippingMethod}</span>
                      </p>
                      <p className="text-zinc-300">
                        Total Settled:{' '}
                        <span className="text-emerald-400 font-bold">
                          ${checkoutResult.grandTotal} {checkoutResult.currency}
                        </span>
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="text-rose-400 space-y-1">
                    <p className="font-bold">Error at step: {checkoutResult.step}</p>
                    <p className="text-[10px] text-rose-300">{checkoutResult.error}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-zinc-800 text-[11px] text-zinc-500 space-y-1">
            <p className="flex items-center gap-1">
              <Database className="h-3.5 w-3.5" /> Backend: Saleor 3.23+ Architecture
            </p>
            <p>Channel-Scoped Pricing & Inventory</p>
          </div>
        </div>
      </div>

      {/* Live Remote Products Section */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-4">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Layers className="h-5 w-5 text-amber-500" /> Live Saleor Products (via GraphQL)
            </h2>
            <p className="text-xs text-zinc-400 mt-1">
              Data queried directly via{' '}
              <code className="text-amber-400">products(channel, first)</code> from{' '}
              {config.endpoint}.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {productsTotal !== undefined && (
              <span className="rounded-full bg-zinc-800 px-3 py-1 text-xs text-zinc-300 font-mono">
                {productsTotal} total in channel
              </span>
            )}
            <button
              type="button"
              onClick={handleFetchProducts}
              disabled={productsLoading}
              className="flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-zinc-800 transition"
            >
              <RefreshCw
                className={`h-3.5 w-3.5 ${productsLoading ? 'animate-spin text-amber-400' : ''}`}
              />
              Refresh Live Catalog
            </button>
          </div>
        </div>

        {productsLoading ? (
          <div className="py-16 text-center text-zinc-500 space-y-3">
            <RefreshCw className="mx-auto h-8 w-8 animate-spin text-amber-500" />
            <p className="text-xs">Fetching GraphQL dataset from Saleor backend...</p>
          </div>
        ) : productsError ? (
          <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-8 text-center space-y-2">
            <p className="text-sm font-semibold text-rose-300">Failed to Query Products</p>
            <p className="text-xs text-zinc-400 font-mono">{productsError}</p>
          </div>
        ) : products.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {products.map((product) => {
              const startPrice =
                product.pricing?.priceRange?.start?.gross?.amount ??
                product.variants?.[0]?.pricing?.price?.gross?.amount ??
                0
              const currency = product.pricing?.priceRange?.start?.gross?.currency ?? 'USD'

              return (
                <div
                  key={product.id}
                  className="group relative flex flex-col overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 transition hover:border-amber-500/50 hover:bg-zinc-900/80"
                >
                  <div className="relative aspect-square overflow-hidden rounded-lg bg-zinc-950 p-2 flex items-center justify-center">
                    {product.thumbnail?.url ? (
                      <img
                        src={product.thumbnail.url}
                        alt={product.name}
                        className="h-full w-full object-contain group-hover:scale-105 transition duration-300"
                      />
                    ) : (
                      <ShoppingBag className="h-10 w-10 text-zinc-700" />
                    )}
                    <span className="absolute top-2 left-2 rounded bg-black/60 backdrop-blur-md px-1.5 py-0.5 text-[9px] font-mono text-zinc-300 border border-zinc-800">
                      Saleor Node
                    </span>
                  </div>

                  <div className="mt-4 flex flex-1 flex-col justify-between space-y-2">
                    <div>
                      {product.category?.name && (
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-500">
                          {product.category.name}
                        </span>
                      )}
                      <h3 className="text-xs font-bold text-white line-clamp-2 mt-0.5">
                        {product.name}
                      </h3>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-zinc-800/80">
                      <span className="text-sm font-extrabold text-white">
                        {formatPrice(startPrice)}
                      </span>
                      <span className="text-[10px] text-zinc-500 font-mono">
                        {product.variants?.length || 1} variant(s)
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-zinc-800 p-12 text-center text-zinc-500 space-y-2">
            <p className="text-sm">No products found in this channel.</p>
            <p className="text-xs">
              Ensure products are published to the channel in Saleor Dashboard.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
