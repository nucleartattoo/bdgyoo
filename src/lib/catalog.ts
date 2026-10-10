import catalogData from '~/data/catalog.json'

export interface CatalogCategory {
  id: string
  name: string
  slug: string
  parent_id: string | null
  product_count: number
  is_active: boolean
  children_ids: string[]
  subcategories?: CatalogCategory[]
}

export interface ProductOptionValue {
  index: string
  label: string
}

export interface ProductOption {
  id: string
  attribute_id: string
  label: string
  values: ProductOptionValue[]
}

export interface ProductChildVariant {
  id: string
  sku: string
  name: string
  price: number
}

export interface CatalogProduct {
  id: string
  sku: string
  name: string
  slug: string
  price: number
  special_price: number | null
  image: string
  gallery: string[]
  category_ids: string[]
  type: string
  visibility: number
  is_visible_individually: boolean
  options: ProductOption[]
  children: ProductChildVariant[]
  description: string
  short_description: string
}

const rawCategories: Record<string, CatalogCategory> = catalogData.categories as Record<
  string,
  CatalogCategory
>
const categoryDescendants: Record<string, string[]> = catalogData.category_descendants as Record<
  string,
  string[]
>
const allProducts: CatalogProduct[] = catalogData.products as CatalogProduct[]

// Top 7 Primary categories
export const TOP_CATEGORY_IDS = ['51', '118', '55', '142', '54', '180', '58']

/**
 * Returns the 7 primary storefront categories with their nested subcategories
 */
export function getTopCategories(): CatalogCategory[] {
  return TOP_CATEGORY_IDS.map((id) => {
    const cat = rawCategories[id]
    if (!cat) {
      return {
        id,
        name: 'Category',
        slug: 'category',
        parent_id: '2',
        product_count: 0,
        is_active: true,
        children_ids: [],
        subcategories: [],
      }
    }

    const subcategories = (cat.children_ids || [])
      .map((childId) => rawCategories[childId])
      .filter(Boolean)

    return {
      ...cat,
      subcategories,
    }
  })
}

/**
 * Get any category by slug
 */
export function getCategoryBySlug(slug: string): CatalogCategory | undefined {
  const match = Object.values(rawCategories).find(
    (c) => c.slug === slug || c.slug === slug.toLowerCase(),
  )
  if (!match) return undefined

  const subcategories = (match.children_ids || []).map((cid) => rawCategories[cid]).filter(Boolean)

  return {
    ...match,
    subcategories,
  }
}

/**
 * Get all categories
 */
export function getAllCategories(): CatalogCategory[] {
  return Object.values(rawCategories)
}

/**
 * Get products by category slug (including products in child subcategories)
 */
export function getProductsByCategory(
  categorySlug: string,
  options?: {
    sortBy?: 'featured' | 'price-asc' | 'price-desc' | 'name'
    limit?: number
    offset?: number
  },
): {
  products: CatalogProduct[]
  total: number
  category?: CatalogCategory
} {
  const category = getCategoryBySlug(categorySlug)

  let candidateCids: Set<string>
  if (category) {
    const desc = categoryDescendants[category.id] || [category.id]
    candidateCids = new Set(desc)
  } else {
    candidateCids = new Set()
  }

  // Filter products: must be visible individually and match one of candidate cids
  let matched = allProducts.filter((p) => {
    if (!p.is_visible_individually) return false
    if (candidateCids.size === 0) return true
    return p.category_ids.some((cid) => candidateCids.has(cid))
  })

  // If matched count is too small (e.g. products only tagged on children), also include configurable products
  if (matched.length === 0 && category) {
    matched = allProducts.filter(
      (p) =>
        p.is_visible_individually && p.name.toLowerCase().includes(category.name.toLowerCase()),
    )
  }

  // Sort
  const sortBy = options?.sortBy || 'featured'
  if (sortBy === 'price-asc') {
    matched.sort((a, b) => a.price - b.price)
  } else if (sortBy === 'price-desc') {
    matched.sort((a, b) => b.price - a.price)
  } else if (sortBy === 'name') {
    matched.sort((a, b) => a.name.localeCompare(b.name))
  } else {
    // Featured: prioritize products with images and higher prices/configurable
    matched.sort((a, b) => {
      const aScore = (a.image ? 10 : 0) + (a.options.length > 0 ? 5 : 0) + (a.price > 0 ? 2 : 0)
      const bScore = (b.image ? 10 : 0) + (b.options.length > 0 ? 5 : 0) + (b.price > 0 ? 2 : 0)
      return bScore - aScore
    })
  }

  const offset = options?.offset || 0
  const limit = options?.limit || matched.length

  return {
    products: matched.slice(offset, offset + limit),
    total: matched.length,
    category,
  }
}

/**
 * Get product by slug or sku
 */
export function getProductBySlug(slugOrSku: string): CatalogProduct | undefined {
  return (
    allProducts.find((p) => p.slug === slugOrSku) ||
    allProducts.find((p) => p.sku.toLowerCase() === slugOrSku.toLowerCase()) ||
    allProducts.find((p) => p.id === slugOrSku)
  )
}

/**
 * Get featured products for the storefront homepage
 */
export function getFeaturedProducts(limit = 8): CatalogProduct[] {
  // Select top configurable products with real images from the core categories
  const featured = allProducts.filter(
    (p) => p.is_visible_individually && p.image && p.price > 0 && p.options.length > 0,
  )

  return featured.slice(0, limit)
}

/**
 * Full-text search products by query
 */
export function searchProducts(query: string, limit = 20): CatalogProduct[] {
  if (!query || query.trim() === '') return []
  const q = query.toLowerCase().trim()

  return allProducts
    .filter((p) => {
      if (!p.is_visible_individually) return false
      return (
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.short_description.toLowerCase().includes(q)
      )
    })
    .slice(0, limit)
}
