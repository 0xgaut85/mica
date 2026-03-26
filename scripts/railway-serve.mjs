import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import fs from 'node:fs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const distDir = path.join(root, 'dist')
const serveMain = path.join(root, 'node_modules', 'serve', 'build', 'main.js')

if (!fs.existsSync(distDir)) {
  console.error('railway-serve: dist/ missing — run npm run build before start')
  process.exit(1)
}
if (!fs.existsSync(serveMain)) {
  console.error('railway-serve: serve package not installed')
  process.exit(1)
}

const port = process.env.PORT || '3000'
const child = spawn(process.execPath, [serveMain, 'dist', '-s', '-l', `tcp://0.0.0.0:${port}`], {
  cwd: root,
  stdio: 'inherit',
  env: process.env,
})

child.on('exit', (code, signal) => {
  if (signal) process.kill(process.pid, signal)
  process.exit(code ?? 1)
})
