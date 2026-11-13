import { spawn } from 'node:child_process'
import type { ChildProcess } from 'node:child_process'
import { access } from 'node:fs/promises'
import { createServer } from 'node:net'
import { resolve } from 'node:path'
import { setTimeout as delay } from 'node:timers/promises'

const fetchHttp = globalThis.fetch
async function unusedPort(): Promise<number> {
  const server = createServer()
  await new Promise<void>((ready, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', ready) })
  const address = server.address()
  await new Promise<void>((ready, reject) => server.close(error => error ? reject(error) : ready()))
  if (!address || typeof address === 'string') throw new Error('Could not allocate a local test port')
  return address.port
}

export async function startServers() {
  const jar = resolve(process.env.BACKEND_JAR || '../513-final-back/target/columbus-adventure-backend.jar')
  await access(jar).catch(() => { throw new Error(`Build the backend first with mvn package. Missing backend jar: ${jar}`) })
  const processes: ChildProcess[] = []
  let logs = ''
  const start = (command: string, args: string[], env: NodeJS.ProcessEnv) => {
    const child = spawn(command, args, { cwd: process.cwd(), env, stdio: ['ignore', 'pipe', 'pipe'] })
    child.stdout?.on('data', chunk => { logs += String(chunk) })
    child.stderr?.on('data', chunk => { logs += String(chunk) })
    child.on('error', error => { logs += error.message })
    processes.push(child)
    return child
  }
  const stop = async () => {
    await Promise.all(processes.map(async child => {
      if (child.exitCode !== null || child.signalCode !== null || !child.pid) return
      const exited = new Promise<void>(done => child.once('exit', () => done()))
      child.kill('SIGTERM')
      const timer = setTimeout(() => child.kill('SIGKILL'), 2000)
      try { await exited } finally { clearTimeout(timer) }
    }))
  }
  const ready = async (url: string, child: ChildProcess) => {
    const deadline = Date.now() + 20000
    while (Date.now() < deadline) {
      if (child.exitCode !== null || child.signalCode !== null || !child.pid) break
      try { if ((await fetchHttp(url)).ok) return } catch { /* Wait for the local listener. */ }
      await delay(50)
    }
    throw new Error(`Local integration server failed at ${url}\n${logs}`)
  }
  try {
    const backendUrl = `http://127.0.0.1:${await unusedPort()}`
    const backend = start(process.env.JAVA_BIN || 'java', ['-jar', jar], {
      ...process.env, HOST: '127.0.0.1', PORT: new URL(backendUrl).port, FRONTEND_ORIGIN: 'http://localhost:5173',
    })
    await ready(`${backendUrl}/api/health`, backend)
    const frontendUrl = `http://127.0.0.1:${await unusedPort()}`
    const frontend = start(process.execPath, ['node_modules/vite/bin/vite.js', '--host', '127.0.0.1', '--port', new URL(frontendUrl).port, '--strictPort'], {
      ...process.env, API_PROXY_TARGET: backendUrl,
    })
    await ready(`${frontendUrl}/api/health`, frontend)
    return { backendUrl, frontendUrl, stop }
  } catch (error) { await stop(); throw error }
}
