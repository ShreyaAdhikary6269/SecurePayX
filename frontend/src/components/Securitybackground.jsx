import { useEffect, useRef } from 'react'

export default function SecurityBackground({
  className = '',
  density = 80,
  color = '5, 150, 105',
  linkDistance = 150,
}) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')

    let width = 0
    let height = 0
    let particles = []
    let rafId

    const GLYPHS = ['$', 'Rs']

    function resize() {
      const dpr = window.devicePixelRatio || 1
      width = canvas.offsetWidth || window.innerWidth
      height = canvas.offsetHeight || window.innerHeight
      canvas.width = width * dpr
      canvas.height = height * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      init()
    }

    function init() {
      particles = Array.from({ length: density }).map(() => {
        const isGlyph = Math.random() < 0.14
        return {
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 0.45,
          vy: (Math.random() - 0.5) * 0.45,
          r: isGlyph ? 0 : Math.random() * 2.2 + 1.8,
          glyph: isGlyph ? GLYPHS[Math.floor(Math.random() * GLYPHS.length)] : null,
        }
      })
    }

    function step() {
      ctx.clearRect(0, 0, width, height)

      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const a = particles[i]
          const b = particles[j]
          const dx = a.x - b.x
          const dy = a.y - b.y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < linkDistance) {
            const alpha = (1 - dist / linkDistance) * 0.55
            ctx.strokeStyle = `rgba(${color}, ${alpha})`
            ctx.lineWidth = 1.2
            ctx.beginPath()
            ctx.moveTo(a.x, a.y)
            ctx.lineTo(b.x, b.y)
            ctx.stroke()
          }
        }
      }

      particles.forEach((p) => {
        if (p.glyph) {
          ctx.fillStyle = `rgba(${color}, 0.85)`
          ctx.font = 'bold 15px "IBM Plex Sans", sans-serif'
          ctx.fillText(p.glyph, p.x, p.y)
        } else {
          ctx.fillStyle = `rgba(${color}, 0.9)`
          ctx.beginPath()
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
          ctx.fill()
        }

        p.x += p.vx
        p.y += p.vy

        if (p.x < -20) p.x = width + 20
        if (p.x > width + 20) p.x = -20
        if (p.y < -20) p.y = height + 20
        if (p.y > height + 20) p.y = -20
      })

      rafId = requestAnimationFrame(step)
    }

    resize()
    step()

    const handleResize = () => resize()
    window.addEventListener('resize', handleResize)

    return () => {
      cancelAnimationFrame(rafId)
      window.removeEventListener('resize', handleResize)
    }
  }, [density, color, linkDistance])

  return <canvas ref={canvasRef} className={`absolute inset-0 w-full h-full ${className}`} />
}