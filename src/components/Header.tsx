import { Link } from '@tanstack/react-router'
import {
  ChevronRight,
  Command,
  Menu,
  Package,
  Search,
  ShoppingBag,
  Sparkles,
  User,
  X,
  Zap,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useCart } from '~/lib/cart'
import { type CatalogProduct, getTopCategories, searchProducts } from '~/lib/catalog'
import { formatPrice } from '~/lib/utils'

export function Header() {
  const topCategories = getTopCategories()
  const { totalItems } = useCart()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<CatalogProduct[]>([])
  const inputRef = useRef<HTMLInputElement>(null)

  // ⌘K / Ctrl+K keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setSearchOpen((prev) => !prev)
      } else if (e.key === 'Escape') {
        setSearchOpen(false)
        setMobileMenuOpen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  useEffect(() => {
    if (searchQuery.trim().length > 1) {
      setSearchResults(searchProducts(searchQuery, 8))
    } else {
      setSearchResults([])
    }
  }, [searchQuery])

  useEffect(() => {
    if (searchOpen) {
      setTimeout(() => inputRef.current?.focus(), 60)
    }
  }, [searchOpen])

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-zinc-800/80 bg-[#141414]/95 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Brand Logo & Mobile Trigger */}
          <div className="flex items-center gap-4 lg:gap-8">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden rounded-lg p-2 text-zinc-400 hover:bg-zinc-800 hover:text-white"
              aria-label="Open mobile navigation menu"
            >
              <Menu className="h-5 w-5" />
            </button>

            <Link
              to="/"
              className="flex items-center gap-2 text-xl font-black tracking-tighter text-white group"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded bg-[#E50914] font-black text-white shadow-md shadow-red-900/50 group-hover:scale-105 transition-transform text-sm">
                B
              </span>
              <span className="tracking-widest uppercase font-black text-[#E50914] text-lg">
                BDGY
              </span>
            </Link>

            {/* Desktop Top Navigation */}
            <nav className="hidden lg:flex items-center gap-6">
              <Link
                to="/"
                className="text-xs font-bold uppercase tracking-wider text-zinc-300 transition-colors hover:text-white"
                activeProps={{ className: 'text-white font-extrabold' }}
              >
                Home
              </Link>
              <Link
                to="/categories/$slug"
                params={{ slug: 'tattoo-machines' }}
                className="text-xs font-semibold uppercase tracking-wider text-zinc-400 transition-colors hover:text-white"
                activeProps={{ className: 'text-white font-bold' }}
              >
                Wireless Machines
              </Link>
              <Link
                to="/categories/$slug"
                params={{ slug: 'tattoo-needles' }}
                className="text-xs font-semibold uppercase tracking-wider text-zinc-400 transition-colors hover:text-white"
                activeProps={{ className: 'text-white font-bold' }}
              >
                Needles
              </Link>
              <Link
                to="/categories/$slug"
                params={{ slug: 'tattoo-power-supply' }}
                className="text-xs font-semibold uppercase tracking-wider text-zinc-400 transition-colors hover:text-white"
                activeProps={{ className: 'text-white font-bold' }}
              >
                Power
              </Link>
              <Link
                to="/categories/$slug"
                params={{ slug: 'tattoo-kit' }}
                className="text-xs font-semibold uppercase tracking-wider text-zinc-400 transition-colors hover:text-white"
                activeProps={{ className: 'text-white font-bold' }}
              >
                Kits
              </Link>

              <Link
                to="/saleor"
                className="flex items-center gap-1.5 rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1 text-xs font-semibold text-red-400 hover:bg-red-500/20 hover:border-red-400 transition"
                activeProps={{ className: 'border-red-400 bg-red-500/25 text-white' }}
              >
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Saleor Live
              </Link>
            </nav>
          </div>

          {/* Action icons */}
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Search quick button */}
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="hidden sm:flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900/80 px-3.5 py-1.5 text-xs text-zinc-400 hover:border-zinc-700 hover:text-white transition"
              aria-label="Quick search"
            >
              <Search className="h-3.5 w-3.5 text-amber-500" />
              <span>Search products...</span>
              <kbd className="rounded border border-zinc-700 bg-zinc-800 px-1.5 py-0.5 text-[10px] font-mono text-zinc-400">
                ⌘K
              </kbd>
            </button>

            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="sm:hidden rounded-full p-2 text-zinc-400 transition hover:bg-zinc-800 hover:text-white"
              aria-label="Search"
            >
              <Search className="h-5 w-5" />
            </button>

            <Link
              to="/account"
              className="rounded-full p-2 text-zinc-400 transition hover:bg-zinc-800 hover:text-white"
              aria-label="Account"
            >
              <User className="h-5 w-5" />
            </Link>

            <Link
              to="/cart"
              className="relative flex items-center gap-2 rounded-full bg-zinc-800 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-zinc-700"
            >
              <ShoppingBag className="h-4 w-4 text-amber-400" />
              <span className="hidden sm:inline">Cart</span>
              <span
                className={`rounded-full px-1.5 py-0.2 text-[11px] font-bold transition ${
                  totalItems > 0 ? 'bg-amber-500 text-black shadow-sm' : 'bg-zinc-700 text-zinc-300'
                }`}
              >
                {totalItems}
              </span>
            </Link>
          </div>
        </div>
      </header>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
            onKeyDown={() => setMobileMenuOpen(false)}
            role="button"
            tabIndex={0}
            aria-label="Close menu backdrop"
          />

          {/* Drawer content */}
          <div className="fixed inset-y-0 left-0 w-full max-w-xs bg-zinc-950 border-r border-zinc-800 p-6 flex flex-col justify-between shadow-2xl z-10 overflow-y-auto">
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
                <Link
                  to="/"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 text-lg font-bold text-white"
                >
                  <span className="flex h-7 w-7 items-center justify-center rounded bg-amber-500 font-black text-black">
                    B
                  </span>
                  <span>BDGYOO</span>
                </Link>
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-white"
                  aria-label="Close menu"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Quick Search */}
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false)
                  setSearchOpen(true)
                }}
                className="w-full flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900/60 px-4 py-2.5 text-xs text-zinc-400 hover:border-zinc-700 hover:text-white"
              >
                <div className="flex items-center gap-2.5">
                  <Search className="h-4 w-4 text-amber-500" />
                  <span>Search 1,049 products...</span>
                </div>
                <ChevronRight className="h-4 w-4 text-zinc-600" />
              </button>

              {/* Category Links */}
              <div>
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-3">
                  Catalog Categories
                </h4>
                <div className="space-y-1">
                  {topCategories.map((cat) => (
                    <Link
                      key={cat.id}
                      to="/categories/$slug"
                      params={{ slug: cat.slug }}
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center justify-between rounded-lg px-3 py-2 text-xs font-medium text-zinc-300 hover:bg-zinc-900 hover:text-amber-400 transition"
                    >
                      <span>{cat.name}</span>
                      <span className="text-[10px] text-zinc-500 font-mono">
                        {cat.product_count}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>

              {/* Quick Pages */}
              <div>
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-3">
                  Studio Portal
                </h4>
                <div className="space-y-1">
                  <Link
                    to="/account"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 rounded-lg px-3 py-2 text-xs font-medium text-zinc-300 hover:bg-zinc-900 hover:text-white transition"
                  >
                    <User className="h-4 w-4 text-zinc-500" />
                    <span>My Studio Account</span>
                  </Link>
                  <Link
                    to="/cart"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-between rounded-lg px-3 py-2 text-xs font-medium text-zinc-300 hover:bg-zinc-900 hover:text-white transition"
                  >
                    <div className="flex items-center gap-3">
                      <ShoppingBag className="h-4 w-4 text-amber-400" />
                      <span>Shopping Cart</span>
                    </div>
                    {totalItems > 0 && (
                      <span className="rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-bold text-black">
                        {totalItems}
                      </span>
                    )}
                  </Link>
                  <Link
                    to="/saleor"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 rounded-lg px-3 py-2 text-xs font-medium text-amber-400 hover:bg-amber-500/10 transition"
                  >
                    <Zap className="h-4 w-4 text-amber-400" />
                    <span>Saleor Backend Status</span>
                  </Link>
                </div>
              </div>
            </div>

            {/* Drawer Footer */}
            <div className="border-t border-zinc-800 pt-4 mt-6 text-xs text-zinc-500 space-y-1">
              <p className="font-semibold text-zinc-400">BDGYOO Official Supply</p>
              <p className="text-[11px]">Powered by Saleor GraphQL & TanStack Start SSR</p>
            </div>
          </div>
        </div>
      )}

      {/* Interactive Search Modal */}
      {searchOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-2xl border border-zinc-800 bg-zinc-900 p-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-3 flex-1">
                <Search className="h-5 w-5 text-amber-500" />
                <input
                  ref={inputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search 1,049 products by name, SKU (e.g. Ambition, Storm, Needle, Wireless)..."
                  className="w-full bg-transparent text-sm text-white placeholder-zinc-500 focus:outline-none"
                />
              </div>
              <button
                type="button"
                onClick={() => {
                  setSearchOpen(false)
                  setSearchQuery('')
                }}
                className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-800 hover:text-white"
                aria-label="Close search"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Results */}
            <div className="mt-4 max-h-96 overflow-y-auto space-y-2">
              {searchResults.length > 0 ? (
                searchResults.map((product) => (
                  <Link
                    key={product.id}
                    to="/products/$slug"
                    params={{ slug: product.slug }}
                    onClick={() => {
                      setSearchOpen(false)
                      setSearchQuery('')
                    }}
                    className="flex items-center justify-between gap-4 rounded-xl border border-zinc-800/80 bg-zinc-950/60 p-3 hover:border-amber-500/50 hover:bg-zinc-800/60 transition"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center">
                        {product.image ? (
                          <img
                            src={product.image}
                            alt={product.name}
                            className="h-full w-full object-contain p-1"
                          />
                        ) : (
                          <Package className="h-5 w-5 text-zinc-600" />
                        )}
                      </div>
                      <div>
                        <h4 className="text-xs font-semibold text-white line-clamp-1">
                          {product.name}
                        </h4>
                        <span className="text-[10px] text-zinc-400 font-mono">
                          SKU: {product.sku}
                        </span>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-amber-400 whitespace-nowrap">
                      {formatPrice(product.price)}
                    </span>
                  </Link>
                ))
              ) : searchQuery.trim().length > 1 ? (
                <div className="py-8 text-center text-xs text-zinc-500">
                  No matching products found in the catalog.
                </div>
              ) : (
                <div className="py-6 text-center text-xs text-zinc-500 flex flex-col items-center gap-2">
                  <Command className="h-6 w-6 text-zinc-700" />
                  <span>Type at least 2 characters to search across all 1,049 products.</span>
                  <span className="text-[11px] text-zinc-600">
                    Pro-tip: Press <kbd className="font-mono text-zinc-400">Esc</kbd> anytime to
                    close.
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
