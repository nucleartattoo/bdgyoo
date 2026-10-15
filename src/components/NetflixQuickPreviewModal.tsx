import { Link } from '@tanstack/react-router'
import { Check, ExternalLink, Plus, ShieldCheck, ShoppingBag, Truck, X, Zap } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useCart } from '~/lib/cart'
import type { CatalogProduct, ProductChildVariant } from '~/lib/catalog'
import { formatPrice } from '~/lib/utils'

interface NetflixQuickPreviewModalProps {
  product: CatalogProduct | null
  onClose: () => void
}

export function NetflixQuickPreviewModal({ product, onClose }: NetflixQuickPreviewModalProps) {
  if (!product) return null

  const { addItem } = useCart()
  const [selectedChild, setSelectedChild] = useState<ProductChildVariant | null>(() => {
    return product.children && product.children.length > 0 ? product.children[0] : null
  })
  const [activeImage, setActiveImage] = useState(product.image)
  const [added, setAdded] = useState(false)

  // Sync state when product changes
  useEffect(() => {
    setSelectedChild(product.children && product.children.length > 0 ? product.children[0] : null)
    setActiveImage(product.image)
    setAdded(false)
  }, [product])

  // ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  const currentPrice = selectedChild?.price || product.price
  const currentSku = selectedChild?.sku || product.sku
  const currentName = selectedChild?.name || product.name

  const handleAdd = () => {
    addItem({
      productId: product.id,
      slug: product.slug,
      sku: currentSku,
      name: currentName,
      price: currentPrice,
      image: activeImage,
      options: selectedChild ? [{ label: 'Variant', value: selectedChild.name }] : [],
      quantity: 1,
    })
    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 lg:p-8 overflow-y-auto">
      {/* Backdrop */}
      <button
        type="button"
        className="fixed inset-0 bg-black/85 backdrop-blur-md transition-opacity border-0 cursor-default w-full h-full"
        onClick={onClose}
        aria-label="Close modal backdrop"
      />

      {/* Modal Dialog Card */}
      <div
        role="dialog"
        aria-modal="true"
        className="relative z-10 w-full max-w-4xl overflow-hidden rounded-xl border border-zinc-700 bg-[#181818] text-white shadow-2xl transition-all"
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 z-30 flex h-9 w-9 items-center justify-center rounded-full bg-black/70 text-zinc-300 hover:bg-white hover:text-black transition cursor-pointer backdrop-blur-md"
          aria-label="Close Preview"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Hero Banner Area */}
        <div className="relative aspect-[16/9] sm:aspect-[21/9] w-full bg-zinc-950 overflow-hidden flex items-center justify-center">
          <div className="absolute inset-0 bg-gradient-to-t from-[#181818] via-transparent to-black/30 z-10" />

          {activeImage ? (
            <img
              src={activeImage}
              alt={currentName}
              className="h-full w-full object-contain filter contrast-105 p-6"
            />
          ) : (
            <ShoppingBag className="h-16 w-16 text-zinc-800" />
          )}

          {/* Quick Floating Title on Banner */}
          <div className="absolute bottom-6 left-6 right-6 z-20 space-y-2">
            <span className="inline-block rounded bg-[#E50914] px-2 py-0.5 text-[10px] font-black tracking-wider text-white uppercase">
              STUDIO EDITION
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight line-clamp-1 drop-shadow-md">
              {product.name}
            </h2>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-8 space-y-6">
          {/* Main Controls Row: Price & Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-6">
            <div>
              <div className="flex items-baseline gap-3">
                <span className="text-3xl font-black text-white">{formatPrice(currentPrice)}</span>
                {product.special_price && (
                  <span className="text-base text-zinc-500 line-through">
                    {formatPrice(product.special_price)}
                  </span>
                )}
                <span className="text-xs font-semibold text-emerald-400">
                  In Stock & Ready to Ship
                </span>
              </div>
              <p className="text-xs text-zinc-400 font-mono mt-1">
                SKU: <span className="text-zinc-200">{currentSku}</span>
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleAdd}
                className={`flex items-center gap-2 rounded-lg px-6 py-3 text-xs font-black transition cursor-pointer ${
                  added
                    ? 'bg-emerald-500 text-black'
                    : 'bg-white text-black hover:bg-white/90 active:scale-95'
                }`}
              >
                {added ? (
                  <>
                    <Check className="h-4 w-4 stroke-[3]" />
                    <span>Added to Cart</span>
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 stroke-[3]" />
                    <span>Add to Bag</span>
                  </>
                )}
              </button>

              <Link
                to="/products/$slug"
                params={{ slug: product.slug }}
                className="flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800/80 px-4 py-3 text-xs font-bold text-zinc-200 hover:bg-zinc-700 hover:text-white transition"
              >
                <span>Full Details</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>

          {/* Child Variants / Options Selector if available */}
          {product.children && product.children.length > 0 && (
            <div className="space-y-3">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                Select Configuration / Variant ({product.children.length} options)
              </label>
              <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto pr-1">
                {product.children.map((child) => {
                  const isSelected = selectedChild?.id === child.id
                  return (
                    <button
                      key={child.id}
                      type="button"
                      onClick={() => setSelectedChild(child)}
                      className={`rounded-md px-3 py-1.5 text-xs font-medium transition cursor-pointer border ${
                        isSelected
                          ? 'border-amber-400 bg-amber-400/10 text-amber-300 font-bold'
                          : 'border-zinc-800 bg-zinc-900 text-zinc-300 hover:border-zinc-600 hover:text-white'
                      }`}
                    >
                      <span>{child.name}</span>
                      <span className="ml-1.5 text-zinc-500 font-mono">${child.price}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Studio Specs & Quality Assurance Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-2">
            <div className="rounded-lg border border-zinc-800/80 bg-zinc-900/50 p-3">
              <span className="text-zinc-500 block text-[10px] uppercase font-bold">
                Motor Type
              </span>
              <span className="text-zinc-200 font-medium">Custom Coreless</span>
            </div>
            <div className="rounded-lg border border-zinc-800/80 bg-zinc-900/50 p-3">
              <span className="text-zinc-500 block text-[10px] uppercase font-bold">
                Stroke Spec
              </span>
              <span className="text-zinc-200 font-medium">4.0mm / Adjustable</span>
            </div>
            <div className="rounded-lg border border-zinc-800/80 bg-zinc-900/50 p-3">
              <span className="text-zinc-500 block text-[10px] uppercase font-bold">
                Needle System
              </span>
              <span className="text-zinc-200 font-medium">Universal Cartridge</span>
            </div>
            <div className="rounded-lg border border-zinc-800/80 bg-zinc-900/50 p-3">
              <span className="text-zinc-500 block text-[10px] uppercase font-bold">Warranty</span>
              <span className="text-emerald-400 font-medium">1-Year Studio Cover</span>
            </div>
          </div>

          {/* Description Snippet */}
          <div className="text-xs leading-relaxed text-zinc-400">
            <p className="line-clamp-4">
              {product.short_description ||
                product.description ||
                'Professional grade tattoo hardware crafted for high stability, clean needle drive, and low skin trauma.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
