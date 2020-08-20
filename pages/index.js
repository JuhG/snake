import { useEffect, useRef, useState } from 'react'

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

const speed = 0.02
const size = 500

export default function Home() {
  const [count, setCount] = useState(0)
  const [snake, setSnake] = useState([
    {
      x: 0,
      y: size / 2 - size / 20 / 2,
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

    ctx.clearRect(0, 0, size, size)
    ctx.strokeRect(0, 0, size, size)

    if (snake[0].x > 50 && snake.length === 1) {
      snake.push({
        x: snake[0].x - size / 20 + 1,
        y: snake[0].y,
      })
    }

    snake.forEach((s) => {
      ctx.fillRect(s.x, s.y, size / 20, size / 20, 20)
    })
  }, [snake])

  useAnimationFrame((deltaTime) => {
    setSnake((prev) =>
      prev.map((s) => ({
        ...s,
        x: s.x + deltaTime * speed,
      }))
    )

    // Pass on a function to the setter of the state
    // to make sure we always have the latest state
    setCount((prev) => prev + deltaTime * speed)
  })

  return (
    <div>
      <div>{Math.round(count)}</div>
      <canvas id="canvas"></canvas>
    </div>
  )
}
