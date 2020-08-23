const { createServer } = require('http')
const next = require('next')

const port = 3000
const dev = process.env.NODE_ENV !== 'production'
const app = next({ dev })
const handle = app.getRequestHandler()

app.prepare().then(() => {
  createServer((req, res) => {
    const parsedUrl = new URL(req.url, 'http://w.w')
    handle(req, res, parsedUrl)
  }).listen(port, (err) => {
    if (err) throw err
    console.log(`> Ready on http://localhost:${port}`)
  })
})

const WebSocket = require('ws')
const wss = new WebSocket.Server({ port: 9898 })

let games = []

wss.on('connection', function connection(ws) {
  console.log('WS server started')

  ws.on('message', function incoming(message) {
    const data = JSON.parse(message)

    switch (data.type) {
      case 'start':
        const game = {
          ts: new Date().getTime(),
          players: [{ name: data.name }],
        }
        games.push(game)

        ws.send(
          JSON.stringify({
            type: 'start',
            game,
          })
        )
        return

      case 'join':
        games = games.map((game) => {
          if (game.ts !== data.ts) return

          game.players.push({ name: data.name })
          return game
        })

        ws.send(
          JSON.stringify({
            type: 'join',
            game: games.find((game) => game.ts !== data.ts),
          })
        )
        return

      case 'move':
        ws.send(JSON.stringify(data))
        return

      default:
        throw new Error('Invalid data type.')
    }
  })
})
