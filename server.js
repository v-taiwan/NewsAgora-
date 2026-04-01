import { createServer } from 'node:http'
import { createReadStream, existsSync, statSync } from 'node:fs'
import { extname, join, normalize } from 'node:path'

const root = process.cwd()
const port = Number(process.env.PORT || 4173)
const host = '127.0.0.1'

const mimeTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp'
}

const server = createServer((req, res) => {
  const urlPath = req.url === '/' ? '/index.html' : req.url || '/index.html'
  const safePath = normalize(urlPath).replace(/^(\.\.[/\\])+/, '')
  const filePath = join(root, safePath)

  if (!existsSync(filePath) || statSync(filePath).isDirectory()) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' })
    res.end('Not found')
    return
  }

  const type = mimeTypes[extname(filePath)] || 'application/octet-stream'
  res.writeHead(200, { 'Content-Type': type })
  createReadStream(filePath).pipe(res)
})

server.listen(port, host, () => {
  console.log(`Newsagora site running at http://${host}:${port}`)
})
