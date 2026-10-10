import { Link } from '@tanstack/react-router'
import { getTopCategories } from '~/lib/catalog'

export function CategoryNav() {
  const topCategories = getTopCategories()

  return (
    <div className="border-b border-zinc-800 bg-zinc-900/60 py-2.5">
      <div className="mx-auto flex max-w-7xl items-center gap-6 overflow-x-auto px-4 sm:px-6 lg:px-8 text-xs text-zinc-400">
        <span className="font-semibold uppercase tracking-wider text-zinc-500">Categories:</span>
        {topCategories.map((cat) => (
          <Link
            key={cat.id}
            to="/categories/$slug"
            params={{ slug: cat.slug }}
            className="whitespace-nowrap transition-colors hover:text-white"
            activeProps={{ className: 'text-amber-400 font-semibold' }}
          >
            {cat.name}
          </Link>
        ))}
      </div>
    </div>
  )
}
