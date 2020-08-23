import { useState, useEffect, useRef } from 'react'
import Xwiper from 'xwiper'

function roundRect(ctx, x, y, w, h, radius) {
  var r = x + w
  var b = y + h
  ctx.beginPath()
  ctx.strokeStyle = 'green'
  ctx.lineWidth = '4'
  ctx.moveTo(x + radius, y)
  ctx.lineTo(r - radius, y)
  ctx.quadraticCurveTo(r, y, r, y + radius)
  ctx.lineTo(r, y + h - radius)
  ctx.quadraticCurveTo(r, b, r - radius, b)
  ctx.lineTo(x + radius, b)
  ctx.quadraticCurveTo(x, b, x, b - radius)
  ctx.lineTo(x, y + radius)
  ctx.quadraticCurveTo(x, y, x + radius, y)
  ctx.fill()
}

const useAnimationFrame = (callback) => {
  // Use useRef for mutable variables that we want to persist
  // without triggering a re-render on their change
  const requestRef = useRef()
  const previousTimeRef = useRef()

  const animate = (time) => {
    if (previousTimeRef.current != undefined) {
      const deltaTime = time - previousTimeRef.current
      callback(deltaTime)
    }
    previousTimeRef.current = time
    requestRef.current = requestAnimationFrame(animate)
  }

  useEffect(() => {
    requestRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(requestRef.current)
  }, []) // Make sure the effect runs only once
}

const getDirMatrix = (dir) => {
  switch (dir) {
    case 'RIGHT':
      return { x: 1, y: 0 }
    case 'DOWN':
      return { x: 0, y: 1 }
    case 'LEFT':
      return { x: -1, y: 0 }
    case 'UP':
      return { x: 0, y: -1 }
    default:
      throw new Error('Invalid direction')
  }
}

const isSame = (p1, p2) => {
  return p1.x === p2.x && p1.y === p2.y
}

const collides = (a1, a2) => {
  return a1.some((a1e) => {
    return a2.some((a2e) => {
      return isSame(a1e, a2e)
    })
  })
}

const collidesWithItself = (a1) => {
  return a1.some((a1e, i) => {
    return a1.some((a2e, j) => {
      if (i === j) return false

      return isSame(a1e, a2e)
    })
  })
}

const getScores = () => {
  try {
    const list = JSON.parse(localStorage.getItem('juhg_snake_scores'))
    if (!list) return []
    return list
  } catch (e) {
    return []
  }
}

const addScore = (score) => {
  localStorage.setItem(
    'juhg_snake_scores',
    JSON.stringify([
      {
        ts: new Date().getTime(),
        score,
      },
      ...getScores(),
    ])
  )
}

const getDirectionByKey = (key) => {
  switch (key) {
    case 'ArrowUp':
      return 'UP'
    case 'ArrowDown':
      return 'DOWN'
    case 'ArrowRight':
      return 'RIGHT'
    case 'ArrowLeft':
      return 'LEFT'
    default:
      throw new Error('Invalid key')
  }
}

const drawApple = (ctx, apple) => {
  if (!apple) {
    return
  }

  ctx.fillStyle = '#E53E3E'
  roundRect(ctx, apple.x * piece, apple.y * piece, piece, piece, piece / 3)
}

const drawSnake = (ctx, snake) => {
  snake.forEach((s, i) => {
    if (0 === i) {
      ctx.fillStyle = '#276749'
    } else {
      ctx.fillStyle = '#2F855A'
    }

    roundRect(ctx, s.x * piece, s.y * piece, piece, piece, piece / 3)
  })
}

const canvas = 360
const size = 24
const piece = canvas / size
const baseSpeed = 150
const ts = new Date().getTime()

