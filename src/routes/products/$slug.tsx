import { Link, createFileRoute } from '@tanstack/react-router'
import {
  AlertCircle,
  ArrowRight,
  Battery,
  Check,
  ChevronLeft,
  ChevronRight,
  Cpu,
  Layers,
  Maximize2,
  Package,
  RotateCcw,
  Shield,
  ShoppingBag,
  Sparkles,
  Truck,
  Wrench,
  X,
  Zap,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useCart } from '~/lib/cart'
import {
  type CatalogProduct,
  type ProductChildVariant,
  getProductBySlug,
  getRelatedProducts,
} from '~/lib/catalog'
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
  if (l.includes('black') || l.includes('matte black')) return '#18181b'
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

function extractTechnicalSpecs(product: CatalogProduct) {
  const specs: Array<{ label: string; value: string; icon: any }> = []
  const text = `${product.name} ${product.description} ${product.short_description}`

  // Stroke
  const strokeMatch =
    text.match(/(\d\.\d\s*mm)\s*stroke/i) || text.match(/stroke\s*:?\s*(\d\.\d\s*mm)/i)
  if (strokeMatch) {
    specs.push({ label: 'Stroke Length', value: strokeMatch[1], icon: Wrench })
  } else if (text.toLowerCase().includes('stroke')) {
    specs.push({ label: 'Stroke Length', value: '3.5mm - 4.0mm Direct Drive', icon: Wrench })
  }

  // Motor
  if (text.toLowerCase().includes('coreless')) {
    specs.push({ label: 'Motor Architecture', value: 'Custom Brushless Coreless Motor', icon: Cpu })
  } else if (text.toLowerCase().includes('motor')) {
    specs.push({ label: 'Motor Architecture', value: 'High-Torque Precision Motor', icon: Cpu })
  }

  // Battery
  const batteryMatch = text.match(/(\d{3,4}\s*mah)/i)
  if (batteryMatch) {
    specs.push({
      label: 'Battery Capacity',
      value: `${batteryMatch[1]} Lithium-ion`,
      icon: Battery,
    })
  } else if (text.toLowerCase().includes('wireless') || text.toLowerCase().includes('battery')) {
    specs.push({ label: 'Power Source', value: '2400mAh Reversible Battery Module', icon: Battery })
  }

  // Voltage
  const voltMatch = text.match(/(\d+\s*-\s*\d+\s*v)/i) || text.match(/(\d+\.?\d*\s*v)/i)
  if (voltMatch) {
    specs.push({ label: 'Operating Voltage', value: `${voltMatch[1]} DC`, icon: Zap })
  } else {
    specs.push({ label: 'Operating Voltage', value: '5.0V - 12.0V Micro-adjustable', icon: Zap })
  }

  // Material
  specs.push({ label: 'Chassis Material', value: 'CNC Aircraft-Grade Aluminum', icon: Layers })

  return specs
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
            className="inline-flex rounded-lg bg-[#E50914] px-6 py-2.5 text-xs font-bold text-white hover:bg-red-600 transition"
          >
            Return to Storefront
          </Link>
        </div>
      </div>
    )
  }

  // Gallery state
  const images = product.gallery.length > 0 ? product.gallery : product.image ? [product.image] : []
  const [activeImageIndex, setActiveImageIndex] = useState(0)
  const [isLightboxOpen, setIsLightboxOpen] = useState(false)
  const [isZoomed, setIsZoomed] = useState(false)
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 })

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
  const [showStickyBar, setShowStickyBar] = useState(false)
  const buyBoxRef = useRef<HTMLDivElement>(null)

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
      setActiveImageIndex(0)
      const initial: Record<string, string> = {}
      for (const opt of product.options) {
        if (opt.values.length > 0) {
          initial[opt.id] = opt.values[0].index
        }
      }
      setSelectedOptions(initial)
      setQuantity(1)
      setToastItem(null)
      setIsLightboxOpen(false)
    }
  }, [product])

  // Sticky buy bar observer
  useEffect(() => {
    const handleScroll = () => {
      if (!buyBoxRef.current) return
      const rect = buyBoxRef.current.getBoundingClientRect()
      // If the buy box is scrolled above viewport, show sticky bar
      setShowStickyBar(rect.bottom < 80)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Keyboard navigation for lightbox
  useEffect(() => {
    if (!isLightboxOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsLightboxOpen(false)
      if (e.key === 'ArrowRight') {
        setActiveImageIndex((prev) => (prev + 1) % images.length)
      }
      if (e.key === 'ArrowLeft') {
        setActiveImageIndex((prev) => (prev - 1 + images.length) % images.length)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isLightboxOpen, images.length])

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
  const activeImageUrl = images[activeImageIndex] || product.image

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

    addItem(
      {
        productId: product.id,
        name: currentVariantName,
        slug: product.slug,
        sku: currentSku,
        image: activeImageUrl,
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
      image: activeImageUrl,
    })

    setTimeout(() => {
      setToastItem(null)
    }, 4500)
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect()
    const x = ((e.clientX - left) / width) * 100
    const y = ((e.clientY - top) / height) * 100
    setZoomPos({ x, y })
  }

  const relatedProducts = getRelatedProducts(product, 6)
  const technicalSpecs = extractTechnicalSpecs(product)

  return (
    <div className="relative mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-16">
      {/* Toast Notification Alert */}
      {toastItem && (
        <aside
          aria-label="Added to cart notification"
          className="fixed bottom-6 right-6 z-50 flex max-w-md items-center gap-4 rounded-2xl border border-zinc-700 bg-[#1f1f1f]/95 p-4 shadow-2xl backdrop-blur-md animate-in slide-in-from-bottom-5 duration-300"
        >
          <div className="h-14 w-14 flex-shrink-0 overflow-hidden rounded-xl border border-zinc-800 bg-black p-1 flex items-center justify-center">
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
              <Check className="h-3.5 w-3.5" /> Added to your Studio Cart
            </div>
            <p className="text-xs font-bold text-white truncate mt-0.5">{toastItem.name}</p>
            {toastItem.variantLabel && (
              <p className="text-[11px] text-zinc-400 truncate">{toastItem.variantLabel}</p>
            )}
            <div className="mt-1 flex items-center gap-3">
              <span className="text-xs font-bold text-white">
                {toastItem.quantity} × {formatPrice(toastItem.price)}
              </span>
              <Link
                to="/cart"
                className="inline-flex items-center gap-1 text-xs font-bold text-[#E50914] hover:text-red-400 underline decoration-red-500/50 underline-offset-2 transition"
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
        <Link to="/" className="hover:text-zinc-300 transition">
          Home
        </Link>
        <ChevronRight className="h-3 w-3 text-zinc-600" />
        <Link
          to="/categories/$slug"
          params={{ slug: 'tattoo-machines' }}
          className="hover:text-zinc-300 transition"
        >
          Catalog
        </Link>
        <ChevronRight className="h-3 w-3 text-zinc-600" />
        <span className="text-zinc-300 font-medium truncate max-w-sm">{product.name}</span>
      </nav>

      {/* Primary PDP Hero: Gallery + Studio Selector */}
      <div className="grid grid-cols-1 gap-12 lg:grid-cols-12">
        {/* Media Gallery (Col 7) */}
        <div className="lg:col-span-7 space-y-4">
          <div
            role="button"
            tabIndex={0}
            className="group relative aspect-square overflow-hidden rounded-2xl border border-zinc-800 bg-[#0e0e0e] p-8 flex items-center justify-center cursor-crosshair focus:outline-none focus:ring-1 focus:ring-red-600"
            onMouseEnter={() => setIsZoomed(true)}
            onMouseLeave={() => setIsZoomed(false)}
            onMouseMove={handleMouseMove}
            onClick={() => setIsLightboxOpen(true)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                setIsLightboxOpen(true)
              }
            }}
          >
            {activeImageUrl ? (
              <div className="relative h-full w-full flex items-center justify-center">
                <img
                  src={activeImageUrl}
                  alt={product.name}
                  className={`max-h-full max-w-full object-contain transition-transform duration-150 ${
                    isZoomed ? 'scale-150' : 'scale-100'
                  }`}
                  style={
                    isZoomed
                      ? {
                          transformOrigin: `${zoomPos.x}% ${zoomPos.y}%`,
                        }
                      : undefined
                  }
                />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-zinc-600 gap-2">
                <Package className="h-16 w-16 text-zinc-700" />
                <span className="text-xs text-zinc-500">BDGY Professional Equipment</span>
              </div>
            )}

            {/* Badges Overlay */}
            <div className="absolute top-4 left-4 flex flex-col gap-2">
              {product.type === 'configurable' && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-zinc-900/90 px-3 py-1 text-[11px] font-semibold text-white border border-zinc-700 backdrop-blur-md">
                  <Sparkles className="h-3.5 w-3.5 text-amber-400" /> Multi-Variant
                </span>
              )}
            </div>

            {/* Fullscreen Magnify Trigger */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                setIsLightboxOpen(true)
              }}
              className="absolute top-4 right-4 flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-900/80 text-zinc-300 hover:text-white hover:bg-zinc-800 border border-zinc-700 backdrop-blur-md transition opacity-0 group-hover:opacity-100"
              aria-label="Open high-res lightbox"
            >
              <Maximize2 className="h-4 w-4" />
            </button>

            {/* Next/Prev Chevrons on Main Image */}
            {images.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    setActiveImageIndex((prev) => (prev - 1 + images.length) % images.length)
                  }}
                  className="absolute left-3 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/90 border border-zinc-800 backdrop-blur-md transition opacity-0 group-hover:opacity-100"
                  aria-label="Previous image"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    setActiveImageIndex((prev) => (prev + 1) % images.length)
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/90 border border-zinc-800 backdrop-blur-md transition opacity-0 group-hover:opacity-100"
                  aria-label="Next image"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </>
            )}

            {/* Bottom Image Count Pill */}
            {images.length > 1 && (
              <div className="absolute bottom-4 right-4 rounded-full bg-black/75 px-2.5 py-0.5 text-[11px] font-mono text-zinc-400 border border-zinc-800 backdrop-blur-md">
                {activeImageIndex + 1} / {images.length}
              </div>
            )}
          </div>

          {/* Thumbnails Row */}
          {images.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin">
              {images.map((imgUrl, idx) => (
                <button
                  type="button"
                  key={imgUrl}
                  onClick={() => setActiveImageIndex(idx)}
                  className={`h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl border p-1 bg-[#0e0e0e] transition ${
                    activeImageIndex === idx
                      ? 'border-[#E50914] ring-2 ring-red-600/40 opacity-100'
                      : 'border-zinc-800 hover:border-zinc-700 opacity-60 hover:opacity-100'
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

        {/* Purchase Info & Variant Selector (Col 5) */}
        <div ref={buyBoxRef} className="lg:col-span-5 flex flex-col space-y-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                Saleor Ready • In Stock
              </span>
              <span className="text-zinc-600">•</span>
              <span className="text-xs font-mono text-zinc-500">SKU: {currentSku}</span>
            </div>

            <h1 className="mt-3 text-2xl font-black tracking-tight text-white sm:text-3xl">
              {product.name}
            </h1>

            {product.short_description && (
              <p className="mt-2 text-sm text-zinc-400 leading-relaxed">
                {product.short_description}
              </p>
            )}

            <div className="mt-5 flex items-baseline gap-4">
              <span className="text-3xl font-black text-white">{formatPrice(currentPrice)}</span>
              {currentPrice > 0 && (
                <>
                  <span className="text-sm text-zinc-500 line-through">
                    {formatPrice(currentPrice * 1.25)}
                  </span>
                  <span className="rounded bg-zinc-800 px-2 py-0.5 text-xs font-semibold text-zinc-300 border border-zinc-700">
                    Studio Wholesale
                  </span>
                </>
              )}
            </div>
          </div>

          <hr className="border-zinc-800/80" />

          {/* Real Configurable Options with Dynamic Price & Color Swatches */}
          {product.options && product.options.length > 0 && (
            <div className="space-y-5">
              {product.options.map((opt) => {
                const selectedVal = selectedOptions[opt.id]
                const selectedLabel =
                  opt.values.find((v) => v.index === selectedVal)?.label || selectedVal
                const isColorAttr = opt.label.toLowerCase().includes('color')

                return (
                  <div key={opt.id} className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold uppercase tracking-wider text-zinc-300">
                        {opt.label}:
                      </span>
                      <span className="text-white font-bold">{selectedLabel}</span>
                    </div>

                    <div className="flex flex-wrap gap-2.5">
                      {opt.values.map((v) => {
                        const isSelected = selectedVal === v.index
                        const colorHex = isColorAttr ? getColorHex(v.label) : null

                        return (
                          <button
                            key={v.index}
                            type="button"
                            onClick={() => handleOptionChange(opt.id, v.index)}
                            className={`flex items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-medium transition cursor-pointer ${
                              isSelected
                                ? 'border-[#E50914] bg-red-600/10 text-white ring-1 ring-red-600/50 shadow-sm'
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
                className="h-10 w-10 flex items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-800 hover:text-white transition"
                aria-label="Decrease quantity"
              >
                -
              </button>
              <span className="w-12 text-center text-sm font-bold text-white">{quantity}</span>
              <button
                type="button"
                onClick={() => setQuantity((q) => q + 1)}
                className="h-10 w-10 flex items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-800 hover:text-white transition"
                aria-label="Increase quantity"
              >
                +
              </button>
            </div>

            <button
              type="button"
              onClick={handleAddToCart}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl py-3.5 px-6 text-sm font-bold bg-[#E50914] text-white hover:bg-red-600 active:scale-[0.99] transition shadow-lg shadow-red-950/40 cursor-pointer"
            >
              <ShoppingBag className="h-4 w-4" />
              <span>Add to Cart • {formatPrice(currentPrice * quantity)}</span>
            </button>
          </div>

          {/* Studio Guarantee Badges */}
          <div className="grid grid-cols-3 gap-3 pt-4 border-t border-zinc-800/80 text-center">
            <div className="flex flex-col items-center gap-1.5 text-[11px] text-zinc-400">
              <Truck className="h-4 w-4 text-zinc-300" />
              <span>Ships in 24 Hours</span>
            </div>
            <div className="flex flex-col items-center gap-1.5 text-[11px] text-zinc-400">
              <Shield className="h-4 w-4 text-zinc-300" />
              <span>1-Year Official Warranty</span>
            </div>
            <div className="flex flex-col items-center gap-1.5 text-[11px] text-zinc-400">
              <RotateCcw className="h-4 w-4 text-zinc-300" />
              <span>30-Day Hassle Returns</span>
            </div>
          </div>
        </div>
      </div>

      {/* Technical Specifications Section */}
      <div className="border-t border-zinc-800/80 pt-12 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <Cpu className="h-5 w-5 text-[#E50914]" /> Studio Engineering Specifications
          </h2>
          <span className="text-xs text-zinc-500 font-mono">BDGY Studio Standard</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {technicalSpecs.map((spec) => {
            const IconComponent = spec.icon
            return (
              <div
                key={spec.label}
                className="rounded-xl border border-zinc-800 bg-[#141414] p-4 space-y-2 hover:border-zinc-700 transition"
              >
                <div className="flex items-center gap-2 text-xs text-zinc-400">
                  <IconComponent className="h-4 w-4 text-[#E50914]" />
                  <span>{spec.label}</span>
                </div>
                <div className="text-sm font-semibold text-white">{spec.value}</div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Product Description */}
      {product.description && (
        <div className="border-t border-zinc-800/80 pt-12 space-y-4">
          <h2 className="text-xl font-bold text-white">Product Description & Studio Notes</h2>
          <div
            className="prose prose-invert max-w-none text-sm text-zinc-300 leading-relaxed overflow-hidden"
            dangerouslySetInnerHTML={{ __html: product.description }}
          />
        </div>
      )}

      {/* Complementary & Related Equipment Shelf ("Complete Your Studio Setup") */}
      {relatedProducts.length > 0 && (
        <div className="border-t border-zinc-800/80 pt-12 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold tracking-tight text-white">
                Complete Your Studio Setup
              </h2>
              <p className="text-xs text-zinc-400 mt-1">
                Frequently paired needle cartridges, wireless batteries, and studio gear
              </p>
            </div>
            <Link
              to="/categories/$slug"
              params={{ slug: 'tattoo-machines' }}
              className="text-xs font-semibold text-zinc-400 hover:text-white transition flex items-center gap-1"
            >
              View More <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {relatedProducts.map((rel) => (
              <Link
                key={rel.id}
                to="/products/$slug"
                params={{ slug: rel.slug }}
                className="group flex flex-col rounded-xl border border-zinc-800 bg-[#161616] p-3 transition hover:scale-[1.03] hover:border-zinc-700 hover:bg-[#1a1a1a]"
              >
                <div className="aspect-square w-full overflow-hidden rounded-lg bg-black p-2 flex items-center justify-center">
                  {rel.image ? (
                    <img
                      src={rel.image}
                      alt={rel.name}
                      className="h-full w-full object-contain group-hover:scale-105 transition duration-300"
                    />
                  ) : (
                    <Package className="h-8 w-8 text-zinc-600" />
                  )}
                </div>
                <div className="mt-3 flex-1 flex flex-col justify-between">
                  <h3 className="text-xs font-semibold text-white line-clamp-2 group-hover:text-red-400 transition">
                    {rel.name}
                  </h3>
                  <div className="mt-2 text-xs font-bold text-white">{formatPrice(rel.price)}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Sticky Bottom Quick Buy Bar */}
      {showStickyBar && (
        <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-zinc-800 bg-[#141414]/95 px-4 py-3 backdrop-blur-md animate-in slide-in-from-bottom duration-200">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-lg border border-zinc-800 bg-black p-1 flex items-center justify-center">
                {activeImageUrl ? (
                  <img
                    src={activeImageUrl}
                    alt={product.name}
                    className="h-full w-full object-contain"
                  />
                ) : (
                  <Package className="h-5 w-5 text-zinc-600" />
                )}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-white truncate">{currentVariantName}</p>
                <p className="text-xs font-bold text-white mt-0.5">{formatPrice(currentPrice)}</p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleAddToCart}
              className="flex items-center gap-2 rounded-xl bg-[#E50914] px-6 py-2.5 text-xs font-bold text-white hover:bg-red-600 active:scale-95 transition shadow-lg shadow-red-950/40 cursor-pointer flex-shrink-0"
            >
              <ShoppingBag className="h-3.5 w-3.5" />
              <span>Quick Add to Cart</span>
            </button>
          </div>
        </div>
      )}

      {/* High-Resolution Fullscreen Lightbox Modal */}
      {isLightboxOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
        >
          {/* Backdrop */}
          <button
            type="button"
            className="fixed inset-0 bg-black/95 backdrop-blur-xl border-0 cursor-default w-full h-full"
            onClick={() => setIsLightboxOpen(false)}
            aria-label="Close lightbox backdrop"
          />

          <button
            type="button"
            onClick={() => setIsLightboxOpen(false)}
            className="absolute top-6 right-6 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-zinc-800/80 text-zinc-400 hover:text-white transition"
            aria-label="Close lightbox"
          >
            <X className="h-5 w-5" />
          </button>

          {images.length > 1 && (
            <>
              <button
                type="button"
                onClick={() =>
                  setActiveImageIndex((prev) => (prev - 1 + images.length) % images.length)
                }
                className="absolute left-6 top-1/2 -translate-y-1/2 z-20 flex h-12 w-12 items-center justify-center rounded-full bg-zinc-800/80 text-white hover:bg-zinc-700 transition"
                aria-label="Previous image"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button
                type="button"
                onClick={() => setActiveImageIndex((prev) => (prev + 1) % images.length)}
                className="absolute right-6 top-1/2 -translate-y-1/2 z-20 flex h-12 w-12 items-center justify-center rounded-full bg-zinc-800/80 text-white hover:bg-zinc-700 transition"
                aria-label="Next image"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            </>
          )}

          <div className="relative z-10 max-h-[85vh] max-w-[85vw] flex flex-col items-center justify-center pointer-events-none">
            <img
              src={activeImageUrl}
              alt={product.name}
              className="max-h-[80vh] max-w-full object-contain pointer-events-auto"
            />
            <div className="mt-4 text-center pointer-events-auto">
              <p className="text-sm font-semibold text-white">{product.name}</p>
              <p className="text-xs text-zinc-400 font-mono mt-1">
                Image {activeImageIndex + 1} of {images.length} • Press ESC to exit
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
