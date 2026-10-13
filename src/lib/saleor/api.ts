import { getSaleorConfig, saleorFetch } from './client'
import type { Category, Product } from './types'

export interface ShopInfo {
  name: string
  description?: string
  version?: string
}

export interface SaleorGraphQLProductEdge {
  cursor: string
  node: {
    id: string
    name: string
    slug: string
    description?: string
    thumbnail?: {
      url: string
      alt?: string
    }
    category?: {
      id: string
      name: string
      slug: string
    }
    pricing?: {
      priceRange?: {
        start?: {
          gross: {
            amount: number
            currency: string
          }
        }
      }
    }
    variants?: Array<{
      id: string
      name: string
      sku: string
      pricing?: {
        price?: {
          gross: {
            amount: number
            currency: string
          }
        }
      }
      attributes: Array<{
        attribute: {
          id: string
          name: string
          slug: string
        }
        values: Array<{
          id: string
          name: string
          slug: string
        }>
      }>
    }>
  }
}

/**
 * Fetch Shop Info to test GraphQL connectivity
 */
export async function fetchSaleorShopInfo(): Promise<{
  success: boolean
  data?: ShopInfo
  latencyMs?: number
  error?: string
}> {
  const start = Date.now()
  const query = `
    query GetShopInfo {
      shop {
        name
        description
      }
    }
  `

  const res = await saleorFetch<{ shop: ShopInfo }>({ query })
  const latencyMs = Date.now() - start

  if (res.errors && res.errors.length > 0) {
    return {
      success: false,
      latencyMs,
      error: res.errors[0].message,
    }
  }

  if (res.data?.shop) {
    return {
      success: true,
      latencyMs,
      data: res.data.shop,
    }
  }

  return {
    success: false,
    latencyMs,
    error: 'No shop data returned from Saleor endpoint',
  }
}

/**
 * Query products from real Saleor GraphQL
 */
export async function fetchSaleorProducts(
  options: { first?: number; after?: string } = {},
): Promise<{
  products: Product[]
  totalCount?: number
  hasNextPage: boolean
  endCursor?: string
  error?: string
}> {
  const { first = 12, after } = options
  const config = getSaleorConfig()

  const query = `
    query GetSaleorProducts($channel: String!, $first: Int = 12, $after: String) {
      products(channel: $channel, first: $first, after: $after) {
        totalCount
        pageInfo {
          hasNextPage
          endCursor
        }
        edges {
          cursor
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
      }
    }
  `

  const res = await saleorFetch<{
    products: {
      totalCount: number
      pageInfo: { hasNextPage: boolean; endCursor: string }
      edges: SaleorGraphQLProductEdge[]
    }
  }>({
    query,
    variables: { first, after, channel: config.channel },
  })

  if (res.errors && res.errors.length > 0) {
    return {
      products: [],
      hasNextPage: false,
      error: res.errors[0].message,
    }
  }

  const edges = res.data?.products?.edges || []
  const products: Product[] = edges.map((e) => ({
    id: e.node.id,
    name: e.node.name,
    slug: e.node.slug,
    description: e.node.description,
    thumbnail: e.node.thumbnail,
    category: e.node.category,
    pricing: e.node.pricing,
    variants: e.node.variants?.map((v) => ({
      id: v.id,
      name: v.name,
      sku: v.sku,
      pricing: v.pricing,
      attributes: v.attributes,
    })),
  }))

  return {
    products,
    totalCount: res.data?.products?.totalCount,
    hasNextPage: res.data?.products?.pageInfo?.hasNextPage || false,
    endCursor: res.data?.products?.pageInfo?.endCursor,
  }
}

/**
 * Query single product by slug from Saleor GraphQL
 */
