// bench.ts
import { performance } from 'node:perf_hooks'

import { TcpClient } from '../client'

const CONCURRENCY = 200 // сколько запросов держим «в воздухе» одновременно
const DURATION_MS = 10_000

async function main() {
  const c = new TcpClient({ port: 1337, secret: 'supersecretstring' })
  await c.connect()

  let sent = 0
  let ok = 0
  let fail = 0
  const t0 = performance.now()

  async function fire() {
    if (performance.now() - t0 > DURATION_MS) return
    sent++
    c.send('/app/test', { test: 123 })
      .then(() => {
        ok++
        fire()
      })
      .catch(() => {
        fail++
        fire()
      })
  }

  // запустить N параллельных «лучей»
  Array.from({ length: CONCURRENCY }, fire)

  // подождать завершения
  await new Promise((r) => setTimeout(r, DURATION_MS + 1000))
  console.table({ sent, ok, fail, rps: ok / (DURATION_MS / 1000) })
  c.close()
}

main()
