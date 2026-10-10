import { Link } from '@tanstack/react-router'
import { getTopCategories } from '~/lib/catalog'

export function Footer() {
  const topCategories = getTopCategories()

  return (
    <footer className="mt-20 border-t border-zinc-800 bg-zinc-950 py-12 text-zinc-400">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          <div>
            <div className="flex items-center gap-2 text-lg font-bold text-white">
              <span className="flex h-7 w-7 items-center justify-center rounded bg-amber-500 font-black text-black">
                B
              </span>
              <span>BDGYOO</span>
            </div>
            <p className="mt-4 text-xs leading-relaxed text-zinc-400">
              Professional Tattoo Supplies, Wireless Tattoo Machine Pens, Precision Needles, and
              Studio Accessories.
            </p>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
              Catalog
            </h4>
            <ul className="mt-4 space-y-2 text-xs">
              {topCategories.map((c) => (
                <li key={c.id}>
                  <Link
                    to="/categories/$slug"
                    params={{ slug: c.slug }}
                    className="hover:text-white"
                  >
                    {c.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
              Customer Care
            </h4>
            <ul className="mt-4 space-y-2 text-xs">
              <li>
                <Link to="/account" className="hover:text-white">
                  My Account
                </Link>
              </li>
              <li>
                <Link to="/cart" className="hover:text-white">
                  Shopping Cart
                </Link>
              </li>
              <li>
                <Link to="/checkout" className="hover:text-white">
                  Checkout
                </Link>
              </li>
              <li>
                <span className="hover:text-white cursor-pointer">Shipping & Returns</span>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
              Tech Stack
            </h4>
            <p className="mt-4 text-xs leading-relaxed text-zinc-500">
              Powered by Saleor GraphQL Headless Engine, TanStack Start (SSR), TanStack Router &
              Query.
            </p>
          </div>
        </div>

        <div className="mt-12 border-t border-zinc-800/80 pt-6 text-center text-xs text-zinc-600">
          © {new Date().getFullYear()} BDGYOO Tattoo Supply. All rights reserved. Migrated to Saleor
          + TanStack.
        </div>
      </div>
    </footer>
  )
}