export default function Snake() {
  const [speed, setSpeed] = useState(baseSpeed)
  const [dir, setDir] = useState(['RIGHT'])
  const [tick, setTick] = useState(0)
  const [snake, setSnake] = useState([
    { x: 2, y: 0, dir: 'RIGHT' },
    { x: 1, y: 0, dir: 'RIGHT' },
    { x: 0, y: 0, dir: 'RIGHT' },
  ])
  const [anim, setAnim] = useState([])
  const [apple, setApple] = useState(null)
  const [scores, setScores] = useState(null)

  const el = useRef(null)
  const [ctx, setCtx] = useState(null)
  const [ws, setWs] = useState(null)

  useEffect(() => {
    if (!el) return
    const newCtx = el.current.getContext('2d')
    setCtx(newCtx)
    newCtx.canvas.width = canvas
    newCtx.canvas.height = canvas
  }, [el])

  useEffect(() => {
    if (!ctx) return
    ctx.clearRect(0, 0, canvas, canvas)
    drawSnake(ctx, anim)
    drawApple(ctx, apple)
  }, [ctx, anim, apple])

  const getNextDir = (current, next) => {
    const nextDir = next[0]

    switch (current) {
      case 'UP':
        if (['DOWN', 'UP'].indexOf(nextDir) > -1 && next.length > 1) {
          const fallback = next.splice(1)
          setDir(fallback)
          return getNextDir(current, fallback)
        }
        if ('DOWN' === nextDir) return 'UP'
        return nextDir

      case 'DOWN':
        if (['UP', 'DOWN'].indexOf(nextDir) > -1 && next.length > 1) {
          const fallback = next.splice(1)
          setDir(fallback)
          return getNextDir(current, fallback)
        }
        if ('UP' === nextDir) return 'DOWN'
        return nextDir

      case 'LEFT':
        if (['RIGHT', 'LEFT'].indexOf(nextDir) > -1 && next.length > 1) {
          const fallback = next.splice(1)
          setDir(fallback)
          return getNextDir(current, fallback)
        }
        if ('RIGHT' === nextDir) return 'LEFT'
        return nextDir

      case 'RIGHT':
        if (['LEFT', 'RIGHT'].indexOf(nextDir) > -1 && next.length > 1) {
          const fallback = next.splice(1)
          setDir(fallback)
          return getNextDir(current, fallback)
        }
        if ('LEFT' === nextDir) return 'RIGHT'
        return nextDir
    }
  }

  useEffect(() => {
    if (tick < speed) {
      return
    }
    setTick(0)

    setSnake((prev) =>
      prev.map((s, i) => {
        const nextDir = getNextDir(s.dir, dir)
        if (dir.length > 1) {
          setDir((prev) => {
            if (!prev || prev.length < 2) {
              return prev
            }

            return prev.splice(1)
          })
        }

        const dirMatrix = getDirMatrix(nextDir)

        return 0 !== i
          ? prev[i - 1]
          : {
              dir: nextDir,
              x: s.x + dirMatrix.x,
              y: s.y + dirMatrix.y,
            }
      })
    )
  }, [tick])

  useAnimationFrame((t) => {
    setTick((prev) => prev + t)
  })

  useEffect(() => {
    setAnim(
      snake.map((s) => {
        const dirMatrix = getDirMatrix(s.dir)

        return {
          x: s.x - dirMatrix.x + (dirMatrix.x * tick) / speed,
          y: s.y - dirMatrix.y + (dirMatrix.y * tick) / speed,
        }
      })
    )
  }, [tick])

  const placeApple = () => {
    const newPos = {
      x: Math.round(Math.random() * (size - 1)),
      y: Math.round(Math.random() * (size - 1)),
    }

    if (collides([newPos], snake)) {
      placeApple()
      return
    }

    setApple(newPos)
  }

  useEffect(() => {
    placeApple()

    const sc = getScores()
    if (sc.length) {
      setScores({
        last: sc[0].score,
        max: Math.max(...sc.map((s) => s.score)),
      })
    }

    const xwiper = new Xwiper('#game')
    xwiper.onSwipeLeft(() => {
      const nextDir = 'LEFT'
      setDir((prev) => {
        if (prev.length && prev[prev.length - 1] === nextDir) return prev
        return [...prev, nextDir]
      })
    })
    xwiper.onSwipeRight(() => {
      const nextDir = 'RIGHT'
      setDir((prev) => {
        if (prev.length && prev[prev.length - 1] === nextDir) return prev
        return [...prev, nextDir]
      })
    })
    xwiper.onSwipeUp(() => {
      const nextDir = 'UP'
      setDir((prev) => {
        if (prev.length && prev[prev.length - 1] === nextDir) return prev
        return [...prev, nextDir]
      })
    })
    xwiper.onSwipeDown(() => {
      const nextDir = 'DOWN'
      setDir((prev) => {
        if (prev.length && prev[prev.length - 1] === nextDir) return prev
        return [...prev, nextDir]
      })
    })
  }, [])

  useEffect(() => {
    if (!apple) return
    if (isSame(snake[0], apple)) {
      placeApple()
      setSnake((prev) => {
        const last = { ...prev[prev.length - 1] }
        const dirMatrix = getDirMatrix(last.dir)

        return [
          ...prev,
          { ...last, x: last.x - dirMatrix.x, y: last.y - dirMatrix.y },
        ]
      })
      setSpeed((prev) => prev * 0.96)
    }
  }, [snake])

  useEffect(() => {
    const head = snake[0]

    if (head.x < 0 || head.y < 0 || head.x + 1 > size || head.y + 1 > size) {
      setSpeed(Infinity)
      addScore(snake.length)

      const sc = getScores()
      if (sc.length) {
        setScores({
          last: sc[0].score,
          max: Math.max(...sc.map((s) => s.score)),
        })
      }
    }

    if (collidesWithItself(snake)) {
      setSpeed(Infinity)
      addScore(snake.length)

      const sc = getScores()
      if (sc.length) {
        setScores({
          last: sc[0].score,
          max: Math.max(...sc.map((s) => s.score)),
        })
      }
    }
  }, [snake])

  useEffect(() => {
    if ('undefined' === typeof WebSocket) return
    const url = `wss://${window.location.hostname}:9898/`
    console.log(`Connecting to ${url}`)
    const newWs = new WebSocket(url)
    setWs(newWs)

    newWs.onopen = () => {
      newWs.send(
        JSON.stringify({
          type: 'start',
          name: ts,
        })
      )
    }

    newWs.onmessage = (e) => {
      const data = JSON.parse(e.data)

      switch (data.type) {
        case 'start':
          console.log(data)
          return

        case 'move':
          console.log(data.dir)
          if (!data.dir) return
          setDir((prev) => {
            console.log(prev, data.dir)
            if (prev.length && prev[prev.length - 1] === data.dir) return prev
            return [...prev, data.dir]
          })
          return

        case 'join':
          console.log(data)
          return

        default:
          throw new Error('Invalid data type.')
      }
    }
  }, [])

  const handleKeyDown = (e) => {
    if (
      ['ArrowUp', 'ArrowDown', 'ArrowRight', 'ArrowLeft'].indexOf(e.key) < 0
    ) {
      return
    }

    const nextDir = getDirectionByKey(e.key)
    onDirChange(nextDir)
  }

  const onDirChange = (nextDir) => {
    if (ws) {
      ws.send(
        JSON.stringify({
          type: 'move',
          dir: nextDir,
          ts: new Date().getTime(),
        })
      )
    }

    // setDir((prev) => {
    //   if (prev.length && prev[prev.length - 1] === nextDir) return prev
    //   return [...prev, nextDir]
    // })
  }

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [handleKeyDown])

  return (
    <div
      id="game"
      className="overflow-hidden h-game w-screen flex flex-col items-center justify-between"
    >
      {scores ? (
        <div className="self-stretch flex justify-around items-center text-lg p-3 w-full text-center bg-gray-100">
          <p>Last score: {scores.last}</p>
          <p>Max score: {scores.max}</p>
          <button
            onClick={() => location.reload()}
            className="py-1 px-2 rounded border-2 border-gray-500 hover:border-black"
          >
            restart
          </button>
        </div>
      ) : (
        <div className="text-lg p-3 w-full text-center bg-gray-100">
          Hey there! This is just snake
        </div>
      )}
      <div className="flex-1 flex items-center justify-center">
        <canvas
          ref={el}
          id="canvas"
          className="bg-blue-300 rounded-lg"
        ></canvas>
      </div>
      <div className="text-lg p-3 w-full text-center bg-gray-100">
        📱 On mobile just swipe in a direction!
      </div>
      <div className="text-lg p-3 w-full text-center bg-gray-100">
        Created by Gábor // <a href="https://juhg.hu">juhg.hu</a> // @juhgabor
      </div>
    </div>
  )
}
