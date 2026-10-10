import { createFileRoute } from '@tanstack/react-router'
import { Key, MapPin, Package, User } from 'lucide-react'
import { useState } from 'react'

export const Route = createFileRoute('/account')({
  component: AccountPage,
})

function AccountPage() {
  const [tab, setTab] = useState<'profile' | 'orders' | 'addresses'>('profile')

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      <div className="border-b border-zinc-800 pb-4">
        <h1 className="text-2xl font-bold text-white">Customer Account</h1>
        <p className="text-xs text-zinc-400 mt-1">
          Manage your BDGY studio profile, orders, and shipping addresses.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
        {/* Navigation Tabs */}
        <div className="space-y-1">
          <button
            type="button"
            onClick={() => setTab('profile')}
            className={`flex w-full items-center gap-3 rounded-lg px-4 py-2.5 text-xs font-semibold transition ${
              tab === 'profile'
                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                : 'text-zinc-400 hover:bg-zinc-900 hover:text-white'
            }`}
          >
            <User className="h-4 w-4" /> Profile & Login
          </button>
          <button
            type="button"
            onClick={() => setTab('orders')}
            className={`flex w-full items-center gap-3 rounded-lg px-4 py-2.5 text-xs font-semibold transition ${
              tab === 'orders'
                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                : 'text-zinc-400 hover:bg-zinc-900 hover:text-white'
            }`}
          >
            <Package className="h-4 w-4" /> Order History
          </button>
          <button
            type="button"
            onClick={() => setTab('addresses')}
            className={`flex w-full items-center gap-3 rounded-lg px-4 py-2.5 text-xs font-semibold transition ${
              tab === 'addresses'
                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                : 'text-zinc-400 hover:bg-zinc-900 hover:text-white'
            }`}
          >
            <MapPin className="h-4 w-4" /> Address Book
          </button>
        </div>

        {/* Tab Content */}
        <div className="md:col-span-3 rounded-xl border border-zinc-800 bg-zinc-900/40 p-6">
          {tab === 'profile' && (
            <div className="space-y-6">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-white">
                Account Details
              </h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 max-w-xl">
                <div>
                  <label className="text-xs text-zinc-400 block mb-1">Full Name</label>
                  <input
                    type="text"
                    defaultValue="Studio Artist"
                    className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-white"
                  />
                </div>
                <div>
                  <label className="text-xs text-zinc-400 block mb-1">Email</label>
                  <input
                    type="email"
                    defaultValue="artist@bdgy-studio.com"
                    className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-white"
                  />
                </div>
              </div>
              <div className="pt-2">
                <button
                  type="button"
                  className="rounded-lg bg-amber-500 px-4 py-2 text-xs font-bold text-black hover:bg-amber-400"
                >
                  Save Changes
                </button>
              </div>
            </div>
          )}

          {tab === 'orders' && (
            <div className="space-y-4 text-center py-12">
              <Package className="mx-auto h-8 w-8 text-zinc-600" />
              <h4 className="text-sm font-medium text-white">No active orders yet</h4>
              <p className="text-xs text-zinc-500">
                Your past purchases from Saleor will appear here.
              </p>
            </div>
          )}

          {tab === 'addresses' && (
            <div className="space-y-4 text-center py-12">
              <MapPin className="mx-auto h-8 w-8 text-zinc-600" />
              <h4 className="text-sm font-medium text-white">No saved addresses</h4>
              <p className="text-xs text-zinc-500">
                Add shipping and billing addresses for rapid checkout.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
