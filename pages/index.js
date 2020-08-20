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

const speed = 200
const canvas = 500
const piece = canvas / 20

export default function Snake() {
  const [dir, setDir] = useState('RIGHT')
  const [tick, setTick] = useState(0)
  const [snake, setSnake] = useState([
    { x: 2, y: 0, dir: 'RIGHT' },
    { x: 1, y: 0, dir: 'RIGHT' },
    { x: 0, y: 0, dir: 'RIGHT' },
  ])
  const [anim, setAnim] = useState([])

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

      roundRect(ctx, s.x, s.y, piece, piece, piece / 3)
    })
  }, [anim])

  useEffect(() => {
    if (tick > speed) {
      setTick(0)

      setSnake((prev) =>
        prev.map((s, i) => {
          const nextDir = getNextDir(s.dir, dir)
          const dirMatrix = getDirMatrix(nextDir)

          return 0 !== i
            ? prev[i - 1]
            : {
                dir: nextDir,
                x: s.x + 1 * dirMatrix.x,
                y: s.y + 1 * dirMatrix.y,
              }
        })
      )
    }
  }, [tick])

  useAnimationFrame((t) => {
    setTick((prev) => prev + t)
  })

  useEffect(() => {
    setAnim(
      snake.map((s) => {
        const dirMatrix = getDirMatrix(s.dir)

        return {
          x: (s.x - dirMatrix.x) * piece + (dirMatrix.x * tick * piece) / speed,
          y: (s.y - dirMatrix.y) * piece + (dirMatrix.y * tick * piece) / speed,
        }
      })
    )
  }, [tick])

  const handleKeyDown = (e) => {
    switch (e.key) {
      case 'ArrowUp':
        return setDir('UP')
      case 'ArrowDown':
        return setDir('DOWN')
      case 'ArrowRight':
        return setDir('RIGHT')
      case 'ArrowLeft':
        return setDir('LEFT')
    }
  }

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [handleKeyDown])

  return (
    <div>
      <canvas id="canvas" className="bg-blue-300"></canvas>
    </div>
  )
}
