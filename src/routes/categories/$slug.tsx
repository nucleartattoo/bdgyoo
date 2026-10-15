import { Link, createFileRoute } from '@tanstack/react-router'
import {
  ArrowUpDown,
  Check,
  ChevronRight,
  Filter,
  Grid3X3,
  LayoutGrid,
  RotateCcw,
  SlidersHorizontal,
  X,
  Zap,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { NetflixQuickPreviewModal } from '~/components/NetflixQuickPreviewModal'
import { ProductCard } from '~/components/ProductCard'
import {
  type CatalogProduct,
  getCategoryBySlug,
  getProductsByCategory,
  getTopCategories,
} from '~/lib/catalog'

export const Route = createFileRoute('/categories/$slug')({
  component: CategoryPage,
})

type PriceRange = 'all' | 'under-50' | '50-100' | '100-200' | '200-plus'

function CategoryPage() {
  const { slug } = Route.useParams()
  const [sortBy, setSortBy] = useState<'featured' | 'price-asc' | 'price-desc' | 'name'>('featured')
  const [priceRange, setPriceRange] = useState<PriceRange>('all')
  const [inStockOnly, setInStockOnly] = useState(false)
  const [multiVariantOnly, setMultiVariantOnly] = useState(false)
  const [selectedTag, setSelectedTag] = useState<string | null>(null)
  const [previewProduct, setPreviewProduct] = useState<CatalogProduct | null>(null)
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false)
  const [gridCols, setGridCols] = useState<'3' | '4'>('4')

  // Load category and raw catalog products
  const category = getCategoryBySlug(slug)
  const { products: rawProducts, total: totalRaw } = getProductsByCategory(slug, { sortBy })

  const categoryName =
    category?.name || slug.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())

  const categoryDescription =
    category?.name && category.product_count > 0
      ? `Explore ${totalRaw} professional tattoo studio products in ${categoryName}. Verified for professional studios.`
      : 'Explore high-performance tattoo equipment and accessories.'

  const topCategories = getTopCategories()

  // Filter products by price, stock, variants, and tag
  const filteredProducts = useMemo(() => {
    return rawProducts.filter((product) => {
      // Price range
      if (priceRange === 'under-50' && product.price >= 50) return false
      if (priceRange === '50-100' && (product.price < 50 || product.price >= 100)) return false
      if (priceRange === '100-200' && (product.price < 100 || product.price >= 200)) return false
      if (priceRange === '200-plus' && product.price < 200) return false

      // Stock (all positive priced items)
      if (inStockOnly && product.price <= 0) return false

      // Multi-variant
      if (multiVariantOnly && product.options.length === 0) return false

      // Tag filter
      if (selectedTag) {
        const text = `${product.name} ${product.description}`.toLowerCase()
        if (!text.includes(selectedTag.toLowerCase())) return false
      }

      return true
    })
  }, [rawProducts, priceRange, inStockOnly, multiVariantOnly, selectedTag])

  const activeFilterCount =
    (priceRange !== 'all' ? 1 : 0) +
    (inStockOnly ? 1 : 0) +
    (multiVariantOnly ? 1 : 0) +
    (selectedTag ? 1 : 0)

  const clearAllFilters = () => {
    setPriceRange('all')
    setInStockOnly(false)
    setMultiVariantOnly(false)
    setSelectedTag(null)
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {/* Category Header & Breadcrumbs */}
      <div className="border-b border-zinc-800/80 pb-6">
        <nav
          aria-label="Breadcrumb"
          className="text-xs text-zinc-500 mb-3 flex items-center gap-1.5 flex-wrap"
        >
          <Link to="/" className="hover:text-zinc-300 transition">
            Home
          </Link>
          <ChevronRight className="h-3 w-3 text-zinc-600" />
          <span className="text-zinc-400">Categories</span>
          <ChevronRight className="h-3 w-3 text-zinc-600" />
          <span className="text-white font-medium">{categoryName}</span>
        </nav>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-white sm:text-4xl">
              {categoryName}
            </h1>
            <p className="mt-2 text-sm text-zinc-400 max-w-2xl">{categoryDescription}</p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-zinc-900 px-3.5 py-1 text-xs font-semibold text-zinc-300 border border-zinc-700">
              <Zap className="h-3.5 w-3.5 text-[#E50914]" /> {filteredProducts.length} of {totalRaw}{' '}
              Items
            </span>
          </div>
        </div>

        {/* Subcategories Navigation Pills */}
        {category?.subcategories && category.subcategories.length > 0 && (
          <div className="mt-6 flex flex-wrap gap-2">
            <Link
              to="/categories/$slug"
              params={{ slug: category.slug }}
              className="rounded-full border border-[#E50914] bg-red-600/10 px-3.5 py-1 text-xs font-bold text-white transition"
            >
              All {categoryName} ({totalRaw})
            </Link>
            {category.subcategories.map((sub) => (
              <Link
                key={sub.id}
                to="/categories/$slug"
                params={{ slug: sub.slug }}
                className="rounded-full border border-zinc-800 bg-[#161616] px-3.5 py-1 text-xs text-zinc-300 hover:border-zinc-600 hover:text-white transition"
              >
                {sub.name} ({sub.product_count})
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Main Catalog Layout: Sidebar Filters + Products Grid */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
        {/* Desktop Facet Filters Sidebar (Col 1) */}
        <aside className="hidden lg:block space-y-6">
          <div className="rounded-2xl border border-zinc-800 bg-[#141414] p-5 space-y-6">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-2">
                <SlidersHorizontal className="h-4 w-4 text-[#E50914]" /> Filters
              </h2>
              {activeFilterCount > 0 && (
                <button
                  type="button"
                  onClick={clearAllFilters}
                  className="text-xs text-zinc-400 hover:text-red-400 transition cursor-pointer flex items-center gap-1"
                >
                  <RotateCcw className="h-3 w-3" /> Reset
                </button>
              )}
            </div>

            {/* Price Filter */}
            <div className="space-y-3">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                Price Range
              </label>
              <div className="space-y-1.5 text-xs">
                {[
                  { label: 'All Prices', val: 'all' },
                  { label: 'Under $50', val: 'under-50' },
                  { label: '$50 to $100', val: '50-100' },
                  { label: '$100 to $200', val: '100-200' },
                  { label: '$200 and Above', val: '200-plus' },
                ].map((item) => (
                  <button
                    key={item.val}
                    type="button"
                    onClick={() => setPriceRange(item.val as PriceRange)}
                    className={`w-full flex items-center justify-between rounded-lg px-2.5 py-1.5 transition text-left cursor-pointer ${
                      priceRange === item.val
                        ? 'bg-red-600/10 text-white font-bold border border-red-600/30'
                        : 'text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-200'
                    }`}
                  >
                    <span>{item.label}</span>
                    {priceRange === item.val && <Check className="h-3.5 w-3.5 text-[#E50914]" />}
                  </button>
                ))}
              </div>
            </div>

            <hr className="border-zinc-800" />

            {/* Equipment Features / Badges */}
            <div className="space-y-3">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                Studio Specs
              </label>
              <div className="space-y-2 text-xs">
                <label className="flex items-center gap-2.5 text-zinc-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={inStockOnly}
                    onChange={(e) => setInStockOnly(e.target.checked)}
                    className="h-4 w-4 rounded border-zinc-700 bg-zinc-800 text-red-600 focus:ring-0 cursor-pointer"
                  />
                  <span>Ready to Dispatch (In Stock)</span>
                </label>
                <label className="flex items-center gap-2.5 text-zinc-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={multiVariantOnly}
                    onChange={(e) => setMultiVariantOnly(e.target.checked)}
                    className="h-4 w-4 rounded border-zinc-700 bg-zinc-800 text-red-600 focus:ring-0 cursor-pointer"
                  />
                  <span>Configurable Multi-Variant</span>
                </label>
              </div>
            </div>

            <hr className="border-zinc-800" />

            {/* Hardware Tags */}
            <div className="space-y-3">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                Equipment Type
              </label>
              <div className="flex flex-wrap gap-1.5">
                {[
                  'Wireless',
                  'Battery',
                  'Rotary',
                  'Needle',
                  'Cartridge',
                  'Kit',
                  'Power',
                  'RCA',
                ].map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => setSelectedTag((prev) => (prev === tag ? null : tag))}
                    className={`rounded-lg px-2.5 py-1 text-xs transition cursor-pointer ${
                      selectedTag === tag
                        ? 'bg-[#E50914] text-white font-bold'
                        : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-white'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            <hr className="border-zinc-800" />

            {/* Browse Categories */}
            <div className="space-y-3">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                All Departments
              </label>
              <div className="space-y-1 text-xs">
                {topCategories.map((cat) => (
                  <Link
                    key={cat.id}
                    to="/categories/$slug"
                    params={{ slug: cat.slug }}
                    className={`block rounded-lg px-2.5 py-1.5 transition ${
                      cat.slug === slug
                        ? 'text-[#E50914] font-bold bg-zinc-900'
                        : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
                    }`}
                  >
                    {cat.name} ({cat.product_count})
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </aside>

        {/* Main Product Catalog (Col 3) */}
        <div className="lg:col-span-3 space-y-6">
          {/* Top Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-zinc-800 bg-[#141414] p-3 text-xs text-zinc-400">
            {/* Mobile Filter Toggle */}
            <button
              type="button"
              onClick={() => setMobileFilterOpen(true)}
              className="lg:hidden flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-white font-medium"
            >
              <Filter className="h-3.5 w-3.5 text-[#E50914]" />
              <span>Filters {activeFilterCount > 0 ? `(${activeFilterCount})` : ''}</span>
            </button>

            <div className="hidden sm:flex items-center gap-2">
              <span>
                Showing <strong className="text-white">{filteredProducts.length}</strong> products
              </span>
            </div>

            <div className="flex items-center gap-4 ml-auto">
              {/* Grid density buttons */}
              <div className="hidden sm:flex items-center gap-1 border-r border-zinc-800 pr-3">
                <button
                  type="button"
                  onClick={() => setGridCols('3')}
                  className={`p-1.5 rounded ${gridCols === '3' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
                  aria-label="3 columns grid"
                >
                  <Grid3X3 className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setGridCols('4')}
                  className={`p-1.5 rounded ${gridCols === '4' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
                  aria-label="4 columns grid"
                >
                  <LayoutGrid className="h-4 w-4" />
                </button>
              </div>

              {/* Sorting */}
              <div className="flex items-center gap-2">
                <ArrowUpDown className="h-3.5 w-3.5 text-zinc-500" />
                <span className="hidden sm:inline text-zinc-500">Sort:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="rounded-lg border border-zinc-800 bg-zinc-900 px-2.5 py-1.5 text-xs text-white focus:border-[#E50914] focus:outline-none"
                >
                  <option value="featured">Featured / Popular</option>
                  <option value="price-asc">Price: Low to High</option>
                  <option value="price-desc">Price: High to Low</option>
                  <option value="name">Name (A-Z)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Active Filter Chips */}
          {activeFilterCount > 0 && (
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="text-xs text-zinc-500">Active Filters:</span>

              {priceRange !== 'all' && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-zinc-800 border border-zinc-700 px-3 py-1 text-xs text-zinc-300">
                  Price: {priceRange}
                  <button
                    type="button"
                    onClick={() => setPriceRange('all')}
                    className="hover:text-white"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}

              {inStockOnly && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-zinc-800 border border-zinc-700 px-3 py-1 text-xs text-zinc-300">
                  Ready to Dispatch
                  <button
                    type="button"
                    onClick={() => setInStockOnly(false)}
                    className="hover:text-white"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}

              {multiVariantOnly && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-zinc-800 border border-zinc-700 px-3 py-1 text-xs text-zinc-300">
                  Multi-Variant
                  <button
                    type="button"
                    onClick={() => setMultiVariantOnly(false)}
                    className="hover:text-white"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}

              {selectedTag && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-zinc-800 border border-zinc-700 px-3 py-1 text-xs text-zinc-300">
                  Tag: {selectedTag}
                  <button
                    type="button"
                    onClick={() => setSelectedTag(null)}
                    className="hover:text-white"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}

              <button
                type="button"
                onClick={clearAllFilters}
                className="text-xs text-[#E50914] hover:underline cursor-pointer ml-1"
              >
                Clear All
              </button>
            </div>
          )}

          {/* Products Grid */}
          {filteredProducts.length > 0 ? (
            <div
              className={`grid grid-cols-1 gap-6 sm:grid-cols-2 ${
                gridCols === '3' ? 'lg:grid-cols-3' : 'lg:grid-cols-3 xl:grid-cols-4'
              }`}
            >
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onPreview={(prod) => setPreviewProduct(prod)}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-zinc-800 bg-[#141414] p-12 text-center space-y-4">
              <p className="text-base font-bold text-white">No matching products found</p>
              <p className="text-xs text-zinc-400 max-w-sm mx-auto">
                No equipment matches your current filters. Try relaxing your filter criteria or
                clearing all active filters.
              </p>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={clearAllFilters}
                  className="rounded-lg bg-[#E50914] px-4 py-2 text-xs font-bold text-white hover:bg-red-600 transition"
                >
                  Reset All Filters
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Floating Quick Preview Modal from PLP */}
      {previewProduct && (
        <NetflixQuickPreviewModal
          product={previewProduct}
          onClose={() => setPreviewProduct(null)}
        />
      )}

      {/* Mobile Filters Drawer */}
      {mobileFilterOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <button
            type="button"
            className="fixed inset-0 bg-black/80 backdrop-blur-sm border-0 w-full h-full"
            onClick={() => setMobileFilterOpen(false)}
            aria-label="Close filters backdrop"
          />
          <div className="relative ml-auto w-full max-w-xs h-full bg-[#141414] border-l border-zinc-800 p-6 flex flex-col justify-between overflow-y-auto">
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <SlidersHorizontal className="h-4 w-4 text-[#E50914]" /> Filters
                </h3>
                <button
                  type="button"
                  onClick={() => setMobileFilterOpen(false)}
                  className="p-1 text-zinc-400 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Price */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                  Price
                </label>
                <div className="space-y-1">
                  {[
                    { label: 'All Prices', val: 'all' },
                    { label: 'Under $50', val: 'under-50' },
                    { label: '$50 to $100', val: '50-100' },
                    { label: '$100 to $200', val: '100-200' },
                    { label: '$200 and Above', val: '200-plus' },
                  ].map((item) => (
                    <button
                      key={item.val}
                      type="button"
                      onClick={() => setPriceRange(item.val as PriceRange)}
                      className={`w-full flex items-center justify-between rounded-lg px-3 py-2 text-xs transition ${
                        priceRange === item.val
                          ? 'bg-[#E50914] text-white font-bold'
                          : 'text-zinc-400 hover:bg-zinc-800'
                      }`}
                    >
                      <span>{item.label}</span>
                      {priceRange === item.val && <Check className="h-3.5 w-3.5" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tags */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                  Equipment Type
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {['Wireless', 'Battery', 'Rotary', 'Needle', 'Cartridge', 'Kit'].map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => setSelectedTag((prev) => (prev === tag ? null : tag))}
                      className={`rounded-lg px-2.5 py-1 text-xs transition ${
                        selectedTag === tag
                          ? 'bg-[#E50914] text-white font-bold'
                          : 'bg-zinc-900 border border-zinc-800 text-zinc-400'
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-zinc-800 flex gap-2">
              <button
                type="button"
                onClick={clearAllFilters}
                className="flex-1 rounded-xl border border-zinc-700 py-2.5 text-xs font-bold text-zinc-300"
              >
                Reset
              </button>
              <button
                type="button"
                onClick={() => setMobileFilterOpen(false)}
                className="flex-1 rounded-xl bg-[#E50914] py-2.5 text-xs font-bold text-white"
              >
                Apply ({filteredProducts.length})
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
