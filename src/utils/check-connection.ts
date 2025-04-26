import { connect } from 'node:net'

export function checkInternet(): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = connect({ host: '1.1.1.1', port: 53, timeout: 3000 }, () => {
      socket.destroy()
      resolve(true)
    })

    socket
      .on('connect', () => {
        socket.destroy()
        resolve(true)
      })
      .on('error', () => {
        socket.destroy()
        resolve(false)
      })
      .on('timeout', () => {
        socket.destroy()
        resolve(false)
      })
  })
}
