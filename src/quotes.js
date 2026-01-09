// main.js — answers 1/2/3 by code: count knob, no text distortion, exact color schemes + optional inner line
(() => {
  const {
    Engine, Render, Runner,
    Common, Mouse, MouseConstraint,
    Composite, Bodies, Body, Events
  } = Matter;
  

  const container = document.getElementById("scene");
  // Use viewport dimensions, NOT container dimensions
  const W = () => window.innerWidth;
  const H = () => window.innerHeight;

  // =========================================================
  // 1) AMOUNT (how many stickers get launched)
  // =========================================================
  const LAUNCH_COUNT = 34; // <-- change this number (ex: 40, 80, 120)

  // =========================================================
  // COLORS (your combos)
  // =========================================================
  const COLORS = {
    orange: "#FF5F00", 
    pink:   "#E84EB5",
    blue:   "#2F80FF",
    black:  "#000000",
  bg: "#FF5F00", 
  };

  // =========================================================
  // ENGINE / RENDER
  // =========================================================
  const engine = Engine.create();
  const world = engine.world;
  engine.gravity.y = 1.05;

  const render = Render.create({
    element: container,
    engine,
    options: {
      width: W(),
      height: H(),
      wireframes: false,
      background: COLORS.bg,
      showAngleIndicator: false
    }
  });

  const DPR = Math.min(window.devicePixelRatio || 1, 2);
  render.options.pixelRatio = DPR;
  Matter.Render.setPixelRatio(render, DPR);

  Render.run(render);
  const runner = Runner.create();
  Runner.run(runner, engine);

  // =========================================================
  // ENABLE INTERACTION ON MOUSE/TOUCH HOLD (allow scroll otherwise)
  // =========================================================
  const canvas = render.canvas;

  // Hold mouse button to drag
  window.addEventListener("mousedown", () => canvas.classList.add("is-interactive"));
  window.addEventListener("mouseup", () => canvas.classList.remove("is-interactive"));

  // Touch: two-finger drag only (one finger scrolls page)
  window.addEventListener("touchstart", (e) => {
    if (e.touches && e.touches.length >= 2) {
      canvas.classList.add("is-interactive");
    }
  }, { passive: true });

  window.addEventListener("touchend", () => canvas.classList.remove("is-interactive"));

  // =========================================================
  // WALLS
  // =========================================================
  const THICK = 80;
  let walls = makeWalls();
  Composite.add(world, walls);

  function makeWalls() {
    const w = W();
    const h = H();
    return [
      Bodies.rectangle(w / 2, h + THICK / 2, w + THICK * 2, THICK, {
        isStatic: true, render: { visible: false }
      }),
      Bodies.rectangle(-THICK / 2, h / 2, THICK, h + THICK * 2, {
        isStatic: true, render: { visible: false }
      }),
      Bodies.rectangle(w + THICK / 2, h / 2, THICK, h + THICK * 2, {
        isStatic: true, render: { visible: false }
      })
    ];
  }

  // =========================================================
  // MOUSE
  // =========================================================
  const mouse = Mouse.create(render.canvas);
  const mouseConstraint = MouseConstraint.create(engine, {
    mouse,
    constraint: { stiffness: 0.2, render: { visible: false } }
  });
  Composite.add(world, mouseConstraint);
  render.mouse = mouse;

  // =========================================================
  // PHRASES
  // =========================================================
  const phrases = [
    "\"Folk opfører sig som idioter.\"",
    "\"Det lyder som\nen krigszone.\"",
    "\"Jeg hader\nden her tradition.\"",
    "\"Hvorfor er det\nstadig tilladt?\"",
    "\"Min hund er\nfuldstændig smadret.\"",
    "\"Jeg tæller timerne\ntil det stopper.\"",
    "\"Hvem synes seriøst\ndet her er fedt?\"",
    "\"Jeg får hjertebanken\nhver gang.\"",
    "\"Det føles\naggressivt.\"",
    "\"Man kan ikke\nslippe væk.\"",
    "\"Folk skyder af\nsom galninge.\"",
    "\"Det er kaotisk\nog dumt.\"",
    "\"Jeg bliver hjemme\nog lukker alt.\"",
    "\"Nytår er\ndet værste døgn.\"",
    "\"Ingen tager\nhensyn.\"",
    "\"Det larmer mere\nhvert år.\"",
    "\"Jeg føler mig som\nden eneste der hader det.\"",
    "\"Hvorfor skal det\nvære så voldsomt?\"",
    "\"Jeg bliver\nkaldt sart.\"",
    "\"Det er ren\noverlevelse\"",
    "\"Det er helt ude\naf kontrol.\""
  ];
  const pick = (arr) => arr[(Math.random() * arr.length) | 0];

  // =========================================================
  // 2) TEXT: no distortion, just auto font-size + wrapping
  //    (no scaling, no stretching)
  // =========================================================
  function wrapLines(ctx, text, maxW) {
    const raw = String(text).split("\n");
    const out = [];

    for (const line of raw) {
      const words = line.split(/\s+/).filter(Boolean);
      if (!words.length) { out.push(""); continue; }

      let cur = words[0];
      for (let i = 1; i < words.length; i++) {
        const next = cur + " " + words[i];
        if (ctx.measureText(next).width <= maxW) cur = next;
        else { out.push(cur); cur = words[i]; }
      }
      out.push(cur);
    }

    return out.slice(0, 4); // cap lines for readability
  }

  function fitText(ctx, text, maxW, maxH, fontFamily, fontWeight) {
    let size = Math.min(18, Math.max(10, Math.floor(maxW * 0.12)));  // scale with shape size
    const min = 8;

    while (size >= min) {
      ctx.font = `${fontWeight} ${size}px ${fontFamily}`;
      const lines = wrapLines(ctx, text, maxW);
      const lineH = Math.floor(size * 1.10);
      const totalH = lineH * lines.length;

      let okW = true;
      for (const ln of lines) {
        if (ctx.measureText(ln).width > maxW) { okW = false; break; }
      }

      if (okW && totalH <= maxH) return { size, lines, lineH, totalH };
      size -= 1;
    }

    ctx.font = `${fontWeight} ${min}px ${fontFamily}`;
    const lines = wrapLines(ctx, text, maxW);
    const lineH = Math.floor(min * 1.10);
    return { size: min, lines, lineH, totalH: lineH * lines.length };
  }

  // =========================================================
  // 3) STICKER COLOR SCHEMES + optional inner line
  //    combos from your reference:
  //    A) pink fill + black text + black outline
  //    B) orange fill + black text + black outline
  //    C) black fill + pink text + black outline (+ pink inner line sometimes)
  //    D) black fill + orange text + black outline (+ orange inner line sometimes)
  //    E) black fill + orange text + black outline + blue outer rim sometimes
  // =========================================================
  function randomScheme() {
    const r = Math.random();

    if (r < 0.28) return { fill: COLORS.pink,   text: COLORS.black, inner: COLORS.black, outer: null };
    if (r < 0.56) return { fill: COLORS.orange, text: COLORS.black, inner: COLORS.black, outer: null };

    // black stickers split between pink/orange text
    if (r < 0.78) return { fill: COLORS.black,  text: COLORS.pink,  inner: COLORS.pink,  outer: null };
    if (r < 0.92) return { fill: COLORS.black,  text: COLORS.orange,inner: COLORS.orange,outer: null };

    // occasional blue rim version
    return { fill: COLORS.black, text: COLORS.orange, inner: COLORS.orange, outer: COLORS.blue };
  }

  function makeSticker(x, y) {
    const kind = pick(["circle", "oval", "roundedRect", "capsule", "badge"]);
    const phrase = pick(phrases);
    const scheme = randomScheme();

    let b;

    if (kind === "circle") {
      const r = Common.random(44, 72);
      b = Bodies.circle(x, y, r, { restitution: 0.35, frictionAir: 0.018, render: { visible: false } });
    } else if (kind === "oval") {
      const w = Common.random(120, 190);
      const h = Common.random(80, 120);
      b = Bodies.rectangle(x, y, w, h, {
        chamfer: { radius: Math.min(w, h) * 0.45 },
        restitution: 0.35, frictionAir: 0.018,
        render: { visible: false }
      });
    } else if (kind === "roundedRect") {
      const w = Common.random(130, 210);
      const h = Common.random(60, 100);
      b = Bodies.rectangle(x, y, w, h, {
        chamfer: { radius: Common.random(18, 28) },
        restitution: 0.35, frictionAir: 0.018,
        render: { visible: false }
      });
    } else if (kind === "capsule") {
      const w = Common.random(160, 240);
      const h = Common.random(60, 82);
      b = Bodies.rectangle(x, y, w, h, {
        chamfer: { radius: h * 0.5 },
        restitution: 0.35, frictionAir: 0.018,
        render: { visible: false }
      });
    } else {
      const sides = (Math.random() < 0.6) ? 6 : 8;
      const r = Common.random(46, 74);
      b = Bodies.polygon(x, y, sides, r, {
        chamfer: { radius: Common.random(10, 16) },
        restitution: 0.35, frictionAir: 0.018,
        render: { visible: false }
      });
    }

    // optional inner line like your drawings (not always)
    const useInner = Math.random() < 0.55; // inner line appears ~55% of the time

    // Pre-calculate text fitting ONCE
    const w = b.bounds.max.x - b.bounds.min.x;
    const h = b.bounds.max.y - b.bounds.min.y;
    const padX = Math.max(10, w * 0.12);
    const padY = Math.max(10, h * 0.12);
    const maxW = Math.max(30, w - padX * 2);
    const maxH = Math.max(20, h - padY * 2);

    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    const fontFamily = "system-ui, -apple-system, Segoe UI, Roboto, Arial";
    const fontWeight = 900;
    const fitted = fitText(tempCtx, phrase, maxW, maxH, fontFamily, fontWeight);

    b.sticker = {
      fill: scheme.fill,
      outline: COLORS.black,
      outlineWidth: 1,

      // inner line uses SAME shape, just thinner stroke (looks like a smaller copy)
      innerLine: useInner ? scheme.inner : null,
      innerWidth: useInner ? 1 : 0,

      // optional blue rim on some black stickers
      outerRing: scheme.outer,
      outerRingWidth: scheme.outer ? 1 : 0,

      textColor: scheme.text,
      fontFamily: fontFamily,
      fontWeight: fontWeight,
      
      // Store pre-calculated text info (never recalculate)
      fittedText: fitted
    };

    Body.setAngularVelocity(b, Common.random(-0.22, 0.22));
    return b;
  }

  // =========================================================
  // LAUNCHER
  // =========================================================
  const BOX_W = 90;
  const BOX_H = 190;
  const BOX_Y = () => H() - BOX_H / 2 - 10;

  const launcherBox = Bodies.rectangle(W() / 2, BOX_Y(), BOX_W, BOX_H, {
    isStatic: true,
    chamfer: { radius: 36 },
    render: { visible: false }
  });

  launcherBox.sticker = {
    fill: COLORS.pink,
    outline: COLORS.black,
    outlineWidth: 1,
    innerLine: null,
    innerWidth: 0,
    outerRing: null,
    outerRingWidth: 0,
    fittedText: null
  };

  Composite.add(world, launcherBox);

  function explodeFromBox(count = LAUNCH_COUNT) {
    const origin = launcherBox.position;
    const bodies = [];

    for (let i = 0; i < count; i++) {
      const x = origin.x + Common.random(-BOX_W * 0.28, BOX_W * 0.28);
      const y = origin.y + Common.random(-BOX_H * 0.22, BOX_H * 0.22);
      const b = makeSticker(x, y);

      const angle = Common.random(0, Math.PI * 2);
      const speed = Common.random(9, 17);
      Body.setVelocity(b, {
        x: Math.cos(angle) * speed,
        y: Math.sin(angle) * speed - Common.random(7, 13)
      });

      bodies.push(b);
    }

    Composite.add(world, bodies);
  }

  // =========================================================
  // VIBRATE THEN EXPLODE
  // =========================================================
  const startMs = performance.now();
  const VIBRATE_MS = 2000;
  let didExplode = false;

  const base = { x: launcherBox.position.x, y: launcherBox.position.y, a: launcherBox.angle };

  function setBoxToBase() {
    Body.setPosition(launcherBox, { x: base.x, y: base.y });
    Body.setAngle(launcherBox, base.a);
  }

  Events.on(engine, "beforeUpdate", () => {
    if (didExplode) return;

    const elapsed = performance.now() - startMs;

    if (elapsed < VIBRATE_MS) {
      const ramp = elapsed / VIBRATE_MS;
      const amp = 2 + 5 * ramp;
      const rot = 0.01 * ramp;

      const t = performance.now() * 0.06;
      const dx = Math.sin(t) * amp + (Math.random() - 0.5) * 1.5;
      const da = Math.sin(t * 0.9) * rot;

      Body.setPosition(launcherBox, { x: base.x + dx, y: base.y });
      Body.setAngle(launcherBox, base.a + da);
    } else {
      setBoxToBase();
      didExplode = true;
      explodeFromBox(LAUNCH_COUNT);
      
      // Enable scrolling after explosion
      setTimeout(() => {
        document.body.classList.add('allow-scroll');
      }, 1000); // Wait 1 second after explosion
    }
  });

  // =========================================================
  // CLEANUP
  // =========================================================
  Events.on(engine, "afterUpdate", () => {
    const h = H();
    const all = Composite.allBodies(world);
    for (let i = all.length - 1; i >= 0; i--) {
      const b = all[i];
      if (b.isStatic) continue;
      if (b.position.y > h + 600) Composite.remove(world, b);
    }
  });

  // =========================================================
  // CUSTOM DRAW (no shadows)
  // =========================================================
  function drawPathFromBody(ctx, b) {
    if (b.circleRadius) {
      ctx.beginPath();
      ctx.arc(0, 0, b.circleRadius, 0, Math.PI * 2);
      return;
    }

    const verts = b.vertices;
    const ca = Math.cos(-b.angle);
    const sa = Math.sin(-b.angle);

    ctx.beginPath();
    for (let i = 0; i < verts.length; i++) {
      const v = verts[i];
      const lx = v.x - b.position.x;
      const ly = v.y - b.position.y;
      const x = lx * ca - ly * sa;
      const y = lx * sa + ly * ca;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
  }

  function drawStickerBody(ctx, b) {
    const s = b.sticker;
    if (!s) return;

    ctx.save();
    ctx.translate(b.position.x, b.position.y);
    ctx.rotate(b.angle);

    // guarantee no shadow artifacts
    ctx.shadowColor = "transparent";
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;

    // outer ring (blue)
    if (s.outerRing) {
      drawPathFromBody(ctx, b);
      ctx.strokeStyle = s.outerRing;
      ctx.lineJoin = "round";
      ctx.lineCap = "round";
      ctx.lineWidth = s.outlineWidth + s.outerRingWidth;
      ctx.stroke();
    }

    // fill
    drawPathFromBody(ctx, b);
    ctx.fillStyle = s.fill;
    ctx.fill();

    // black outline
    drawPathFromBody(ctx, b);
    ctx.strokeStyle = s.outline;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.lineWidth = s.outlineWidth;
    ctx.stroke();

    // inner thin line (same shape, thinner)
    if (s.innerLine) {
      drawPathFromBody(ctx, b);
      ctx.strokeStyle = s.innerLine;
      ctx.lineWidth = s.innerWidth;
      ctx.stroke();
    }

    // text follows the shape rotation (using pre-calculated values)
    if (s.fittedText) {
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = s.textColor;
      ctx.font = `${s.fontWeight} ${s.fittedText.size}px ${s.fontFamily}`;
      
      const startY = -(s.fittedText.totalH / 2) + (s.fittedText.lineH / 2);
      for (let i = 0; i < s.fittedText.lines.length; i++) {
        ctx.fillText(s.fittedText.lines[i], 0, startY + i * s.fittedText.lineH);
      }
    }

    ctx.restore();
  }

  Events.on(render, "afterRender", () => {
    const bodies = Composite.allBodies(world);
    for (const b of bodies) drawStickerBody(render.context, b);
  });

  // =========================================================
  // RESIZE
  // =========================================================
  window.addEventListener("resize", () => {
    render.canvas.width = W();
    render.canvas.height = H();
    render.options.width = W();
    render.options.height = H();

    Composite.remove(world, walls);
    walls = makeWalls();
    Composite.add(world, walls);

    base.x = W() / 2;
    base.y = BOX_Y();
    setBoxToBase();
  });

  // =========================================================
  // COUNTER PHYSICS - Sync scrolling DOM banner to Matter.js static bodies
  // =========================================================
  let orangeBody = null;
  let pinkBody = null;
  let counterAdded = false;

  function updateCounterBodies() {
    const footer = document.querySelector('.site-footer');
    if (!footer) return;

    const footerRect = footer.getBoundingClientRect();
    const inView = footerRect.top < H() && footerRect.bottom > 0;

    if (!inView) {
      // Banner not in viewport - remove bodies
      if (counterAdded) {
        if (orangeBody) Composite.remove(world, orangeBody);
        if (pinkBody) Composite.remove(world, pinkBody);
        orangeBody = null;
        pinkBody = null;
        counterAdded = false;
      }
      return;
    }

    // Banner is in viewport - create or update bodies
    const orangeSection = footer.querySelector('.orange-section');
    const pinkSection = footer.querySelector('.pink-section');
    
    if (!orangeSection || !pinkSection) return;

    const orangeRect = orangeSection.getBoundingClientRect();
    const pinkRect = pinkSection.getBoundingClientRect();

    if (!counterAdded) {
      // Create bodies on first appearance
      orangeBody = Bodies.rectangle(
        orangeRect.left + orangeRect.width / 2,
        orangeRect.top + orangeRect.height / 2,
        orangeRect.width,
        orangeRect.height,
        { isStatic: true, render: { visible: false } }
      );
      
      pinkBody = Bodies.rectangle(
        pinkRect.left + pinkRect.width / 2,
        pinkRect.top + pinkRect.height / 2,
        pinkRect.width,
        pinkRect.height,
        { isStatic: true, render: { visible: false } }
      );
      
      Composite.add(world, [orangeBody, pinkBody]);
      counterAdded = true;
    } else {
      // Update positions as banner scrolls (creates "shovel" effect)
      Body.setPosition(orangeBody, {
        x: orangeRect.left + orangeRect.width / 2,
        y: orangeRect.top + orangeRect.height / 2
      });
      
      Body.setPosition(pinkBody, {
        x: pinkRect.left + pinkRect.width / 2,
        y: pinkRect.top + pinkRect.height / 2
      });
    }
  }

  // Update counter bodies on every scroll (creates continuous physics interaction)
  let scrollTimeout;
  window.addEventListener('scroll', () => {
    updateCounterBodies();
    
    // Also update on scroll end for precision
    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(updateCounterBodies, 50);
  });

  // Update on resize as well
  window.addEventListener('resize', () => {
    if (counterAdded) {
      updateCounterBodies();
    }
  });
})();
