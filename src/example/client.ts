import { TcpClient } from '../tcp-client'

async function run () {
  const client = new TcpClient({
    port: 1337,
    secret: 'supersecretstring'
  })
  client.on('close', () => {
    console.log('close')
  })
  client.on('connect', () => {
    console.log('connect')
  })
  client.on('error', () => {
    console.log('error')
  })

  await client.connect()
  const response = await client.send('/app/test', { test: 123 })
  console.log(response)
}

run()
