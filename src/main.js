// === IMPORTS ===
import './style.css';
import p5 from 'p5';
// import gsap from 'gsap'; // Available when needed
// import Matter from 'matter-js'; // Available when needed
// import * as THREE from 'three'; // Available when needed

// === FIREWORKS CIRCLE MOSAIC ===
// Vector-based p5.js artwork with motion-reactive circles
new p5((p) => {
  let vid, gfx;
  let prevLum = null;

  // Color palette
  const ORANGE = [255, 170, 40];
  const LIGHTBLUE = [220, 170, 40];

  // Grid settings
  const cell = 36;              // Cell size
  const dScale = 0.3;           // Circle size scale

  // Mask parameters
  const brightThresh = 0.02;    // Brightness threshold
  const motionThresh = 0.3;     // Motion threshold
  const softBand = 0.03;        // Outline band width

  const lumFromRGB = (r, g, b) => (0.1126 * r + 0.1152 * g + 0.0722 * b) / 255;

  p.setup = () => {
    const c = p.createCanvas(p.windowWidth, p.windowHeight);
    c.parent('sketch');
    p.pixelDensity(1);

    gfx = p.createGraphics(1, 2);
    gfx.pixelDensity(1);

    vid = p.createVideo('/fireworks.mp4', () => {
      vid.volume(0);
      vid.loop();
      vid.hide();
    });
  };

  p.windowResized = () => p.resizeCanvas(p.windowWidth, p.windowHeight);

  p.draw = () => {
    p.background(0);
    if (!vid || vid.elt.readyState < 2) return;

    const cols = Math.floor(p.width / cell);
    const rows = Math.floor(p.height / cell);

    if (gfx.width !== cols || gfx.height !== rows) {
      gfx.resizeCanvas(cols, rows);
      prevLum = new Float32Array(cols * rows);
    }

    gfx.image(vid, 0, 0, cols, rows);
    gfx.loadPixels();
    const px = gfx.pixels;

    const t = p.millis() * 0.001;
    const radius = cell * dScale;

    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const idx = y * cols + x;
        const i = 4 * idx;

        const r = px[i], g = px[i + 1], b = px[i + 2];
        const lum = lumFromRGB(r, g, b);

        const dLum = Math.abs(lum - prevLum[idx]);
        prevLum[idx] = lum;

        const isBright = lum >= brightThresh;
        const isMoving = dLum >= motionThresh;
        if (!isBright && !isMoving) continue;

        const pickBlue = ((x + y) % 2 === 0) ^ (Math.floor(t * 6) % 2 === 0);
        const C = pickBlue ? LIGHTBLUE : ORANGE;

        const cx = x * cell + cell * 0.5;
        const cy = y * cell + cell * 0.5;

        const near = lum < brightThresh + softBand && !isBright;
        const alphaFill = isBright ? 235 : 100;
        const alphaStroke = isBright ? 0 : 0;

        // Stroke
        p.noFill();
        p.stroke(C[0], C[1], C[2], alphaStroke);
        p.strokeWeight(1);
        p.circle(cx, cy, radius);

        // Fill
        if (!near && alphaFill > 0) {
          p.noStroke();
          p.fill(C[0], C[1], C[2], alphaFill);
          p.circle(cx, cy, radius - 2);
        }
      }
    }
  };
});
