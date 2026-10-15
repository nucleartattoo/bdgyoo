import { createFileRoute } from '@tanstack/react-router'
import {
  AlertCircle,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  ExternalLink,
  Mail,
  MapPin,
  Package,
  Phone,
  RefreshCw,
  Search,
  ShieldCheck,
  Truck,
  User,
  Zap,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { type SaleorOrderSummary, searchSaleorOrders } from '~/lib/saleor/api'
import { formatPrice } from '~/lib/utils'

export const Route = createFileRoute('/account')({
  component: AccountPage,
})

function AccountPage() {
  const [tab, setTab] = useState<'orders' | 'profile' | 'addresses'>('orders')

  // Orders lookup state
  const [searchQuery, setSearchQuery] = useState('')
  const [orders, setOrders] = useState<SaleorOrderSummary[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<SaleorOrderSummary | null>(null)

  const handleFetchOrders = async (query?: string) => {
    setIsLoading(true)
    try {
      const res = await searchSaleorOrders(query)
      if (res.success) {
        setOrders(res.orders)
        if (res.orders.length > 0) {
          setSelectedOrder(res.orders[0])
        }
      }
    } catch {
      // Fallback
    } finally {
      setIsLoading(false)
    }
  }

  // biome-ignore lint/correctness/useExhaustiveDependencies: initial mount only
  useEffect(() => {
    handleFetchOrders()
  }, [])

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    handleFetchOrders(searchQuery.trim().replace(/^#/, ''))
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {/* Account Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-zinc-800/80 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 rounded bg-[#E50914] px-2.5 py-0.5 text-[11px] font-black tracking-wider uppercase text-white shadow-lg shadow-red-900/40">
              <Zap className="h-3 w-3 fill-current" /> STUDIO PRO
            </span>
            <span className="text-xs text-zinc-500 font-mono">Saleor B2B ID: US-STUDIO-889</span>
          </div>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-white">
            Studio Customer Portal
          </h1>
          <p className="mt-1 text-xs text-zinc-400">
            Real-time Saleor 3.23 order dispatch, shipment tracking, and wholesale profile.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-xl border border-zinc-800 bg-[#161616] px-3.5 py-2 text-xs">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            <span className="text-zinc-300">Verified Wholesale Artist</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
        {/* Navigation Sidebar Tabs (Col 1) */}
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => setTab('orders')}
            className={`flex w-full items-center justify-between rounded-xl px-4 py-3 text-xs font-bold transition cursor-pointer ${
              tab === 'orders'
                ? 'bg-[#E50914] text-white shadow-lg shadow-red-950/40'
                : 'bg-[#141414] text-zinc-400 hover:bg-zinc-800 hover:text-white border border-zinc-800'
            }`}
          >
            <div className="flex items-center gap-3">
              <Package className="h-4 w-4" />
              <span>Live Saleor Orders</span>
            </div>
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] ${
                tab === 'orders' ? 'bg-black/40 text-white' : 'bg-zinc-800 text-zinc-300'
              }`}
            >
              {orders.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setTab('profile')}
            className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-xs font-bold transition cursor-pointer ${
              tab === 'profile'
                ? 'bg-[#E50914] text-white shadow-lg shadow-red-950/40'
                : 'bg-[#141414] text-zinc-400 hover:bg-zinc-800 hover:text-white border border-zinc-800'
            }`}
          >
            <User className="h-4 w-4" />
            <span>Studio Profile & Tax ID</span>
          </button>

          <button
            type="button"
            onClick={() => setTab('addresses')}
            className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-xs font-bold transition cursor-pointer ${
              tab === 'addresses'
                ? 'bg-[#E50914] text-white shadow-lg shadow-red-950/40'
                : 'bg-[#141414] text-zinc-400 hover:bg-zinc-800 hover:text-white border border-zinc-800'
            }`}
          >
            <MapPin className="h-4 w-4" />
            <span>Studio Address Book</span>
          </button>
        </div>

        {/* Tab Content Area (Col 3) */}
        <div className="lg:col-span-3 space-y-6">
          {tab === 'orders' && (
            <div className="space-y-6">
              {/* Order Search & Quick Filters */}
              <div className="rounded-2xl border border-zinc-800 bg-[#141414] p-5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex-1">
                    <h2 className="text-sm font-bold text-white flex items-center gap-2">
                      <Search className="h-4 w-4 text-[#E50914]" /> Saleor GraphQL Order Lookup
                    </h2>
                    <p className="text-xs text-zinc-400 mt-1">
                      Search by official order number (#18, #17, #16...) or buyer email
                    </p>
                  </div>

                  <form onSubmit={handleSearchSubmit} className="flex gap-2">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="e.g. 18 or artist@blacklotus..."
                      className="w-56 sm:w-64 rounded-xl border border-zinc-700 bg-zinc-900 px-3.5 py-2 text-xs text-white placeholder-zinc-500 focus:border-[#E50914] focus:outline-none"
                    />
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="rounded-xl bg-[#E50914] px-4 py-2 text-xs font-bold text-white hover:bg-red-600 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      {isLoading ? (
                        <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Search className="h-3.5 w-3.5" />
                      )}
                      <span>Track</span>
                    </button>
                  </form>
                </div>

                {/* Quick Order Chips */}
                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-zinc-800/80 text-xs">
                  <span className="text-zinc-500">Quick Test Orders:</span>
                  {['18', '17', '16', '15'].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => {
                        setSearchQuery(num)
                        handleFetchOrders(num)
                      }}
                      className="rounded-lg bg-zinc-900 border border-zinc-800 px-2.5 py-1 font-mono text-zinc-300 hover:border-red-600 hover:text-white transition cursor-pointer"
                    >
                      #{num}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('')
                      handleFetchOrders()
                    }}
                    className="ml-auto text-xs text-zinc-400 hover:text-white flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCw className="h-3 w-3" /> Show All
                  </button>
                </div>
              </div>

              {/* Order Detail & Timeline View */}
              {selectedOrder && (
                <div className="rounded-2xl border border-zinc-800 bg-[#161616] p-6 space-y-6">
                  {/* Order Top Bar */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-5">
                    <div>
                      <div className="flex items-center gap-3">
                        <span className="text-xl font-black text-white">
                          Order #{selectedOrder.number}
                        </span>
                        <span
                          className={`rounded-full px-3 py-0.5 text-xs font-bold border ${
                            selectedOrder.status === 'FULFILLED'
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                              : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                          }`}
                        >
                          {selectedOrder.status}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-400 mt-1 flex items-center gap-2">
                        <Calendar className="h-3.5 w-3.5 text-zinc-500" />
                        <span>Placed on {new Date(selectedOrder.created).toLocaleString()}</span>
                        <span>•</span>
                        <Mail className="h-3.5 w-3.5 text-zinc-500" />
                        <span className="text-zinc-300">{selectedOrder.userEmail}</span>
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="text-xs text-zinc-400">Total Charged (Saleor API)</span>
                      <div className="text-2xl font-black text-white">
                        {formatPrice(selectedOrder.total.gross.amount)}
                      </div>
                    </div>
                  </div>

                  {/* Shipment Tracking Timeline */}
                  <div className="rounded-xl border border-zinc-800 bg-[#121212] p-5 space-y-4">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
                      <Truck className="h-4 w-4 text-[#E50914]" /> Studio Fulfillment Timeline
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-2">
                      <div className="flex items-start gap-3">
                        <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-emerald-500 text-black">
                          <CheckCircle2 className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-white">Order Confirmed</p>
                          <p className="text-[11px] text-zinc-400">Saleor transaction paid</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-emerald-500 text-black">
                          <CheckCircle2 className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-white">Allocated from Hub</p>
                          <p className="text-[11px] text-zinc-400">Los Angeles Warehouse</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-amber-500 text-black">
                          <Clock className="h-4 w-4 animate-spin" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-white">Carrier Packaging</p>
                          <p className="text-[11px] text-zinc-400">UPS Standard Ground</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-zinc-800 text-zinc-500">
                          <Package className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-zinc-400">Studio Delivery</p>
                          <p className="text-[11px] text-zinc-500">Est. 2-3 Business Days</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Order Items & Shipping Address Details */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Line Items */}
                    <div className="space-y-3">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                        Order Items ({selectedOrder.lines.length})
                      </h4>
                      <div className="space-y-2">
                        {selectedOrder.lines.map((line) => (
                          <div
                            key={line.id}
                            className="flex items-center justify-between rounded-xl border border-zinc-800 bg-[#121212] p-3 text-xs"
                          >
                            <div className="min-w-0 pr-3">
                              <p className="font-bold text-white truncate">{line.productName}</p>
                              {line.variantName && (
                                <p className="text-[11px] text-zinc-400 truncate">
                                  {line.variantName}
                                </p>
                              )}
                              <p className="text-zinc-500 mt-0.5">Qty: {line.quantity}</p>
                            </div>
                            <div className="text-right font-bold text-white">
                              {formatPrice(line.unitPrice.gross.amount * line.quantity)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Shipping & Delivery Info */}
                    <div className="space-y-3">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                        Shipping Destination
                      </h4>
                      {selectedOrder.shippingAddress ? (
                        <div className="rounded-xl border border-zinc-800 bg-[#121212] p-4 text-xs space-y-1.5 text-zinc-300">
                          <p className="font-bold text-white">
                            {selectedOrder.shippingAddress.firstName}{' '}
                            {selectedOrder.shippingAddress.lastName}
                          </p>
                          <p>{selectedOrder.shippingAddress.streetAddress1}</p>
                          {selectedOrder.shippingAddress.streetAddress2 && (
                            <p>{selectedOrder.shippingAddress.streetAddress2}</p>
                          )}
                          <p>
                            {selectedOrder.shippingAddress.city},{' '}
                            {selectedOrder.shippingAddress.countryArea}{' '}
                            {selectedOrder.shippingAddress.postalCode}
                          </p>
                          <div className="pt-2 text-[11px] text-emerald-400 flex items-center gap-1 font-medium">
                            <CheckCircle2 className="h-3.5 w-3.5" /> Address verified with carrier
                          </div>
                        </div>
                      ) : (
                        <div className="rounded-xl border border-zinc-800 bg-[#121212] p-4 text-xs text-zinc-500">
                          Digital Delivery or Pickup
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Order List Table */}
              <div className="rounded-2xl border border-zinc-800 bg-[#141414] overflow-hidden">
                <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                    Order History Records
                  </h3>
                  <span className="text-xs text-zinc-500">{orders.length} orders found</span>
                </div>

                {orders.length > 0 ? (
                  <div className="divide-y divide-zinc-800/80">
                    {orders.map((ord) => (
                      <button
                        type="button"
                        key={ord.id}
                        onClick={() => setSelectedOrder(ord)}
                        className={`w-full flex items-center justify-between p-4 text-left transition cursor-pointer ${
                          selectedOrder?.id === ord.id ? 'bg-zinc-800/50' : 'hover:bg-zinc-900/60'
                        }`}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-white">
                              Order #{ord.number}
                            </span>
                            <span
                              className={`rounded-full px-2 py-0.5 text-[10px] font-semibold border ${
                                ord.status === 'FULFILLED'
                                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                  : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                              }`}
                            >
                              {ord.status}
                            </span>
                          </div>
                          <p className="text-xs text-zinc-400">
                            {new Date(ord.created).toLocaleDateString()} • {ord.userEmail}
                          </p>
                        </div>

                        <div className="text-right">
                          <span className="text-sm font-bold text-white">
                            {formatPrice(ord.total.gross.amount)}
                          </span>
                          <span className="block text-[11px] text-zinc-500">
                            {ord.lines.length} {ord.lines.length === 1 ? 'line' : 'lines'}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center text-xs text-zinc-400 space-y-2">
                    <Package className="mx-auto h-8 w-8 text-zinc-600" />
                    <p>No orders matched your search criteria.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {tab === 'profile' && (
            <div className="rounded-2xl border border-zinc-800 bg-[#141414] p-6 space-y-6">
              <div className="border-b border-zinc-800 pb-4">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Studio Artist Profile
                </h3>
                <p className="text-xs text-zinc-400 mt-1">
                  Manage your studio accreditation, licensing, and B2B wholesale pricing tier.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl">
                <div>
                  <label className="text-xs font-semibold text-zinc-300 block mb-1">
                    Studio Name
                  </label>
                  <input
                    type="text"
                    defaultValue="Black Lotus Tattoo Atelier"
                    className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-zinc-300 block mb-1">
                    Resident Tattooist
                  </label>
                  <input
                    type="text"
                    defaultValue="Marcus Vance"
                    className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-zinc-300 block mb-1">
                    Contact Email
                  </label>
                  <input
                    type="email"
                    defaultValue="artist@blacklotus.studio"
                    className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-zinc-300 block mb-1">
                    Studio Phone
                  </label>
                  <input
                    type="tel"
                    defaultValue="+1 (213) 555-0199"
                    className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  className="rounded-xl bg-[#E50914] px-5 py-2.5 text-xs font-bold text-white hover:bg-red-600 transition cursor-pointer"
                >
                  Save Studio Changes
                </button>
              </div>
            </div>
          )}

          {tab === 'addresses' && (
            <div className="rounded-2xl border border-zinc-800 bg-[#141414] p-6 space-y-6">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                    Studio Address Book
                  </h3>
                  <p className="text-xs text-zinc-400 mt-1">
                    Verified dispatch destinations for tattoo supplies and hardware.
                  </p>
                </div>
                <button
                  type="button"
                  className="rounded-xl bg-zinc-800 border border-zinc-700 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-zinc-700 transition"
                >
                  + Add Address
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="rounded-xl border border-zinc-800 bg-[#161616] p-4 text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white">Primary Studio Atelier</span>
                    <span className="rounded bg-red-600/10 text-[#E50914] text-[10px] font-bold px-2 py-0.5 border border-red-600/20">
                      Default
                    </span>
                  </div>
                  <p className="text-zinc-300">Marcus Vance</p>
                  <p className="text-zinc-400">742 Evergreen Terrace, Suite 204</p>
                  <p className="text-zinc-400">Los Angeles, CA 90001, United States</p>
                  <p className="text-zinc-500 font-mono pt-1">+1 (213) 555-0199</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
