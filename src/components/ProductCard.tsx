import { Link } from '@tanstack/react-router'
import { Package } from 'lucide-react'
import { useState } from 'react'
import type { CatalogProduct } from '~/lib/catalog'
import type { Product } from '~/lib/saleor/types'
import { formatPrice } from '~/lib/utils'

interface ProductCardProps {
  product: CatalogProduct | Product
}

export function ProductCard({ product }: ProductCardProps) {
  // Extract fields whether CatalogProduct or Saleor Product
  const isCatalogProduct = 'gallery' in product

  const name = product.name
  const slug = product.slug
  const rawImage = isCatalogProduct ? product.image : product.thumbnail?.url
  const categoryName = isCatalogProduct ? undefined : product.category?.name
  const priceValue = isCatalogProduct
    ? product.price
    : product.pricing?.priceRange?.start?.gross?.amount || 0

  const [imgSrc, setImgSrc] = useState<string | null>(rawImage || null)

  const formattedPrice = formatPrice(priceValue)

  return (
    <Link
      to="/products/$slug"
      params={{ slug }}
      className="group flex flex-col overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 transition duration-200 hover:border-zinc-700 hover:bg-zinc-800/50"
    >
      {/* Product Image */}
      <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-zinc-950 flex items-center justify-center">
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
      </div>

      {/* Info */}
      <div className="mt-4 flex flex-1 flex-col justify-between">
        <div>
          {categoryName && (
            <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-500">
              {categoryName}
            </span>
          )}
          <h3 className="mt-1 line-clamp-2 text-sm font-medium text-zinc-100 group-hover:text-amber-400">
            {name}
          </h3>
        </div>

        <div className="mt-3 flex items-center justify-between">
          <span className="text-base font-bold text-white">{formattedPrice}</span>
          <span className="rounded bg-zinc-800 px-2 py-1 text-[11px] font-medium text-zinc-300 group-hover:bg-amber-500 group-hover:text-black">
            View
          </span>
        </div>
      </div>
    </Link>
  )
}
