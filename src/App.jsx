import { useEffect, useRef, useState } from 'react'
import './App.css'

function App() {
  return (
    <div className="App">
      <SnakeGame />
    </div>
  )
}

function SnakeGame() {
  const canvasRef = useRef(null)
  const gameStateRef = useRef({
    snake: [],
    food: {},
    direction: {},
    inputQueue: [],
    gameLoop: null,
    isGameOver: false
  })
  const [score, setScore] = useState(0)
  const [highScore, setHighScore] = useState(parseInt(localStorage.getItem('snakeHighScore')) || 0)
  const [gameOver, setGameOver] = useState(false)
  const [finalScore, setFinalScore] = useState(0)

  const GRID_SIZE = 20
  const TILE_COUNT = 20
  const GAME_SPEED = 100

  const DIRECTIONS = {
    UP: { x: 0, y: -1 },
    DOWN: { x: 0, y: 1 },
    LEFT: { x: -1, y: 0 },
    RIGHT: { x: 1, y: 0 }
  }

  useEffect(() => {
    initGame()
    // Focus the canvas so keyboard works immediately
    if (canvasRef.current) canvasRef.current.focus()
    
    window.addEventListener('keydown', handleKeyPress)
    return () => {
      if (gameStateRef.current.gameLoop) clearInterval(gameStateRef.current.gameLoop)
      window.removeEventListener('keydown', handleKeyPress)
    }
  }, [])

  function initGame() {
    gameStateRef.current.snake = [
      { x: 10, y: 10 },
      { x: 10, y: 11 },
      { x: 10, y: 12 }
    ]

    gameStateRef.current.direction = DIRECTIONS.UP
    gameStateRef.current.inputQueue = []

    setScore(0)
    setGameOver(false)
    gameStateRef.current.isGameOver = false

    spawnFood()

    if (gameStateRef.current.gameLoop) clearInterval(gameStateRef.current.gameLoop)
    gameStateRef.current.gameLoop = setInterval(updateGame, GAME_SPEED)
  }

  function spawnFood() {
    let validPosition = false
    while (!validPosition) {
      const newFood = {
        x: Math.floor(Math.random() * TILE_COUNT),
        y: Math.floor(Math.random() * TILE_COUNT)
      }
      validPosition = !gameStateRef.current.snake.some(segment =>
        segment.x === newFood.x && segment.y === newFood.y
      )
      if (validPosition) gameStateRef.current.food = newFood
    }
  }

  function updateGame() {
    if (gameStateRef.current.isGameOver) return

    if (gameStateRef.current.inputQueue.length > 0) {
      gameStateRef.current.direction = gameStateRef.current.inputQueue.shift()
    }

    const newHead = {
      x: gameStateRef.current.snake[0].x + gameStateRef.current.direction.x,
      y: gameStateRef.current.snake[0].y + gameStateRef.current.direction.y
    }

    // Wrap around edges
    if (newHead.x < 0) newHead.x = TILE_COUNT - 1
    else if (newHead.x >= TILE_COUNT) newHead.x = 0
    if (newHead.y < 0) newHead.y = TILE_COUNT - 1
    else if (newHead.y >= TILE_COUNT) newHead.y = 0

    // Check collision with self
    if (gameStateRef.current.snake.some(segment => segment.x === newHead.x && segment.y === newHead.y)) {
      endGame()
      return
    }

    gameStateRef.current.snake.unshift(newHead)

    // Check food collision
    if (newHead.x === gameStateRef.current.food.x && newHead.y === gameStateRef.current.food.y) {
      setScore(prev => {
        const newScore = prev + 1
        if (newScore % 5 === 0) {
          clearInterval(gameStateRef.current.gameLoop)
          const newSpeed = Math.max(50, GAME_SPEED - (newScore * 2))
          gameStateRef.current.gameLoop = setInterval(updateGame, newSpeed)
        }
        return newScore
      })
      spawnFood()
      playSound(440, 'square', 0.1)
    } else {
      gameStateRef.current.snake.pop()
    }

    render()
  }

  function render() {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')

    ctx.fillStyle = '#1a252f'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    ctx.strokeStyle = '#2c3e50'
    ctx.lineWidth = 0.5
    for (let i = 0; i <= TILE_COUNT; i++) {
      ctx.beginPath()
      ctx.moveTo(i * GRID_SIZE, 0)
      ctx.lineTo(i * GRID_SIZE, canvas.height)
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(0, i * GRID_SIZE)
      ctx.lineTo(canvas.width, i * GRID_SIZE)
      ctx.stroke()
    }

    gameStateRef.current.snake.forEach((segment, index) => {
      if (index === 0) {
        ctx.fillStyle = '#2ecc71'
        drawRoundedRect(ctx, segment.x * GRID_SIZE + 1, segment.y * GRID_SIZE + 1, GRID_SIZE - 2, GRID_SIZE - 2, 4)
        ctx.fillStyle = 'black'
        const eyeSize = 2
        if (gameStateRef.current.direction === DIRECTIONS.RIGHT || gameStateRef.current.direction === DIRECTIONS.LEFT) {
          ctx.fillRect(segment.x * GRID_SIZE + 10, segment.y * GRID_SIZE + 5, eyeSize, eyeSize)
          ctx.fillRect(segment.x * GRID_SIZE + 10, segment.y * GRID_SIZE + 13, eyeSize, eyeSize)
        } else {
          ctx.fillRect(segment.x * GRID_SIZE + 5, segment.y * GRID_SIZE + 10, eyeSize, eyeSize)
          ctx.fillRect(segment.x * GRID_SIZE + 13, segment.y * GRID_SIZE + 10, eyeSize, eyeSize)
        }
      } else {
        const greenValue = Math.max(100, 204 - (index * 8))
        ctx.fillStyle = `rgb(46, ${greenValue}, 113)`
        drawRoundedRect(ctx, segment.x * GRID_SIZE + 1, segment.y * GRID_SIZE + 1, GRID_SIZE - 2, GRID_SIZE - 2, 4)
      }
    })

    ctx.fillStyle = '#e74c3c'
    drawRoundedRect(ctx, gameStateRef.current.food.x * GRID_SIZE + 2, gameStateRef.current.food.y * GRID_SIZE + 2, GRID_SIZE - 4, GRID_SIZE - 4, 6)
  }

  function drawRoundedRect(ctx, x, y, width, height, radius) {
    ctx.beginPath()
    ctx.moveTo(x + radius, y)
    ctx.lineTo(x + width - radius, y)
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius)
    ctx.lineTo(x + width, y + height - radius)
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height)
    ctx.lineTo(x + radius, y + height)
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius)
    ctx.lineTo(x, y + radius)
    ctx.quadraticCurveTo(x, y, x + radius, y)
    ctx.closePath()
    ctx.fill()
  }

  function playSound(freq, type = 'square', duration = 0.1) {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)()
      const osc = audioCtx.createOscillator()
      const gain = audioCtx.createGain()
      osc.type = type
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime)
      osc.connect(gain)
      gain.connect(audioCtx.destination)
      gain.gain.setValueAtTime(0.1, audioCtx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration)
      osc.start()
      osc.stop(audioCtx.currentTime + duration)
    } catch (e) {}
  }

  function endGame() {
    gameStateRef.current.isGameOver = true
    clearInterval(gameStateRef.current.gameLoop)
    if (score > highScore) {
      setHighScore(score)
      localStorage.setItem('snakeHighScore', score)
    }
    setFinalScore(score)
    setGameOver(true)
    playSound(150, 'sawtooth', 0.5)
  }

  function setDirection(newDir) {
    const lastDir = gameStateRef.current.inputQueue.length > 0 
      ? gameStateRef.current.inputQueue[gameStateRef.current.inputQueue.length - 1] 
      : gameStateRef.current.direction
    if (newDir === DIRECTIONS.UP && lastDir !== DIRECTIONS.DOWN) gameStateRef.current.inputQueue.push(DIRECTIONS.UP)
    if (newDir === DIRECTIONS.DOWN && lastDir !== DIRECTIONS.UP) gameStateRef.current.inputQueue.push(DIRECTIONS.DOWN)
    if (newDir === DIRECTIONS.LEFT && lastDir !== DIRECTIONS.RIGHT) gameStateRef.current.inputQueue.push(DIRECTIONS.LEFT)
    if (newDir === DIRECTIONS.RIGHT && lastDir !== DIRECTIONS.LEFT) gameStateRef.current.inputQueue.push(DIRECTIONS.RIGHT)
    if (gameStateRef.current.inputQueue.length > 2) gameStateRef.current.inputQueue.shift()
  }

  function handleKeyPress(event) {
    switch (event.key) {
      case 'ArrowUp': setDirection(DIRECTIONS.UP); break;
      case 'ArrowDown': setDirection(DIRECTIONS.DOWN); break;
      case 'ArrowLeft': setDirection(DIRECTIONS.LEFT); break;
      case 'ArrowRight': setDirection(DIRECTIONS.RIGHT); break;
    }
  }

  return (
    <div className="game-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: 'white' }}>
      <div className="score-board">
        <h2 style={{ margin: '10px 0' }}>Score: {score} | High Score: {highScore}</h2>
      </div>
      <canvas
        ref={canvasRef}
        width={TILE_COUNT * GRID_SIZE}
        height={TILE_COUNT * GRID_SIZE}
        tabIndex="0"
        style={{ border: '4px solid #2c3e50', borderRadius: '8px', outline: 'none', background: '#1a252f' }}
      />
      {gameOver && (
        <div style={{ position: 'absolute', top: '50%', textAlign: 'center', background: 'rgba(0,0,0,0.8)', padding: '20px', borderRadius: '10px' }}>
          <h1>GAME OVER</h1>
          <p>Final Score: {finalScore}</p>
          <button onClick={initGame} style={{ padding: '10px 20px', cursor: 'pointer' }}>Play Again</button>
        </div>
      )}
    </div>
  )
}

export default App;
