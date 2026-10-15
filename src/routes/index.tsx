import { Link, createFileRoute } from '@tanstack/react-router'
import {
  Award,
  ChevronRight,
  Compass,
  Film,
  Flame,
  Layers,
  ShieldCheck,
  Sparkles,
  Truck,
  Zap,
} from 'lucide-react'
import { useState } from 'react'
import { NetflixBillboard } from '~/components/NetflixBillboard'
import { NetflixQuickPreviewModal } from '~/components/NetflixQuickPreviewModal'
import { NetflixRow } from '~/components/NetflixRow'
import {
  type CatalogProduct,
  getCartridgeNeedles,
  getHeroProduct,
  getPowerSupplies,
  getTattooKits,
  getTop10Products,
  getTopCategories,
  getWirelessMachines,
} from '~/lib/catalog'

export const Route = createFileRoute('/')({
  component: NetflixCinemaHomePage,
})

function NetflixCinemaHomePage() {
  const heroProduct = getHeroProduct()
  const top10Products = getTop10Products()
  const wirelessMachines = getWirelessMachines(12)
  const cartridgeNeedles = getCartridgeNeedles(10)
  const powerSupplies = getPowerSupplies(10)
  const tattooKits = getTattooKits(10)
  const topCategories = getTopCategories()

  // State for Netflix-style Quick Preview Modal
  const [previewProduct, setPreviewProduct] = useState<CatalogProduct | null>(null)

  return (
    <div className="bg-[#141414] text-white min-h-screen pb-20 space-y-10">
      {/* 1. Cinematic Hero Billboard */}
      <NetflixBillboard product={heroProduct} onOpenPreview={(p) => setPreviewProduct(p)} />

      {/* 2. Classic Netflix Ranked Row: TOP 10 IN USA STUDIOS */}
      <section className="-mt-16 sm:-mt-20 relative z-30">
        <NetflixRow
          title="Top 10 in USA Studios Today"
          subtitle="Most ordered rotary pens, cartridges, and power stations by professional tattoo artists"
          products={top10Products}
          isRanked={true}
          onOpenPreview={(p) => setPreviewProduct(p)}
        />
      </section>

      {/* 3. Trending Wireless Rotary Machines */}
      <section>
        <NetflixRow
          title="Trending Now: Wireless Battery Machines"
          subtitle="Brushless motors, dual battery setups, and precision stroke adjustments"
          categorySlug="tattoo-machines"
          products={wirelessMachines}
          onOpenPreview={(p) => setPreviewProduct(p)}
        />
      </section>

      {/* 4. Complete Tattoo Kits & Bundles */}
      <section>
        <NetflixRow
          title="Studio Kits & Turnkey Bundles"
          subtitle="Complete pro sets with wireless pen, power supply, ink cups, and assorted needles"
          categorySlug="tattoo-kit"
          products={tattooKits}
          onOpenPreview={(p) => setPreviewProduct(p)}
        />
      </section>

      {/* 5. Cartridge Needles Shelf */}
      <section>
        <NetflixRow
          title="Precision Cartridge Needles"
          subtitle="Medical grade 316 stainless steel, safety membrane, and ultra-stable solder"
          categorySlug="tattoo-needles"
          products={cartridgeNeedles}
          onOpenPreview={(p) => setPreviewProduct(p)}
        />
      </section>

      {/* 6. Power Supplies & Accessories */}
      <section>
        <NetflixRow
          title="Digital Power Stations & Wireless Battery Packs"
          subtitle="RCA adapters, LCD color screens, and steady voltage regulators"
          categorySlug="tattoo-power-supply"
          products={powerSupplies}
          onOpenPreview={(p) => setPreviewProduct(p)}
        />
      </section>

      {/* 7. Value Pillars (Netflix Premium Studio Standard) */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-8">
        <div className="border-t border-zinc-800/80 pt-10">
          <div className="flex items-center gap-2 mb-6">
            <span className="flex h-5 w-5 items-center justify-center rounded bg-[#E50914] text-white text-[10px] font-black">
              ★
            </span>
            <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-300">
              The BDGY Professional Studio Promise
            </h3>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="flex items-start gap-3.5 rounded-lg border border-zinc-800 bg-[#181818] p-4">
              <Truck className="h-6 w-6 text-[#E50914] shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-white">Global Express Tracked</h4>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  Direct dispatch with DHL/UPS express to USA, Europe & Australia
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5 rounded-lg border border-zinc-800 bg-[#181818] p-4">
              <ShieldCheck className="h-6 w-6 text-[#E50914] shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-white">100% Studio Tested</h4>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  Voltage stability and stroke calibration verified before shipping
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5 rounded-lg border border-zinc-800 bg-[#181818] p-4">
              <Award className="h-6 w-6 text-[#E50914] shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-white">1-Year Factory Warranty</h4>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  Hassle-free replacement for motor and battery defects
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5 rounded-lg border border-zinc-800 bg-[#181818] p-4">
              <Zap className="h-6 w-6 text-[#E50914] shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-white">Direct Wholesale Pricing</h4>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  Eliminating middleman markups for studios and artists
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 8. Browse All 71 Categories */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-4">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              <Compass className="h-5 w-5 text-zinc-400" />
              <span>Explore All Studio Categories</span>
            </h2>
            <p className="text-xs text-zinc-400 mt-1">
              Complete catalog taxonomy migrated directly from BDGY Magento store
            </p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {topCategories.map((cat) => (
            <Link
              key={cat.id}
              to="/categories/$slug"
              params={{ slug: cat.slug }}
              className="group flex flex-col justify-between rounded-lg border border-zinc-800/80 bg-[#181818] p-4 transition duration-200 hover:border-zinc-600 hover:bg-zinc-800/60"
            >
              <div>
                <span className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-wider">
                  Category #{cat.id}
                </span>
                <h3 className="mt-1 text-sm font-bold text-white group-hover:text-amber-400 transition">
                  {cat.name}
                </h3>
                {cat.subcategories && cat.subcategories.length > 0 && (
                  <p className="mt-1.5 text-[11px] text-zinc-500 line-clamp-1">
                    {cat.subcategories.map((s) => s.name).join(', ')}
                  </p>
                )}
              </div>
              <div className="mt-3 flex items-center justify-between text-[11px] text-zinc-400">
                <span>{cat.product_count} products</span>
                <ChevronRight className="h-3 w-3 group-hover:translate-x-0.5 transition" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 9. Floating Quick Preview Modal */}
      <NetflixQuickPreviewModal product={previewProduct} onClose={() => setPreviewProduct(null)} />
    </div>
  )
}
