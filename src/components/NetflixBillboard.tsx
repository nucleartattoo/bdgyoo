import { Link } from '@tanstack/react-router'
import { Check, Info, Play, ShoppingBag, Sparkles, Star, Zap } from 'lucide-react'
import { useState } from 'react'
import type { CatalogProduct } from '~/lib/catalog'
import { useCart } from '~/lib/cart'
import { formatPrice } from '~/lib/utils'

interface NetflixBillboardProps {
  product: CatalogProduct
  onOpenPreview: (product: CatalogProduct) => void
}

export function NetflixBillboard({ product, onOpenPreview }: NetflixBillboardProps) {
  const { addItem } = useCart()
  const [added, setAdded] = useState(false)

  const handleQuickAdd = () => {
    addItem({
      id: product.id,
      sku: product.sku,
      name: product.name,
      price: product.price,
      image: product.image,
      quantity: 1,
    })
    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
  }

  return (
    <div className="relative w-full overflow-hidden bg-[#141414] text-white">
      {/* Background Ambient Glow & Spotlight Vignette */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-r from-[#141414] via-[#141414]/80 to-transparent z-10" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-transparent to-black/40 z-10" />
        <div className="absolute -right-10 top-0 h-full w-2/3 bg-radial from-amber-500/10 via-rose-500/5 to-transparent blur-3xl opacity-70" />

        {/* Cinematic Backdrop Image */}
        {product.image && (
          <img
            src={product.image}
            alt={product.name}
            className="absolute right-0 top-0 h-full w-3/5 object-cover object-center opacity-45 mix-blend-lighten filter brightness-90 contrast-110"
          />
        )}
      </div>

      {/* Billboard Content */}
      <div className="relative z-20 mx-auto max-w-7xl px-4 pt-20 pb-28 sm:px-6 sm:pt-28 sm:pb-36 lg:px-8">
        <div className="max-w-2xl space-y-6">
          {/* Top Badge: Netflix Red Ranking / Series Label */}
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 rounded bg-[#E50914] px-2.5 py-0.5 text-[11px] font-black tracking-wider uppercase text-white shadow-lg shadow-red-900/40">
              <Zap className="h-3 w-3 fill-current" /> BDGY EXCLUSIVE
            </span>
            <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-300">
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-amber-400 text-black text-[9px] font-black">
                ★
              </span>
              <span>#1 in Professional Wireless Machines</span>
            </div>
          </div>

          {/* Cinematic Title */}
          <h1 className="text-4xl font-black tracking-tight text-white sm:text-5xl lg:text-6xl uppercase leading-none drop-shadow-md">
            {product.name}
          </h1>

          {/* Specs Highlights Pill Bar */}
          <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
            <span className="rounded border border-emerald-500/40 bg-emerald-500/10 px-2 py-0.5 font-bold text-emerald-400">
              98% Recommended
            </span>
            <span className="rounded border border-zinc-700 bg-zinc-800/80 px-2 py-0.5 font-mono text-zinc-300">
              4.0mm Stroke
            </span>
            <span className="rounded border border-zinc-700 bg-zinc-800/80 px-2 py-0.5 font-mono text-zinc-300">
              Japan Coreless Motor
            </span>
            <span className="rounded border border-zinc-700 bg-zinc-800/80 px-2 py-0.5 font-mono text-zinc-300">
              2400mAh Li-ion
            </span>
            <span className="rounded border border-red-500/40 bg-red-500/10 px-1.5 py-0.5 text-[10px] font-bold text-red-400 uppercase">
              18+ Pro Studio
            </span>
          </div>

          {/* Description */}
          <p className="text-sm leading-relaxed text-zinc-300 sm:text-base line-clamp-3 max-w-xl">
            {product.short_description ||
              'Engineered for relentless endurance, precision needle driving, and seamless wireless freedom. Features custom Japanese coreless motor technology with ultra-low vibration.'}
          </p>

          {/* Price Bar */}
          <div className="flex items-baseline gap-3 pt-2">
            <span className="text-3xl font-black text-white">
              {formatPrice(product.price)}
            </span>
            {product.special_price && (
              <span className="text-base text-zinc-500 line-through">
                {formatPrice(product.special_price)}
              </span>
            )}
            <span className="text-xs text-amber-400 font-semibold uppercase tracking-wider">
              Free Express Shipping Included
            </span>
          </div>

          {/* Action CTAs: Netflix "Play" & "More Info" Style */}
          <div className="flex flex-wrap items-center gap-3 pt-4">
            <button
              type="button"
              onClick={handleQuickAdd}
              className={`flex items-center gap-2.5 rounded-md px-7 py-3 text-sm font-bold transition duration-200 cursor-pointer ${
                added
                  ? 'bg-emerald-500 text-black'
                  : 'bg-white text-black hover:bg-white/90 active:scale-95'
              }`}
            >
              {added ? (
                <>
                  <Check className="h-5 w-5 stroke-[2.5]" />
                  <span>Added to Bag!</span>
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 fill-black stroke-none" />
                  <span>Quick Order Now</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => onOpenPreview(product)}
              className="flex items-center gap-2 rounded-md bg-zinc-700/80 px-6 py-3 text-sm font-bold text-white backdrop-blur-md transition duration-200 hover:bg-zinc-600/80 active:scale-95 cursor-pointer"
            >
              <Info className="h-5 w-5 text-zinc-300" />
              <span>More Specs & Media</span>
            </button>

            <Link
              to="/products/$slug"
              params={{ slug: product.slug }}
              className="text-xs font-semibold text-zinc-400 hover:text-white transition ml-2 underline underline-offset-4"
            >
              Full Product Detail Page →
            </Link>
          </div>
        </div>
      </div>

      {/* Bottom Fade Gradient for Seamless Transition into Shelf Rows */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[#141414] to-transparent pointer-events-none" />
    </div>
  )
}
