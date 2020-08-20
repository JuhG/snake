import { useState, useEffect, useRef } from 'react'

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

const getNextDir = (current, next) => {
  switch (current) {
    case 'UP':
      if ('DOWN' === next) return 'UP'
      return next
    case 'DOWN':
      if ('UP' === next) return 'DOWN'
      return next
    case 'LEFT':
      if ('RIGHT' === next) return 'LEFT'
      return next
    case 'RIGHT':
      if ('LEFT' === next) return 'RIGHT'
      return next
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

const canvas = 500
const size = 20
const piece = canvas / size

export default function Snake() {
  const [ts, setTs] = useState(0)

  const [speed, setSpeed] = useState(200)
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

  useEffect(() => {
    var el = document.getElementById('canvas')
    if (!el.getContext) {
      return
    }

    var ctx = el.getContext('2d')
    ctx.canvas.width = canvas
    ctx.canvas.height = canvas

    ctx.clearRect(0, 0, canvas, canvas)

    anim.forEach((s, i) => {
      if (0 === i) {
        ctx.fillStyle = '#276749'
      } else {
        ctx.fillStyle = '#2F855A'
      }

      roundRect(ctx, s.x * piece, s.y * piece, piece, piece, piece / 3)
    })

    if (apple) {
      ctx.fillStyle = '#E53E3E'
      roundRect(ctx, apple.x * piece, apple.y * piece, piece, piece, piece / 3)
    }
  }, [anim])

  useEffect(() => {
    if (tick < speed) {
      return
    }
    setTick(0)

    setSnake((prev) =>
      prev.map((s, i) => {
        const nextDir = getNextDir(s.dir, dir[0])
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
      setSpeed((prev) => prev * 0.98)
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

  const handleKeyDown = (e) => {
    if (
      ['ArrowUp', 'ArrowDown', 'ArrowRight', 'ArrowLeft'].indexOf(e.key) < 0
    ) {
      return
    }

    let append = false
    const current = new Date().getTime()
    if (current - ts < 250) {
      append = true
    }
    setTs(current)

    switch (e.key) {
      case 'ArrowUp':
        return append ? setDir((prev) => [...prev, 'UP']) : setDir(['UP'])
      case 'ArrowDown':
        return append ? setDir((prev) => [...prev, 'DOWN']) : setDir(['DOWN'])
      case 'ArrowRight':
        return append ? setDir((prev) => [...prev, 'RIGHT']) : setDir(['RIGHT'])
      case 'ArrowLeft':
        return append ? setDir((prev) => [...prev, 'LEFT']) : setDir(['LEFT'])
    }
  }

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [handleKeyDown])

  return (
    <div className="h-screen w-screen flex flex-col items-center justify-between">
      {scores ? (
        <div className="self-stretch flex justify-around text-xl p-4">
          <p>Last score: {scores.last}</p>
          <p>Max score: {scores.max}</p>
          <button
            onClick={() => location.reload()}
            className="py-1 px-2 rounded border-2 hover:border-black"
          >
            restart
          </button>
        </div>
      ) : (
        <div className="text-xl p-4">Hey there! This is just snake</div>
      )}
      <div className="flex items-center justify-center">
        <canvas id="canvas" className="bg-blue-300 rounded-lg"></canvas>
      </div>
      <div className="flex items-around text-xl p-4">
        Created by Gábor // juhg.hu // @juhgabor
      </div>
    </div>
  )
}
