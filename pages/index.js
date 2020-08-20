import { useEffect, useRef, useState } from 'react'

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

const useAnimationFrame = (callback, deps = []) => {
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
  }, deps) // Make sure the effect runs only once
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

const speed = 0.1
const canvas = 500
const piece = canvas / 20

export default function Home() {
  const [dir, setDir] = useState('RIGHT')
  const [sum, setSum] = useState(canvas / 2)
  const [snake, setSnake] = useState([
    {
      x: 0,
      y: canvas / 2,
      dir: 'RIGHT',
    },
  ])

  useEffect(() => {
    var canvas = document.getElementById('canvas')
    if (!canvas.getContext) {
      return
    }

    var ctx = canvas.getContext('2d')
    ctx.canvas.width = window.innerWidth
    ctx.canvas.height = window.innerHeight

    ctx.clearRect(0, 0, canvas, canvas)
    ctx.fillStyle = '#2B6CB0'

    if (snake[0].x > 100 && snake.length === 1) {
      snake.push({
        x: snake[0].x - piece,
        y: snake[0].y,
        dir: snake[0].dir,
      })
      snake.push({
        x: snake[0].x - piece * 2,
        y: snake[0].y,
        dir: snake[0].dir,
      })
    }

    snake.forEach((s) => {
      // ctx.fillRect(s.x, s.y, piece, piece, 20)
      roundRect(ctx, s.x, s.y, piece, piece, 5)
    })
  }, [snake])

  useAnimationFrame(
    (deltaTime) => {
      setSnake((prev) => {
        let change = false
        setSum(sum + deltaTime)
        if (sum > (piece / speed) * 0.9) {
          change = true
          setSum(0)
        }

        return prev.map((s, i) => {
          let nextDir = s.dir
          if (change) {
            if (i === 0) {
              nextDir = getNextDir(s.dir, dir)
            } else {
              nextDir = prev[i - 1].dir
            }
          }
          const dirMatrix = getDirMatrix(nextDir)

          const x = s.x + dirMatrix.x * deltaTime * speed
          const y = s.y + dirMatrix.y * deltaTime * speed

          return {
            x: change && nextDir !== s.dir ? Math.round(x / piece) * piece : x,
            y: change && nextDir !== s.dir ? Math.round(y / piece) * piece : y,
            dir: nextDir,
          }
        })
      })
    },
    [sum]
  )

  const handleKeyDown = (e) => {
    switch (e.key) {
      case 'ArrowUp':
        if ('DOWN' === dir) return
        return setDir('UP')
      case 'ArrowDown':
        if ('UP' === dir) return
        return setDir('DOWN')
      case 'ArrowRight':
        if ('LEFT' === dir) return
        return setDir('RIGHT')
      case 'ArrowLeft':
        if ('RIGHT' === dir) return
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