export async function fetchSaleorProductBySlug(slug: string): Promise<Product | null> {
  const config = getSaleorConfig()
  const query = `
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

  const res = await saleorFetch<{ product: Product | null }>({
    query,
    variables: { channel: config.channel, slug },
  })

  return res.data?.product || null
}

/**
 * Real Saleor Mutation: Create a checkout session
 */
export async function createSaleorCheckout(input: {
  email: string
  lines: Array<{ variantId: string; quantity: number }>
}): Promise<{
  success: boolean
  checkout?: {
    id: string
    token: string
    totalPrice?: { gross: { amount: number; currency: string } }
  }
  errors?: Array<{ field?: string; message: string; code?: string }>
}> {
  const config = getSaleorConfig()
  const mutation = `
    mutation CreateSaleorCheckout($input: CheckoutCreateInput!) {
      checkoutCreate(input: $input) {
        checkout {
          id
          token
          totalPrice {
            gross {
              amount
              currency
            }
          }
          subtotalPrice {
            gross {
              amount
              currency
            }
          }
          lines {
            id
            quantity
            variant {
              id
              name
              sku
            }
          }
        }
        errors {
          field
          message
          code
        }
      }
    }
  `

  const res = await saleorFetch<{
    checkoutCreate: {
      checkout?: {
        id: string
        token: string
        totalPrice?: { gross: { amount: number; currency: string } }
      }
      errors: Array<{ field?: string; message: string; code?: string }>
    }
  }>({
    query: mutation,
    variables: {
      input: {
        channel: config.channel,
        email: input.email,
        lines: input.lines,
      },
    },
  })

  const payload = res.data?.checkoutCreate
  if (payload?.errors && payload.errors.length > 0) {
    return {
      success: false,
      errors: payload.errors,
    }
  }

  if (payload?.checkout) {
    return {
      success: true,
      checkout: payload.checkout,
    }
  }

  return {
    success: false,
    errors: res.errors || [{ message: 'Failed to create Saleor checkout session' }],
  }
}

/**
 * Real Saleor Mutation: Update shipping address on checkout
 */
export async function updateSaleorShippingAddress(
  checkoutId: string,
  address: {
    firstName: string
    lastName: string
    streetAddress1: string
    streetAddress2?: string
    city: string
    countryArea?: string
    postalCode: string
    country: string
    phone?: string
  },
): Promise<{
  success: boolean
  availableShippingMethods?: Array<{
    id: string
    name: string
    price: { amount: number; currency: string }
  }>
  errors?: Array<{ field?: string; message: string; code?: string }>
}> {
  const mutation = `
    mutation UpdateSaleorShippingAddress($id: ID!, $shippingAddress: AddressInput!) {
      checkoutShippingAddressUpdate(id: $id, shippingAddress: $shippingAddress) {
        checkout {
          id
          availableShippingMethods {
            id
            name
            price {
              amount
              currency
            }
          }
        }
        errors {
          field
          message
          code
        }
      }
    }
  `

  const res = await saleorFetch<{
    checkoutShippingAddressUpdate: {
      checkout?: {
        id: string
        availableShippingMethods: Array<{
          id: string
          name: string
          price: { amount: number; currency: string }
        }>
      }
      errors: Array<{ field?: string; message: string; code?: string }>
    }
  }>({
    query: mutation,
    variables: {
      id: checkoutId,
      shippingAddress: {
        firstName: address.firstName,
        lastName: address.lastName,
        streetAddress1: address.streetAddress1,
        streetAddress2: address.streetAddress2 || '',
        city: address.city,
        countryArea: address.countryArea || '',
        postalCode: address.postalCode,
        country: address.country || 'US',
        phone: address.phone || '',
      },
    },
  })

  const payload = res.data?.checkoutShippingAddressUpdate
  if (payload?.errors && payload.errors.length > 0) {
    return { success: false, errors: payload.errors }
  }

  return {
    success: true,
    availableShippingMethods: payload?.checkout?.availableShippingMethods || [],
  }
}

/**
 * Real Saleor Mutation: Update billing address on checkout
 */
export async function updateSaleorBillingAddress(
  checkoutId: string,
  address: {
    firstName: string
    lastName: string
    streetAddress1: string
    streetAddress2?: string
    city: string
    countryArea?: string
    postalCode: string
    country: string
    phone?: string
  },
): Promise<{
  success: boolean
  errors?: Array<{ field?: string; message: string; code?: string }>
}> {
  const mutation = `
    mutation UpdateSaleorBillingAddress($id: ID!, $billingAddress: AddressInput!) {
      checkoutBillingAddressUpdate(id: $id, billingAddress: $billingAddress) {
        checkout {
          id
        }
        errors {
          field
          message
          code
        }
      }
    }
  `

  const res = await saleorFetch<{
    checkoutBillingAddressUpdate: {
      checkout?: { id: string }
      errors: Array<{ field?: string; message: string; code?: string }>
    }
  }>({
    query: mutation,
    variables: {
      id: checkoutId,
      billingAddress: {
        firstName: address.firstName,
        lastName: address.lastName,
        streetAddress1: address.streetAddress1,
        streetAddress2: address.streetAddress2 || '',
        city: address.city,
        countryArea: address.countryArea || '',
        postalCode: address.postalCode,
        country: address.country || 'US',
        phone: address.phone || '',
      },
    },
  })

  const payload = res.data?.checkoutBillingAddressUpdate
  if (payload?.errors && payload.errors.length > 0) {
    return { success: false, errors: payload.errors }
  }

  return { success: true }
}

/**
 * Real Saleor Mutation: Select shipping/delivery method
 */
export async function updateSaleorDeliveryMethod(
  checkoutId: string,
  deliveryMethodId: string,
): Promise<{
  success: boolean
  totalPrice?: { gross: { amount: number; currency: string } }
  errors?: Array<{ field?: string; message: string; code?: string }>
}> {
  const mutation = `
    mutation UpdateSaleorDeliveryMethod($id: ID!, $deliveryMethodId: ID!) {
      checkoutDeliveryMethodUpdate(id: $id, deliveryMethodId: $deliveryMethodId) {
        checkout {
          id
          totalPrice {
            gross {
              amount
              currency
            }
          }
        }
        errors {
          field
          message
          code
        }
      }
    }
  `

  const res = await saleorFetch<{
    checkoutDeliveryMethodUpdate: {
      checkout?: {
        id: string
        totalPrice?: { gross: { amount: number; currency: string } }
      }
      errors: Array<{ field?: string; message: string; code?: string }>
    }
  }>({
    query: mutation,
    variables: {
      id: checkoutId,
      deliveryMethodId,
    },
  })

  const payload = res.data?.checkoutDeliveryMethodUpdate
  if (payload?.errors && payload.errors.length > 0) {
    return { success: false, errors: payload.errors }
  }

  return {
    success: true,
    totalPrice: payload?.checkout?.totalPrice,
  }
}

/**
 * Real Saleor Mutation: Create payment transaction
 */
export async function createSaleorTransaction(
  checkoutId: string,
  input: {
    amount: number
    currency: string
    name?: string
    pspReference?: string
  },
): Promise<{
  success: boolean
  transactionId?: string
  errors?: Array<{ field?: string; message: string; code?: string }>
}> {
  const mutation = `
    mutation CreateSaleorTransaction($id: ID!, $transaction: TransactionCreateInput!) {
      transactionCreate(id: $id, transaction: $transaction) {
        transaction {
          id
          pspReference
        }
        errors {
          field
          message
          code
        }
      }
    }
  `

  const res = await saleorFetch<{
    transactionCreate: {
      transaction?: { id: string; pspReference: string }
      errors: Array<{ field?: string; message: string; code?: string }>
    }
  }>({
    query: mutation,
    variables: {
      id: checkoutId,
      transaction: {
        name: input.name || 'Storefront Credit Card',
        message: 'Authorized & Charged',
        pspReference: input.pspReference || `tx_${Date.now()}`,
        amountCharged: {
          amount: input.amount,
          currency: input.currency || 'USD',
        },
      },
    },
  })

  const payload = res.data?.transactionCreate
  if (payload?.errors && payload.errors.length > 0) {
    return { success: false, errors: payload.errors }
  }

  return {
    success: true,
    transactionId: payload?.transaction?.id,
  }
}

/**
 * Real Saleor Mutation: Complete checkout and convert to Order
 */
export async function completeSaleorCheckout(checkoutId: string): Promise<{
  success: boolean
  order?: {
    id: string
    number: string
    status: string
    total?: {
      gross: {
        amount: number
        currency: string
      }
    }
  }
  errors?: Array<{ field?: string; message: string; code?: string }>
}> {
  const mutation = `
    mutation CompleteSaleorCheckout($id: ID!) {
      checkoutComplete(id: $id) {
        order {
          id
          number
          status
          total {
            gross {
              amount
              currency
            }
          }
        }
        errors {
          field
          message
          code
        }
      }
    }
  `

  const res = await saleorFetch<{
    checkoutComplete: {
      order?: {
        id: string
        number: string
        status: string
        total?: {
          gross: {
            amount: number
            currency: string
          }
        }
      }
      errors: Array<{ field?: string; message: string; code?: string }>
    }
  }>({
    query: mutation,
    variables: { id: checkoutId },
  })

  const payload = res.data?.checkoutComplete
  if (payload?.errors && payload.errors.length > 0) {
    return {
      success: false,
      errors: payload.errors,
    }
  }

  if (payload?.order) {
    return {
      success: true,
      order: payload.order,
    }
  }

  return {
    success: false,
    errors: res.errors || [{ message: 'Failed to complete checkout' }],
  }
}
