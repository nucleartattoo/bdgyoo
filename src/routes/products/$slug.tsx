import { Link, createFileRoute } from '@tanstack/react-router'
import {
  AlertCircle,
  ArrowRight,
  Check,
  ChevronRight,
  Package,
  RotateCcw,
  Shield,
  ShoppingBag,
  Sparkles,
  Truck,
  X,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { useCart } from '~/lib/cart'
import { type CatalogProduct, type ProductChildVariant, getProductBySlug } from '~/lib/catalog'
import { formatPrice } from '~/lib/utils'

function findMatchingChild(
  product: CatalogProduct,
  selectedLabels: string[],
): ProductChildVariant | null {
  if (!product.children || product.children.length === 0) return null
  let bestChild: ProductChildVariant = product.children[0]
  let maxScore = -1

  for (const child of product.children) {
    let score = 0
    const haystack = `${child.name} ${child.sku}`.toLowerCase()

    for (const label of selectedLabels) {
      const clean = label.toLowerCase().trim()
      if (!clean) continue
      if (haystack.includes(clean)) {
        score += 100 + clean.length
      } else {
        const words = clean.split(/[\s\-_]+/).filter((w) => w.length > 1)
        for (const word of words) {
          if (haystack.includes(word)) {
            score += 10
          }
        }
      }
    }

    if (score > maxScore) {
      maxScore = score
      bestChild = child
    }
  }

  return bestChild
}

function getColorHex(label: string): string | null {
  const l = label.toLowerCase()
  if (l.includes('black')) return '#18181b'
  if (l.includes('rose red') || l.includes('rose')) return '#f43f5e'
  if (l.includes('red')) return '#ef4444'
  if (l.includes('silver') || l.includes('grey') || l.includes('gray')) return '#cbd5e1'
  if (l.includes('gold') || l.includes('golden') || l.includes('champagne')) return '#f59e0b'
  if (l.includes('blue')) return '#3b82f6'
  if (l.includes('green')) return '#10b981'
  if (l.includes('pink')) return '#ec4899'
  if (l.includes('purple')) return '#8b5cf6'
  return null
}

export const Route = createFileRoute('/products/$slug')({
  head: ({ params }) => {
    const product = getProductBySlug(params.slug)
    if (!product) {
      return {
        meta: [{ title: 'Product Not Found | BDGY Tattoo Supply' }],
      }
    }
    const title = `${product.name} | BDGY Professional Tattoo Supply`
    const description =
      product.short_description ||
      `Buy authentic ${product.name} (SKU: ${product.sku}) at BDGY Official Store with 24-hour dispatch and full warranty.`
    return {
      meta: [
        { title },
        { name: 'description', content: description },
        { property: 'og:title', content: title },
        { property: 'og:description', content: description },
        { property: 'og:image', content: product.image },
        { property: 'og:type', content: 'product' },
        { name: 'twitter:card', content: 'summary_large_image' },
      ],
      scripts: [
        {
          type: 'application/ld+json',
          children: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Product',
            name: product.name,
            image: product.gallery.length > 0 ? product.gallery : [product.image],
            description,
            sku: product.sku,
            offers: {
              '@type': 'Offer',
              price: product.price,
              priceCurrency: 'USD',
              availability: 'https://schema.org/InStock',
              url: `https://bdgyoo.com/products/${product.slug}`,
            },
          }),
        },
      ],
    }
  },
  component: ProductDetailPage,
})

