import { Link } from '@tanstack/react-router'
import { Eye, Package, Plus, ShoppingBag } from 'lucide-react'
import { useState } from 'react'
import { useCart } from '~/lib/cart'
import type { CatalogProduct } from '~/lib/catalog'
import type { Product } from '~/lib/saleor/types'
import { formatPrice } from '~/lib/utils'

interface ProductCardProps {
  product: CatalogProduct | Product
  onPreview?: (product: CatalogProduct) => void
}

export function ProductCard({ product, onPreview }: ProductCardProps) {
  const isCatalogProduct = 'gallery' in product

  const name = product.name
  const slug = product.slug
  const sku = isCatalogProduct ? product.sku : product.id
  const rawImage = isCatalogProduct ? product.image : product.thumbnail?.url
  const categoryName = isCatalogProduct ? undefined : product.category?.name
  const priceValue = isCatalogProduct
    ? product.price
    : product.pricing?.priceRange?.start?.gross?.amount || 0

  const [imgSrc, setImgSrc] = useState<string | null>(rawImage || null)
  const { addItem } = useCart()
  const [added, setAdded] = useState(false)

  const formattedPrice = formatPrice(priceValue)

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    addItem({
      productId: isCatalogProduct ? product.id : product.id,
      slug,
      sku,
      name,
      price: priceValue,
      image: imgSrc || '',
      options: [],
      quantity: 1,
    })
    setAdded(true)
    setTimeout(() => setAdded(false), 1800)
  }

  const handlePreviewClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (onPreview && isCatalogProduct) {
      onPreview(product as CatalogProduct)
    }
  }

  return (
    <Link
      to="/products/$slug"
      params={{ slug }}
      className="group relative flex flex-col overflow-hidden rounded-xl border border-zinc-800 bg-[#161616] p-4 transition-all duration-300 hover:scale-[1.02] hover:border-zinc-700 hover:bg-[#1a1a1a] hover:shadow-xl hover:shadow-black/60"
    >
      {/* Product Image */}
      <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-black flex items-center justify-center">
        {imgSrc ? (
          <img
            src={imgSrc}
            alt={name}
            onError={() => setImgSrc(null)}
            className="h-full w-full object-contain p-2 transition duration-300 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center text-zinc-600 gap-1">
            <Package className="h-8 w-8 text-zinc-700" />
            <span className="text-[10px] text-zinc-500 font-medium">Studio Equipment</span>
          </div>
        )}

        {/* Floating Quick Action Overlay on Hover */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-2 backdrop-blur-[2px]">
          {onPreview && isCatalogProduct && (
            <button
              type="button"
              onClick={handlePreviewClick}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-black hover:bg-white transition shadow-lg cursor-pointer transform hover:scale-110 active:scale-95"
              aria-label={`Preview ${name}`}
              title="Quick Studio Preview"
            >
              <Eye className="h-4 w-4" />
            </button>
          )}

          <button
            type="button"
            onClick={handleQuickAdd}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-[#E50914] text-white hover:bg-red-600 transition shadow-lg cursor-pointer transform hover:scale-110 active:scale-95"
            aria-label={`Quick add ${name} to cart`}
            title="Quick Order"
          >
            {added ? <ShoppingBag className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Info */}
      <div className="mt-4 flex flex-1 flex-col justify-between">
        <div>
          {categoryName && (
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#E50914]">
              {categoryName}
            </span>
          )}
          <h3 className="mt-1 line-clamp-2 text-sm font-semibold text-zinc-200 group-hover:text-red-400 transition-colors">
            {name}
          </h3>
        </div>

        <div className="mt-4 flex items-center justify-between pt-2 border-t border-zinc-800/80">
          <div>
            <span className="text-base font-black text-white">{formattedPrice}</span>
            <span className="block text-[10px] text-emerald-400 font-medium">In Stock</span>
          </div>
          <span className="rounded-lg bg-zinc-800 px-2.5 py-1 text-xs font-semibold text-zinc-300 group-hover:bg-[#E50914] group-hover:text-white transition">
            Details
          </span>
        </div>
      </div>
    </Link>
  )
}
