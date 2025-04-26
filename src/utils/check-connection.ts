import { connect } from 'net'

export function checkInternet(): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = connect({ host: '1.1.1.1', port: 53, timeout: 3000 }, () => {
      socket.destroy()
      resolve(true)
    })

    socket.on('connect', () => {
      socket.destroy()
      resolve(true)
    })

    socket.on('error', () => {
      socket.destroy()
      resolve(false)
    })

    socket.on('timeout', () => {
      socket.destroy()
      resolve(false)
    })
  })
}