function ProductDetailPage() {
  const { slug } = Route.useParams()
  const product = getProductBySlug(slug)

  if (!product) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-24 text-center space-y-4">
        <AlertCircle className="mx-auto h-12 w-12 text-zinc-600" />
        <h1 className="text-2xl font-bold text-white">Product Not Found</h1>
        <p className="text-sm text-zinc-400">
          The requested tattoo equipment could not be found in the BDGY catalog.
        </p>
        <div className="pt-4">
          <Link
            to="/"
            className="inline-flex rounded-lg bg-amber-500 px-6 py-2.5 text-xs font-bold text-black hover:bg-amber-400"
          >
            Return to Storefront
          </Link>
        </div>
      </div>
    )
  }

  // Gallery state
  const initialImages =
    product.gallery.length > 0 ? product.gallery : product.image ? [product.image] : []
  const [activeImage, setActiveImage] = useState<string | null>(initialImages[0] || null)

  // Variant selections: option_id -> selected_value_index
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {}
    for (const opt of product.options) {
      if (opt.values.length > 0) {
        initial[opt.id] = opt.values[0].index
      }
    }
    return initial
  })

  const { addItem } = useCart()
  const [quantity, setQuantity] = useState(1)
  const [toastItem, setToastItem] = useState<{
    name: string
    variantLabel: string
    price: number
    quantity: number
    image: string
  } | null>(null)

  // Reset state when navigating to a new product
  useEffect(() => {
    if (product) {
      const imgs =
        product.gallery.length > 0 ? product.gallery : product.image ? [product.image] : []
      setActiveImage(imgs[0] || null)
      const initial: Record<string, string> = {}
      for (const opt of product.options) {
        if (opt.values.length > 0) {
          initial[opt.id] = opt.values[0].index
        }
      }
      setSelectedOptions(initial)
      setQuantity(1)
      setToastItem(null)
    }
  }, [product])

  // Collect labels from current selections
  const selectedLabels = product.options
    .map((opt) => {
      const chosenValIndex = selectedOptions[opt.id]
      const chosenVal = opt.values.find((v) => v.index === chosenValIndex)
      return chosenVal ? chosenVal.label : ''
    })
    .filter(Boolean)

  // Dynamically resolve matched child variant
  const matchedChild = findMatchingChild(product, selectedLabels)

  const currentPrice =
    matchedChild?.price && matchedChild.price > 0 ? matchedChild.price : product.price
  const currentSku = matchedChild?.sku || product.sku
  const currentVariantName = matchedChild?.name || product.name

  const handleOptionChange = (optionId: string, valueIndex: string) => {
    setSelectedOptions((prev) => ({
      ...prev,
      [optionId]: valueIndex,
    }))
  }

  const handleAddToCart = () => {
    const formattedOptions = product.options.map((opt) => {
      const chosenValIndex = selectedOptions[opt.id]
      const chosenVal = opt.values.find((v) => v.index === chosenValIndex)
      return {
        label: opt.label,
        value: chosenVal ? chosenVal.label : chosenValIndex || 'Standard',
      }
    })

    const chosenImage = activeImage || product.image

    addItem(
      {
        productId: product.id,
        name: currentVariantName,
        slug: product.slug,
        sku: currentSku,
        image: chosenImage,
        price: currentPrice,
        options: formattedOptions,
      },
      quantity,
    )

    // Trigger visual toast
    setToastItem({
      name: currentVariantName,
      variantLabel: formattedOptions.map((o) => o.value).join(' / '),
      price: currentPrice,
      quantity,
      image: chosenImage,
    })

    setTimeout(() => {
      setToastItem(null)
    }, 4500)
  }

  return (
    <div className="relative mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-12">
      {/* Toast Notification Alert */}
      {toastItem && (
        <aside
          aria-label="Added to cart notification"
          className="fixed bottom-6 right-6 z-50 flex max-w-md items-center gap-4 rounded-2xl border border-amber-500/40 bg-zinc-900/95 p-4 shadow-2xl backdrop-blur-md animate-in slide-in-from-bottom-5 duration-300"
        >
          <div className="h-14 w-14 flex-shrink-0 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950 p-1 flex items-center justify-center">
            {toastItem.image ? (
              <img
                src={toastItem.image}
                alt={toastItem.name}
                className="h-full w-full object-contain"
              />
            ) : (
              <Package className="h-6 w-6 text-zinc-600" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
              <Check className="h-3.5 w-3.5" /> Added to your Cart
            </div>
            <p className="text-xs font-bold text-white truncate mt-0.5">{toastItem.name}</p>
            {toastItem.variantLabel && (
              <p className="text-[11px] text-zinc-400 truncate">{toastItem.variantLabel}</p>
            )}
            <div className="mt-1 flex items-center gap-3">
              <span className="text-xs font-bold text-amber-400">
                {toastItem.quantity} × {formatPrice(toastItem.price)}
              </span>
              <Link
                to="/cart"
                className="inline-flex items-center gap-1 text-xs font-bold text-white hover:text-amber-400 underline decoration-amber-500/50 underline-offset-2 transition"
              >
                View Cart <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setToastItem(null)}
            className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-800 hover:text-white"
            aria-label="Close notification"
          >
            <X className="h-4 w-4" />
          </button>
        </aside>
      )}

      {/* Breadcrumbs */}
      <nav
        aria-label="Breadcrumb"
        className="text-xs text-zinc-500 flex items-center gap-1.5 flex-wrap"
      >
        <Link to="/" className="hover:text-zinc-300">
          Home
        </Link>
        <ChevronRight className="h-3 w-3 text-zinc-600" />
        <Link
          to="/categories/$slug"
          params={{ slug: 'tattoo-machines' }}
          className="hover:text-zinc-300"
        >
          Catalog
        </Link>
        <ChevronRight className="h-3 w-3 text-zinc-600" />
        <span className="text-amber-400 font-medium truncate max-w-sm">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
        {/* Media Gallery */}
        <div className="space-y-4">
          <div className="relative aspect-square overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950 p-6 flex items-center justify-center">
            {activeImage ? (
              <img
                src={activeImage}
                alt={product.name}
                className="max-h-full max-w-full object-contain transition duration-200"
              />
            ) : (
              <div className="flex flex-col items-center justify-center text-zinc-600 gap-2">
                <Package className="h-16 w-16 text-zinc-700" />
                <span className="text-xs text-zinc-500">BDGY Professional Equipment</span>
              </div>
            )}

            {product.type === 'configurable' && (
              <span className="absolute top-4 left-4 inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-3 py-1 text-[11px] font-semibold text-amber-400 border border-amber-500/20 backdrop-blur-sm">
                <Sparkles className="h-3.5 w-3.5" /> Configurable Multi-Variant
              </span>
            )}
          </div>

          {/* Thumbnails */}
          {initialImages.length > 1 && (
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
              {initialImages.map((imgUrl, idx) => (
                <button
                  type="button"
                  key={imgUrl}
                  onClick={() => setActiveImage(imgUrl)}
                  className={`aspect-square overflow-hidden rounded-xl border p-1 bg-zinc-950 transition ${
                    activeImage === imgUrl
                      ? 'border-amber-500 ring-1 ring-amber-500'
                      : 'border-zinc-800 hover:border-zinc-700 opacity-70 hover:opacity-100'
                  }`}
                >
                  <img
                    src={imgUrl}
                    alt={`${product.name} view ${idx + 1}`}
                    className="h-full w-full object-contain"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Purchase Info & Variant Selector */}
        <div className="flex flex-col space-y-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400 flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                In Stock
              </span>
              <span className="text-zinc-500">•</span>
              <span className="text-xs font-mono text-zinc-400">SKU: {currentSku}</span>
            </div>

            <h1 className="mt-3 text-2xl font-bold tracking-tight text-white sm:text-3xl">
              {product.name}
            </h1>

            {product.short_description && (
              <p className="mt-2 text-sm text-zinc-400 leading-relaxed">
                {product.short_description}
              </p>
            )}

            <div className="mt-5 flex items-baseline gap-4">
              <span className="text-3xl font-extrabold text-white">
                {formatPrice(currentPrice)}
              </span>
              {currentPrice > 0 && (
                <>
                  <span className="text-sm text-zinc-500 line-through">
                    {formatPrice(currentPrice * 1.25)}
                  </span>
                  <span className="rounded bg-amber-500/10 px-2 py-0.5 text-xs font-semibold text-amber-400 border border-amber-500/20">
                    Studio Wholesale Rate
                  </span>
                </>
              )}
            </div>
          </div>

          <hr className="border-zinc-800" />

          {/* Real Configurable Options with Dynamic Price & Color Swatches */}
          {product.options && product.options.length > 0 && (
            <div className="space-y-5">
              {product.options.map((opt) => {
                const selectedVal = selectedOptions[opt.id]
                const selectedLabel =
                  opt.values.find((v) => v.index === selectedVal)?.label || selectedVal
                const isColorAttr = opt.label.toLowerCase().includes('color')

                return (
                  <div key={opt.id}>
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-300">
                        {opt.label}:{' '}
                        <span className="text-amber-400 font-bold">{selectedLabel}</span>
                      </label>
                    </div>

                    <div className="mt-2.5 flex flex-wrap gap-2.5">
                      {opt.values.map((v) => {
                        const isSelected = selectedVal === v.index
                        const colorHex = isColorAttr ? getColorHex(v.label) : null

                        return (
                          <button
                            key={v.index}
                            type="button"
                            onClick={() => handleOptionChange(opt.id, v.index)}
                            className={`flex items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-medium transition ${
                              isSelected
                                ? 'border-amber-500 bg-amber-500/15 text-white ring-1 ring-amber-500/50 shadow-sm'
                                : 'border-zinc-800 bg-zinc-900/60 text-zinc-300 hover:border-zinc-700 hover:bg-zinc-800'
                            }`}
                          >
                            {colorHex && (
                              <span
                                className="h-3.5 w-3.5 rounded-full border border-white/20 shadow-xs flex-shrink-0"
                                style={{ backgroundColor: colorHex }}
                              />
                            )}
                            <span>{v.label}</span>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Quantity Counter & Add to Cart */}
          <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
            <div className="flex items-center rounded-xl border border-zinc-800 bg-zinc-900/80 p-1 w-fit">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="h-9 w-9 flex items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-800 hover:text-white transition"
                aria-label="Decrease quantity"
              >
                -
              </button>
              <span className="w-12 text-center text-sm font-semibold text-white">{quantity}</span>
              <button
                type="button"
                onClick={() => setQuantity((q) => q + 1)}
                className="h-9 w-9 flex items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-800 hover:text-white transition"
                aria-label="Increase quantity"
              >
                +
              </button>
            </div>

            <button
              type="button"
              onClick={handleAddToCart}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl py-3.5 px-6 text-sm font-bold bg-amber-500 text-black hover:bg-amber-400 active:scale-[0.99] transition shadow-lg shadow-amber-500/10 cursor-pointer"
            >
              <ShoppingBag className="h-4 w-4" />
              <span>Add to Cart • {formatPrice(currentPrice * quantity)}</span>
            </button>
          </div>

          {/* Studio Guarantee Badges */}
          <div className="grid grid-cols-3 gap-3 pt-4 border-t border-zinc-800/80 text-center">
            <div className="flex flex-col items-center gap-1.5 text-[11px] text-zinc-400">
              <Truck className="h-4 w-4 text-amber-500" />
              <span>Ships in 24 Hours</span>
            </div>
            <div className="flex flex-col items-center gap-1.5 text-[11px] text-zinc-400">
              <Shield className="h-4 w-4 text-amber-500" />
              <span>1-Year Official Warranty</span>
            </div>
            <div className="flex flex-col items-center gap-1.5 text-[11px] text-zinc-400">
              <RotateCcw className="h-4 w-4 text-amber-500" />
              <span>30-Day Hassle Returns</span>
            </div>
          </div>
        </div>
      </div>

      {/* Product Description & Technical Specs */}
      {product.description && (
        <div className="border-t border-zinc-800 pt-10 space-y-4">
          <h2 className="text-xl font-bold text-white">Product Description & Studio Specs</h2>
          <div
            className="prose prose-invert prose-amber max-w-none text-sm text-zinc-300 leading-relaxed overflow-hidden"
            dangerouslySetInnerHTML={{ __html: product.description }}
          />
        </div>
      )}
    </div>
  )
}
