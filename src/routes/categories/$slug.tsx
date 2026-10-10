import { Link, createFileRoute } from '@tanstack/react-router'
import { ArrowUpDown, ChevronRight, Filter } from 'lucide-react'
import { useState } from 'react'
import { ProductCard } from '~/components/ProductCard'
import { getCategoryBySlug, getProductsByCategory, getTopCategories } from '~/lib/catalog'

export const Route = createFileRoute('/categories/$slug')({
  component: CategoryPage,
})

function CategoryPage() {
  const { slug } = Route.useParams()
  const [sortBy, setSortBy] = useState<'featured' | 'price-asc' | 'price-desc' | 'name'>('featured')

  // Load category and real catalog products
  const category = getCategoryBySlug(slug)
  const { products, total } = getProductsByCategory(slug, { sortBy })

  const categoryName =
    category?.name || slug.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())

  const categoryDescription =
    category?.name && category.product_count > 0
      ? `Explore ${total} professional tattoo products in ${categoryName}. Verified for professional studios.`
      : 'Explore high-performance tattoo equipment and accessories.'

  // Parent category link if applicable
  const topCategories = getTopCategories()
  const isTopCategory = topCategories.some((c) => c.slug === slug)

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {/* Category Header & Breadcrumbs */}
      <div className="border-b border-zinc-800 pb-6">
        <nav
          aria-label="Breadcrumb"
          className="text-xs text-zinc-500 mb-3 flex items-center gap-1.5 flex-wrap"
        >
          <Link to="/" className="hover:text-zinc-300">
            Home
          </Link>
          <ChevronRight className="h-3 w-3 text-zinc-600" />
          <span className="text-zinc-400">Categories</span>
          <ChevronRight className="h-3 w-3 text-zinc-600" />
          <span className="text-amber-400 font-medium">{categoryName}</span>
        </nav>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              {categoryName}
            </h1>
            <p className="mt-2 text-sm text-zinc-400 max-w-2xl">{categoryDescription}</p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="inline-flex items-center rounded-full bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-400 border border-amber-500/20">
              {total} Products Available
            </span>
          </div>
        </div>

        {/* Subcategories Navigation Pills */}
        {category?.subcategories && category.subcategories.length > 0 && (
          <div className="mt-6 flex flex-wrap gap-2">
            <Link
              to="/categories/$slug"
              params={{ slug: category.slug }}
              className="rounded-full border border-amber-500/40 bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-400"
            >
              All {categoryName} ({total})
            </Link>
            {category.subcategories.map((sub) => (
              <Link
                key={sub.id}
                to="/categories/$slug"
                params={{ slug: sub.slug }}
                className="rounded-full border border-zinc-800 bg-zinc-900 px-3 py-1 text-xs text-zinc-300 hover:border-amber-500 hover:text-white transition"
              >
                {sub.name} ({sub.product_count})
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Toolbar: Sorting & Count */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-xs text-zinc-400">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-zinc-500" />
          <span>
            Showing <strong className="text-white">{products.length}</strong> of{' '}
            <strong className="text-white">{total}</strong> products
          </span>
        </div>

        <div className="flex items-center gap-2">
          <ArrowUpDown className="h-3.5 w-3.5 text-zinc-500" />
          <span className="text-zinc-500">Sort by:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="rounded border border-zinc-800 bg-zinc-900 px-2.5 py-1 text-xs text-white focus:border-amber-500 focus:outline-none"
          >
            <option value="featured">Featured / Popular</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
            <option value="name">Name (A-Z)</option>
          </select>
        </div>
      </div>

      {/* Products Grid */}
      {products.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-zinc-800 p-12 text-center space-y-3">
          <p className="text-sm text-zinc-400">No products currently listed in this subcategory.</p>
          <Link
            to="/"
            className="inline-block rounded-lg bg-zinc-800 px-4 py-2 text-xs font-semibold text-white hover:bg-zinc-700"
          >
            Explore Other Categories
          </Link>
        </div>
      )}
    </div>
  )
}
