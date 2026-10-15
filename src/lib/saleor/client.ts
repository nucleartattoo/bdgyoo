export interface SaleorConfig {
  endpoint: string
  channel: string
  token?: string
}

const STORAGE_ENDPOINT_KEY = 'bdgy_saleor_endpoint_override'
const STORAGE_CHANNEL_KEY = 'bdgy_saleor_channel_override'
const STORAGE_TOKEN_KEY = 'bdgy_saleor_token_override'

export function getSaleorConfig(): SaleorConfig {
  let endpoint = 'http://localhost:8003/graphql/'
  let channel = 'bdgy-channel'
  let token = 'Se9kT7tiDTO9buCbGYxTNhA4tvnuwg'

  if (typeof window !== 'undefined') {
    const savedEndpoint = localStorage.getItem(STORAGE_ENDPOINT_KEY)
    if (savedEndpoint) endpoint = savedEndpoint

    const savedChannel = localStorage.getItem(STORAGE_CHANNEL_KEY)
    if (savedChannel) channel = savedChannel

    const savedToken = localStorage.getItem(STORAGE_TOKEN_KEY)
    if (savedToken) token = savedToken
  } else {
    if (typeof process !== 'undefined' && process.env?.SALEOR_API_ENDPOINT) {
      endpoint = process.env.SALEOR_API_ENDPOINT
    }
    if (typeof process !== 'undefined' && process.env?.SALEOR_CHANNEL) {
      channel = process.env.SALEOR_CHANNEL
    }
    if (typeof process !== 'undefined' && process.env?.SALEOR_APP_TOKEN) {
      token = process.env.SALEOR_APP_TOKEN
    }
  }

  return { endpoint, channel, token }
}

export function setSaleorConfig(endpoint: string, channel: string, token?: string) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_ENDPOINT_KEY, endpoint.trim())
    localStorage.setItem(STORAGE_CHANNEL_KEY, channel.trim())
    if (token) localStorage.setItem(STORAGE_TOKEN_KEY, token.trim())
  }
}

export async function saleorFetch<TData, TVariables = Record<string, any>>({
  query,
  variables = {} as TVariables,
  headers = {},
  endpointOverride,
}: {
  query: string
  variables?: TVariables
  headers?: Record<string, string>
  endpointOverride?: string
}): Promise<{ data?: TData; errors?: Array<{ message: string }> }> {
  const config = getSaleorConfig()
  const endpoint = endpointOverride || config.endpoint

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...(config.token ? { Authorization: `Bearer ${config.token}` } : {}),
        ...headers,
      },
      body: JSON.stringify({
        query,
        variables: {
          channel: config.channel,
          ...variables,
        },
      }),
    })

    if (!res.ok) {
      const errorText = await res.text()
      return {
        errors: [{ message: `HTTP ${res.status}: ${errorText}` }],
      }
    }

    return await res.json()
  } catch (error) {
    return {
      errors: [{ message: (error as Error).message }],
    }
  }
}
