import { readFile, stat } from 'node:fs/promises'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'
import app from './dist/server/server.js'

const PORT = Number(process.env.PORT) || 3000
const CLIENT_DIR = join(process.cwd(), 'dist/client')

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
}

const server = createServer(async (req, res) => {
  try {
    const host = req.headers.host || 'localhost'
    const url = new URL(req.url, `http://${host}`)

    // 0. Health check endpoint
    if (url.pathname === '/healthz') {
      res.writeHead(200, { 'Content-Type': 'application/json' })
      return res.end(
        JSON.stringify({
          status: 'ok',
          service: 'bdgy-storefront',
          uptime: process.uptime(),
        }),
      )
    }

    // 1. Static asset check from dist/client
    if (url.pathname !== '/' && !url.pathname.endsWith('/')) {
      const filePath = join(CLIENT_DIR, url.pathname)
      try {
        const fileStat = await stat(filePath)
        if (fileStat.isFile()) {
          const data = await readFile(filePath)
          const ext = extname(filePath).toLowerCase()
          res.writeHead(200, {
            'Content-Type': MIME_TYPES[ext] || 'application/octet-stream',
            'Cache-Control': 'public, max-age=31536000, immutable',
          })
          return res.end(data)
        }
      } catch {}
    }

    // 2. Delegate to TanStack Start SSR handler
    const headers = new Headers()
    for (const [key, value] of Object.entries(req.headers)) {
      if (value) {
        if (Array.isArray(value)) {
          for (const v of value) headers.append(key, v)
        } else {
          headers.set(key, value)
        }
      }
    }

    const webReq = new Request(url.href, {
      method: req.method,
      headers,
      body: req.method !== 'GET' && req.method !== 'HEAD' ? req : undefined,
      duplex: 'half',
    })

    const webRes = await app.fetch(webReq)

    const responseHeaders = {}
    webRes.headers.forEach((val, key) => {
      responseHeaders[key] = val
    })

    res.writeHead(webRes.status, responseHeaders)

    if (webRes.body) {
      const reader = webRes.body.getReader()
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        res.write(value)
      }
    }
    res.end()
  } catch (err) {
    console.error('SSR Server Error:', err)
    if (!res.headersSent) {
      res.writeHead(500, { 'Content-Type': 'text/plain' })
    }
    res.end('Internal Server Error')
  }
})

server.listen(PORT, '0.0.0.0', () => {
  console.log(`[BDGY Storefront] SSR Node Server listening on http://0.0.0.0:${PORT}`)
})
