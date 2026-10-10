import { Link, createFileRoute } from '@tanstack/react-router'
import { ArrowRight, Award, ChevronRight, ShieldCheck, Truck, Zap } from 'lucide-react'
import { ProductCard } from '~/components/ProductCard'
import { getFeaturedProducts, getTopCategories } from '~/lib/catalog'

export const Route = createFileRoute('/')({
  component: HomePage,
})

function HomePage() {
  const topCategories = getTopCategories()
  const featuredProducts = getFeaturedProducts(8)

  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-zinc-800 bg-gradient-to-b from-zinc-900 to-zinc-950 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-amber-400">
              <Zap className="h-3.5 w-3.5" /> Next-Gen Tattoo Tech
            </span>
            <h1 className="mt-6 text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl">
              Precision Crafted <br />
              <span className="text-amber-400">Wireless Tattoo Equipment</span>
            </h1>
            <p className="mt-4 text-base leading-relaxed text-zinc-400 sm:text-lg">
              Empowering professional tattoo artists worldwide with long-lasting battery pens,
              brushless motors, and ultra-sharp cartridge needles.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                to="/categories/$slug"
                params={{ slug: 'tattoo-machines' }}
                className="inline-flex items-center gap-2 rounded-lg bg-amber-500 px-6 py-3 text-sm font-semibold text-black transition hover:bg-amber-400"
              >
                <span>Shop Wireless Machines</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/categories/$slug"
                params={{ slug: 'tattoo-needles' }}
                className="inline-flex items-center rounded-lg border border-zinc-700 bg-zinc-900 px-6 py-3 text-sm font-semibold text-zinc-200 transition hover:bg-zinc-800 hover:text-white"
              >
                Browse Needles
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Value Proposition */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div className="flex items-center gap-4 rounded-xl border border-zinc-800/80 bg-zinc-900/30 p-4">
            <Truck className="h-8 w-8 text-amber-400" />
            <div>
              <h4 className="text-sm font-semibold text-white">Global Express Shipping</h4>
              <p className="text-xs text-zinc-400">Fast delivery with tracking</p>
            </div>
          </div>
          <div className="flex items-center gap-4 rounded-xl border border-zinc-800/80 bg-zinc-900/30 p-4">
            <ShieldCheck className="h-8 w-8 text-amber-400" />
            <div>
              <h4 className="text-sm font-semibold text-white">100% Tested & Verified</h4>
              <p className="text-xs text-zinc-400">Strict studio QC standards</p>
            </div>
          </div>
          <div className="flex items-center gap-4 rounded-xl border border-zinc-800/80 bg-zinc-900/30 p-4">
            <Award className="h-8 w-8 text-amber-400" />
            <div>
              <h4 className="text-sm font-semibold text-white">1-Year Machine Warranty</h4>
              <p className="text-xs text-zinc-400">Direct factory warranty support</p>
            </div>
          </div>
          <div className="flex items-center gap-4 rounded-xl border border-zinc-800/80 bg-zinc-900/30 p-4">
            <Zap className="h-8 w-8 text-amber-400" />
            <div>
              <h4 className="text-sm font-semibold text-white">Wholesale & Pro Discounts</h4>
              <p className="text-xs text-zinc-400">Tiered pricing for studios</p>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Grid */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-white">Browse By Category</h2>
            <p className="mt-1 text-sm text-zinc-400">
              Explore our complete collection of 72 studio categories
            </p>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {topCategories.map((cat) => (
            <Link
              key={cat.id}
              to="/categories/$slug"
              params={{ slug: cat.slug }}
              className="group flex flex-col justify-between rounded-xl border border-zinc-800 bg-zinc-900/40 p-5 transition hover:border-amber-500/50 hover:bg-zinc-800/60"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-amber-500 uppercase tracking-wider">
                    Category
                  </span>
                  <span className="text-[11px] font-medium text-zinc-500">
                    {cat.product_count} items
                  </span>
                </div>
                <h3 className="mt-2 text-base font-bold text-white group-hover:text-amber-400">
                  {cat.name}
                </h3>
                {cat.subcategories && cat.subcategories.length > 0 && (
                  <p className="mt-2 text-xs text-zinc-500 line-clamp-1">
                    {cat.subcategories.map((s) => s.name).join(', ')}
                  </p>
                )}
              </div>
              <div className="mt-4 flex items-center gap-1 text-xs font-medium text-zinc-400 group-hover:text-white">
                <span>View Products</span>
                <ChevronRight className="h-3 w-3" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Products */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-white">Featured Studio Picks</h2>
            <p className="mt-1 text-sm text-zinc-400">
              High-performance machines and bestselling needles directly from BDGY catalog
            </p>
          </div>
          <Link
            to="/categories/$slug"
            params={{ slug: 'tattoo-machines' }}
            className="flex items-center gap-1 text-xs font-semibold text-amber-400 hover:text-amber-300"
          >
            <span>View All</span>
            <ChevronRight className="h-3 w-3" />
          </Link>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {featuredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>
    </div>
  )
}
