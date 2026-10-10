import type { Category, Product } from './types'

// Primary 7 Categories extracted from BDGY audit
export const BDGY_TOP_CATEGORIES: Category[] = [
  {
    id: '51',
    name: 'Tattoo Machines',
    slug: 'tattoo-machines',
    description: 'Professional wireless pens and rotary tattoo machines.',
    children: [
      { id: '133', name: 'Wireless Tattoo Machines', slug: 'wireless-tattoo-machines' },
      { id: '134', name: 'Rotary Tattoo Machines', slug: 'rotary-tattoo-machines' },
    ],
  },
  {
    id: '118',
    name: 'Tattoo Needles',
    slug: 'tattoo-needles',
    description: 'Precision cartridge needles with safety membrane.',
    children: [],
  },
  {
    id: '55',
    name: 'Power Supplies',
    slug: 'tattoo-power-supplies',
    description: 'Wireless battery packs, digital power supplies, and foot pedals.',
    children: [
      { id: '136', name: 'Wireless Battery', slug: 'wireless-battery' },
      { id: '78', name: 'Tattoo Power Supply', slug: 'tattoo-power-supply' },
      { id: '79', name: 'Foot Pedals', slug: 'foot-pedals' },
    ],
  },
  {
    id: '142',
    name: 'Tattoo Kits',
    slug: 'tattoo-kits',
    description: 'Complete wireless machine kits and studio essentials.',
    children: [
      { id: '194', name: 'Wireless Machine Kits', slug: 'wireless-machine-kits' },
      { id: '197', name: 'Complete Tattoo Kits', slug: 'complete-tattoo-kits' },
    ],
  },
  {
    id: '54',
    name: 'Tattoo Grips',
    slug: 'tattoo-grips',
    description: 'Ergonomic metal, aluminum, and disposable cartridge grips.',
    children: [{ id: '137', name: 'Metal Grips', slug: 'metal-grips' }],
  },
  {
    id: '180',
    name: 'Medical & Hygiene',
    slug: 'tattoo-medical',
    description: 'Barrier film, dental bibs, grip wraps, and hygiene supplies.',
    children: [
      { id: '218', name: 'Bibs & Sheets', slug: 'bibs-and-sheets' },
      { id: '221', name: 'Wraps & Bandages', slug: 'wraps-and-bandages' },
      { id: '224', name: 'Barrier Film', slug: 'barrier-film' },
    ],
  },
  {
    id: '58',
    name: 'Accessories',
    slug: 'tattoo-accessories',
    description: 'RCA cables, adapters, carrying cases, and studio tools.',
    children: [
      { id: '209', name: 'Cables & Adapters', slug: 'cables-and-adapters' },
      { id: '212', name: 'Machine Cases', slug: 'machine-cases' },
    ],
  },
]

export const GET_PRODUCTS_QUERY = `
  query GetProducts($channel: String!, $first: Int = 20, $filter: ProductFilterInput) {
    products(channel: $channel, first: $first, filter: $filter) {
      edges {
        node {
          id
          name
          slug
          description
          thumbnail {
            url
            alt
          }
          category {
            id
            name
            slug
          }
          pricing {
            priceRange {
              start {
                gross {
                  amount
                  currency
                }
              }
            }
          }
        }
      }
    }
  }
`

export const GET_PRODUCT_BY_SLUG_QUERY = `
  query GetProductBySlug($channel: String!, $slug: String!) {
    product(channel: $channel, slug: $slug) {
      id
      name
      slug
      description
      media {
        url
        alt
      }
      category {
        id
        name
        slug
      }
      variants {
        id
        name
        sku
        pricing {
          price {
            gross {
              amount
              currency
            }
          }
        }
        attributes {
          attribute {
            id
            name
            slug
          }
          values {
            id
            name
            slug
          }
        }
      }
    }
  }
`
