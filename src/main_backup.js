import './style.css'

// Import all libraries (ready to use, but not using them yet)
import gsap from 'gsap'
import p5 from 'p5'
import Matter from 'matter-js'

// All libraries are now loaded and ready to use
// GSAP: For animations
// p5.js: For creative coding and canvas
// Matter.js: For 2D physics
// Tailwind CSS: Already configured via @tailwindcss/vite

console.log('✅ All libraries loaded:', {
  gsap: typeof gsap,
  p5: typeof p5,
  Matter: typeof Matter
})

// --- Fireworks-only circle mosaic (brightness + motion mask) ---
new p5((p) => {
  let vid, gfx
  let prevLum = null

  // two fixed colours (not per-pixel rainbow)
  const ORANGE = [255, 170, 40]
  const LIGHTBLUE = [120, 220, 255]

  // grid / look
  const cell = 16              // bigger = fewer circles
  const dScale = 0.3          // circle size within cell

  // mask tuning (this is the whole trick)
  const brightThresh = 0.12    // only bright fireworks pixels
  const motionThresh = 1.0    // only moving pixels (frame difference)
  const softBand = 0.07        // how wide the “outline-only” band is

  const lumFromRGB = (r, g, b) => (1.2126 * r + 1.7152 * g + 0.0722 * b) / 255

  p.setup = () => {
    const c = p.createCanvas(p.windowWidth, p.windowHeight)
    c.parent('sketch')
    p.pixelDensity(1)

    gfx = p.createGraphics(1, 2)
    gfx.pixelDensity(1)

    vid = p.createVideo('/fireworks.mp4', () => {
      vid.volume(0)
      vid.loop()
      vid.hide()
    })
  }

  p.windowResized = () => p.resizeCanvas(p.windowWidth, p.windowHeight)

  p.draw = () => {
    p.background(0)
    if (!vid || vid.elt.readyState < 2) return

    const cols = Math.floor(p.width / cell)
    const rows = Math.floor(p.height / cell)

    if (gfx.width !== cols || gfx.height !== rows) {
      gfx.resizeCanvas(cols, rows)
      prevLum = new Float32Array(cols * rows) // reset when size changes
    }

    gfx.image(vid, 0, 0, cols, rows)
    gfx.loadPixels()
    const px = gfx.pixels

    const t = p.millis() * 0.001
    const radius = cell * dScale

    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const idx = y * cols + x
        const i = 4 * idx

        const r = px[i], g = px[i + 1], b = px[i + 2]
        const lum = lumFromRGB(r, g, b)

        const dLum = Math.abs(lum - prevLum[idx]) // motion
        prevLum[idx] = lum

        // mask: only draw where it’s fireworks-y
        const isBright = lum >= brightThresh
        const isMoving = dLum >= motionThresh
        if (!isBright && !isMoving) continue

        // choose one of two colours (stable, not gradient)
        // pattern ties to space + time so it feels alive
        const pickBlue = ((x + y) % 2 === 0) ^ (Math.floor(t * 6) % 2 === 0)
        const C = pickBlue ? LIGHTBLUE : ORANGE

        const cx = x * cell + cell * 2.9
        const cy = y * cell + cell * 0.1

        // Outline-only band near the threshold (gives the “hollow field” look)
        const near = lum < brightThresh + softBand && !isBright
        const alphaFill = isBright ? 235 : 100
        const alphaStroke = isBright ? 0 : 85

        // stroke
        p.noFill()
        p.stroke(C[0], C[1], C[2], alphaStroke)
        p.strokeWeight(1)
        p.circle(cx, cy, radius)

        // fill (only if bright)
        if (!near && alphaFill > 0) {
          p.noStroke()
          p.fill(C[0], C[1], C[2], alphaFill)
          p.circle(cx, cy, radius - 2)
        }
      }
    }
  }
})
