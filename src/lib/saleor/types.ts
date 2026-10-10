export interface Money {
  amount: number
  currency: string
}

export interface ProductMedia {
  url: string
  alt?: string
}

export interface SelectedAttribute {
  attribute: {
    id: string
    name: string
    slug: string
  }
  values: Array<{
    id: string
    name: string
    slug: string
    value?: string
  }>
}

export interface ProductVariant {
  id: string
  name: string
  sku: string
  pricing?: {
    price?: {
      gross: Money
    }
  }
  attributes: SelectedAttribute[]
  quantityAvailable?: number
}

export interface Product {
  id: string
  slug: string
  name: string
  description?: string
  thumbnail?: ProductMedia
  media?: ProductMedia[]
  category?: {
    id: string
    name: string
    slug: string
  }
  pricing?: {
    priceRange?: {
      start?: {
        gross: Money
      }
      stop?: {
        gross: Money
      }
    }
  }
  variants?: ProductVariant[]
}

export interface Category {
  id: string
  name: string
  slug: string
  description?: string
  backgroundImage?: {
    url: string
  }
  children?: Category[]
  productsCount?: number
}

export interface CartLine {
  id: string
  quantity: number
  variant: {
    id: string
    name: string
    sku: string
    pricing?: {
      price?: {
        gross: Money
      }
    }
    product: {
      id: string
      name: string
      slug: string
      thumbnail?: ProductMedia
    }
  }
}

export interface Checkout {
  id: string
  token: string
  lines: CartLine[]
  totalPrice?: {
    gross: Money
  }
  subtotalPrice?: {
    gross: Money
  }
  shippingPrice?: {
    gross: Money
  }
}
