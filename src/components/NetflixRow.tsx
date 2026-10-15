import { Link } from '@tanstack/react-router'
import { Check, ChevronLeft, ChevronRight, Eye, Plus, ShoppingBag, Sparkles } from 'lucide-react'
import { useRef, useState } from 'react'
import { useCart } from '~/lib/cart'
import type { CatalogProduct } from '~/lib/catalog'
import { formatPrice } from '~/lib/utils'

interface NetflixRowProps {
  title: string
  subtitle?: string
  categorySlug?: string
  products: CatalogProduct[]
  isRanked?: boolean
  onOpenPreview: (product: CatalogProduct) => void
}

export function NetflixRow({
  title,
  subtitle,
  categorySlug,
  products,
  isRanked = false,
  onOpenPreview,
}: NetflixRowProps) {
  const rowRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)
  const { addItem } = useCart()
  const [addedSku, setAddedSku] = useState<string | null>(null)

  const checkScroll = () => {
    if (!rowRef.current) return
    const { scrollLeft, scrollWidth, clientWidth } = rowRef.current
    setCanScrollLeft(scrollLeft > 10)
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 10)
  }

  const scroll = (direction: 'left' | 'right') => {
    if (!rowRef.current) return
    const offset = rowRef.current.clientWidth * 0.75
    rowRef.current.scrollBy({
      left: direction === 'left' ? -offset : offset,
      behavior: 'smooth',
    })
    setTimeout(checkScroll, 350)
  }

  const handleQuickAdd = (e: React.MouseEvent, product: CatalogProduct) => {
    e.preventDefault()
    e.stopPropagation()
    addItem({
      productId: product.id,
      slug: product.slug,
      sku: product.sku,
      name: product.name,
      price: product.price,
      image: product.image,
      options: [],
      quantity: 1,
    })
    setAddedSku(product.sku)
    setTimeout(() => setAddedSku(null), 1800)
  }

  if (!products || products.length === 0) return null

  return (
    <div className="relative group/row space-y-3 px-4 sm:px-6 lg:px-8">
      {/* Row Header */}
      <div className="flex items-baseline justify-between">
        <div>
          <h2 className="text-lg sm:text-xl font-bold tracking-tight text-zinc-100 flex items-center gap-2">
            <span>{title}</span>
            {isRanked && (
              <span className="text-[10px] uppercase font-black tracking-wider text-[#E50914] bg-red-500/10 border border-red-500/30 px-1.5 py-0.5 rounded">
                TOP 10
              </span>
            )}
          </h2>
          {subtitle && <p className="text-xs text-zinc-400 mt-0.5">{subtitle}</p>}
        </div>

        {categorySlug && (
          <Link
            to="/categories/$slug"
            params={{ slug: categorySlug }}
            className="text-xs font-semibold text-zinc-400 hover:text-white transition flex items-center gap-1 group/more"
          >
            <span>Explore All</span>
            <ChevronRight className="h-3 w-3 group-hover/more:translate-x-0.5 transition" />
          </Link>
        )}
      </div>

      {/* Row Slider Container */}
      <div className="relative">
        {/* Left Arrow Button */}
        {canScrollLeft && (
          <button
            type="button"
            onClick={() => scroll('left')}
            className="absolute left-0 top-0 bottom-0 z-30 w-10 sm:w-12 bg-black/70 hover:bg-black/90 backdrop-blur-xs flex items-center justify-center text-white transition duration-200 opacity-0 group-hover/row:opacity-100 cursor-pointer"
            aria-label="Scroll Left"
          >
            <ChevronLeft className="h-7 w-7 text-white" />
          </button>
        )}

        {/* Scrollable Track */}
        <div
          ref={rowRef}
          onScroll={checkScroll}
          className="flex gap-4 overflow-x-auto no-scrollbar scroll-smooth py-3"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {products.map((product, idx) => {
            const isAdded = addedSku === product.sku
            return (
              <div
                key={product.id}
                className={`flex-none group/card relative select-none transition-all duration-300 ${
                  isRanked ? 'w-64 sm:w-72 flex items-center' : 'w-48 sm:w-56 md:w-64'
                }`}
              >
                {/* Netflix Iconic Oversized Rank Number for Top 10 */}
                {isRanked && (
                  <div className="flex-none -mr-4 sm:-mr-6 z-10 select-none pointer-events-none">
                    <span
                      className="text-7xl sm:text-8xl md:text-9xl font-black italic tracking-tighter leading-none"
                      style={{
                        WebkitTextStroke: '2.5px #52525b',
                        color: '#09090b',
                        fontFamily: 'impact, sans-serif',
                      }}
                    >
                      {idx + 1}
                    </span>
                  </div>
                )}

                {/* Product Card Body */}
                <div className="w-full flex-1 overflow-hidden rounded-md border border-zinc-800/90 bg-[#181818] transition duration-300 hover:border-zinc-500 hover:scale-[1.04] hover:shadow-2xl hover:shadow-black/80 flex flex-col justify-between">
                  {/* Thumbnail Container */}
                  <div className="relative aspect-[4/3] bg-zinc-950 overflow-hidden flex items-center justify-center p-3">
                    {product.image ? (
                      <img
                        src={product.image}
                        alt={product.name}
                        className="h-full w-full object-contain filter group-hover/card:brightness-105 transition duration-300"
                        loading="lazy"
                      />
                    ) : (
                      <ShoppingBag className="h-10 w-10 text-zinc-700" />
                    )}

                    {/* Quick Preview Hover Overlay */}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/card:opacity-100 transition duration-200 flex items-center justify-center gap-2 p-2 backdrop-blur-2xs">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault()
                          onOpenPreview(product)
                        }}
                        className="rounded-full bg-white/20 p-2.5 text-white hover:bg-white hover:text-black transition backdrop-blur-md cursor-pointer"
                        title="Quick View"
                      >
                        <Eye className="h-4 w-4" />
                      </button>

                      <button
                        type="button"
                        onClick={(e) => handleQuickAdd(e, product)}
                        className={`rounded-full p-2.5 transition backdrop-blur-md cursor-pointer ${
                          isAdded
                            ? 'bg-emerald-500 text-black'
                            : 'bg-amber-500 text-black hover:bg-amber-400'
                        }`}
                        title="Add to Cart"
                      >
                        {isAdded ? (
                          <Check className="h-4 w-4 stroke-[3]" />
                        ) : (
                          <Plus className="h-4 w-4 stroke-[3]" />
                        )}
                      </button>
                    </div>

                    {/* Special Price Tag */}
                    {product.special_price && (
                      <span className="absolute top-2 left-2 rounded bg-[#E50914] px-1.5 py-0.5 text-[9px] font-black uppercase text-white">
                        SALE
                      </span>
                    )}
                  </div>

                  {/* Card Info Details */}
                  <div className="p-3 space-y-1.5 bg-[#181818]">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-emerald-400 font-bold">98% Match</span>
                      <span className="text-zinc-500 font-mono">{product.sku}</span>
                    </div>

                    <Link
                      to="/products/$slug"
                      params={{ slug: product.slug }}
                      className="block text-xs font-bold text-zinc-100 line-clamp-1 hover:text-amber-400 transition"
                      title={product.name}
                    >
                      {product.name}
                    </Link>

                    {/* Price and Action Line */}
                    <div className="flex items-center justify-between pt-1 border-t border-zinc-800">
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-xs font-black text-white">
                          {formatPrice(product.price)}
                        </span>
                        {product.special_price && (
                          <span className="text-[10px] text-zinc-500 line-through">
                            {formatPrice(product.special_price)}
                          </span>
                        )}
                      </div>

                      <span className="text-[10px] font-semibold text-zinc-400">
                        {product.options && product.options.length > 0
                          ? `${product.children?.length || product.options[0].values.length} styles`
                          : 'In Stock'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Right Arrow Button */}
        {canScrollRight && (
          <button
            type="button"
            onClick={() => scroll('right')}
            className="absolute right-0 top-0 bottom-0 z-30 w-10 sm:w-12 bg-black/70 hover:bg-black/90 backdrop-blur-xs flex items-center justify-center text-white transition duration-200 opacity-0 group-hover/row:opacity-100 cursor-pointer"
            aria-label="Scroll Right"
          >
            <ChevronRight className="h-7 w-7 text-white" />
          </button>
        )}
      </div>
    </div>
  )
}
