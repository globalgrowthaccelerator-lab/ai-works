// ========================================
// AI Works - Main JavaScript
// ========================================

// --- Laser grid: fast light pulses between dot grid points ---
(function () {
  const canvas = document.getElementById('laserCanvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const GRID = 28; // matches CSS dot grid spacing
  let W, H, cols, rows;

  function resize() {
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = W;
    canvas.height = H;
    cols = Math.ceil(W / GRID);
    rows = Math.ceil(H / GRID);
  }
  resize();

  // Each laser: travels from one dot to another, fades out
  const lasers = [];
  const MAX_LASERS = 12;

  function gridPos(col, row) {
    return { x: col * GRID + 1.5, y: row * GRID + 1.5 };
  }

  function spawnLaser() {
    // Pick random start dot
    const c1 = Math.floor(Math.random() * cols);
    const r1 = Math.floor(Math.random() * rows);
    const start = gridPos(c1, r1);

    // Pick random end dot — 3 to 12 grid spaces away
    const dist = 3 + Math.floor(Math.random() * 10);
    const angle = Math.random() * Math.PI * 2;
    const c2 = Math.min(cols - 1, Math.max(0, Math.round(c1 + Math.cos(angle) * dist)));
    const r2 = Math.min(rows - 1, Math.max(0, Math.round(r1 + Math.sin(angle) * dist)));
    const end = gridPos(c2, r2);

    lasers.push({
      sx: start.x, sy: start.y,
      ex: end.x, ey: end.y,
      progress: 0,       // 0 to 1: head position
      tail: 0.25,         // trail length as fraction
      speed: 0.03 + Math.random() * 0.04,  // fast
      opacity: 0.3 + Math.random() * 0.3,
      width: 1 + Math.random() * 1,
    });
  }

  function drawLaser(l) {
    const headX = l.sx + (l.ex - l.sx) * l.progress;
    const headY = l.sy + (l.ey - l.sy) * l.progress;
    const tailP = Math.max(0, l.progress - l.tail);
    const tailX = l.sx + (l.ex - l.sx) * tailP;
    const tailY = l.sy + (l.ey - l.sy) * tailP;

    const grad = ctx.createLinearGradient(tailX, tailY, headX, headY);
    grad.addColorStop(0, 'rgba(242,122,26,0)');
    grad.addColorStop(0.6, `rgba(242,122,26,${l.opacity * 0.5})`);
    grad.addColorStop(1, `rgba(255,186,8,${l.opacity})`);

    ctx.beginPath();
    ctx.moveTo(tailX, tailY);
    ctx.lineTo(headX, headY);
    ctx.strokeStyle = grad;
    ctx.lineWidth = l.width;
    ctx.lineCap = 'round';
    ctx.stroke();

    // Bright dot at the head
    ctx.beginPath();
    ctx.arc(headX, headY, l.width + 1, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255,200,60,${l.opacity * 0.8})`;
    ctx.fill();
  }

  let frame = 0;
  function animate() {
    ctx.clearRect(0, 0, W, H);

    // Spawn new lasers frequently
    frame++;
    if (frame % 8 === 0 && lasers.length < MAX_LASERS) {
      spawnLaser();
    }

    // Update and draw
    for (let i = lasers.length - 1; i >= 0; i--) {
      const l = lasers[i];
      l.progress += l.speed;
      if (l.progress > 1 + l.tail) {
        lasers.splice(i, 1);
        continue;
      }
      drawLaser(l);
    }

    requestAnimationFrame(animate);
  }

  // Spawn several immediately so it's active from the start
  for (let i = 0; i < 6; i++) spawnLaser();
  animate();

  window.addEventListener('resize', resize);
})();

// --- Navbar scroll effect ---
const navbar = document.getElementById('navbar');

if (navbar) {
  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  });
}

// --- Mobile nav toggle ---
const navToggle = document.getElementById('navToggle');
const navLinks = document.getElementById('navLinks');

if (navToggle && navLinks) {
  navToggle.addEventListener('click', () => {
    navLinks.classList.toggle('open');
  });

  navLinks.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      navLinks.classList.remove('open');
    });
  });
}

// --- Dropdown toggle (mobile tap + desktop click prevention) ---
document.querySelectorAll('.nav-dropdown > .dropdown-toggle').forEach(toggle => {
  toggle.addEventListener('click', (e) => {
    e.preventDefault();
    const parent = toggle.parentElement;
    // Close other open dropdowns
    document.querySelectorAll('.nav-dropdown.open').forEach(d => {
      if (d !== parent) d.classList.remove('open');
    });
    parent.classList.toggle('open');
  });
});

// Close dropdown when clicking outside
document.addEventListener('click', (e) => {
  if (!e.target.closest('.nav-dropdown')) {
    document.querySelectorAll('.nav-dropdown.open').forEach(d => d.classList.remove('open'));
  }
});

// --- Active nav link highlight ---
(function() {
  const path = window.location.pathname;
  const filename = path.split('/').pop() || 'index.html';
  const solutionPages = ['audiobook-production.html', 'ai-workflow-automation.html', 'for-authors.html', 'for-businesses.html'];

  document.querySelectorAll('.nav-links a').forEach(a => {
    const href = a.getAttribute('href') || '';
    const hrefFile = href.split('/').pop();
    if (
      (filename === 'index.html' && (href === 'index.html' || href === '/' || href === '' || href === '#')) ||
      (hrefFile && hrefFile !== '' && hrefFile !== '#' && filename === hrefFile)
    ) {
      a.classList.add('active');
    }
  });

  // Highlight "Solutions" toggle when on a solutions sub-page
  if (solutionPages.includes(filename)) {
    document.querySelectorAll('.dropdown-toggle').forEach(t => t.classList.add('active'));
  }
})();

// --- Enquiry / Landing form handling via Web3Forms ---
function initForm(formEl) {
  if (!formEl) return;
  const successEl = document.getElementById('formSuccess');
  const submitBtn = formEl.querySelector('button[type="submit"]');
  const originalText = submitBtn ? submitBtn.textContent : 'Submit';

  formEl.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Sending...'; }
    const formData = new FormData(formEl);
    const jsonData = Object.fromEntries(formData.entries());
    try {
      const response = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(jsonData)
      });
      const result = await response.json();
      if (result.success) {
        if (successEl) successEl.classList.add('visible');
        formEl.reset();
      } else {
        alert('Submission failed: ' + (result.message || 'Unknown error.'));
      }
    } catch (error) {
      alert('Could not send. Please try again or email us directly.');
    }
    if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = originalText; }
  });
}

initForm(document.getElementById('enquiryForm'));
initForm(document.getElementById('landingForm'));

// --- Scroll-triggered animations ---
const scrollStyle = document.createElement('style');
scrollStyle.textContent = `
  .reveal { opacity: 0; transition: opacity 0.7s ease, transform 0.7s ease; }
  .reveal.visible { opacity: 1 !important; transform: none !important; }

  /* Section headers — fade up */
  .reveal-up { transform: translateY(40px); }

  /* Cards — slide from sides */
  .reveal-left { transform: translateX(-50px); }
  .reveal-right { transform: translateX(50px); }

  /* Scale in */
  .reveal-scale { transform: scale(0.9); }

  /* Values — slide up small */
  .reveal-value { transform: translateY(24px); }

  /* Contact items */
  .reveal-contact { transform: translateX(-30px); }

  /* Form */
  .reveal-form { transform: translateY(30px) scale(0.97); }
`;
document.head.appendChild(scrollStyle);

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.1, rootMargin: '0px 0px -60px 0px' });

function addReveal(selector, cls, staggerMs) {
  document.querySelectorAll(selector).forEach((el, i) => {
    el.classList.add('reveal', cls);
    if (staggerMs) el.style.transitionDelay = `${i * staggerMs}ms`;
    revealObserver.observe(el);
  });
}

// Section headers — fade up
addReveal('.section-header', 'reveal-up');

// Service cards — first from left, second from right
document.querySelectorAll('.service-card').forEach((card, i) => {
  card.classList.add('reveal', i === 0 ? 'reveal-left' : 'reveal-right');
  card.style.transitionDelay = `${i * 200}ms`;
  revealObserver.observe(card);
});

// About section
addReveal('.about-content .section-tag', 'reveal-up');
addReveal('.about-content h2', 'reveal-up');
document.querySelectorAll('.about-content p').forEach((p, i) => {
  p.classList.add('reveal', 'reveal-up');
  p.style.transitionDelay = `${200 + i * 150}ms`;
  revealObserver.observe(p);
});
addReveal('.value', 'reveal-value', 120);
addReveal('.about-visual', 'reveal-scale');

// Enquiry section
addReveal('.enquiry-info .section-tag', 'reveal-up');
addReveal('.enquiry-info h2', 'reveal-up');
addReveal('.enquiry-info > p', 'reveal-up');
addReveal('.contact-item', 'reveal-contact', 150);
addReveal('.enquiry-form-wrapper', 'reveal-form');

// Footer
addReveal('.footer-content', 'reveal-up');

// --- About section: letter-by-letter dot animation ---
const visualGrid = document.getElementById('visualGrid');
if (visualGrid) {
  for (let i = 0; i < 25; i++) {
    const dot = document.createElement('div');
    dot.classList.add('visual-dot');
    visualGrid.appendChild(dot);
  }
  const dots = visualGrid.querySelectorAll('.visual-dot');
  const letterPatterns = {
    A: [0,1,1,1,0, 1,0,0,0,1, 1,1,1,1,1, 1,0,0,0,1, 1,0,0,0,1],
    I: [1,1,1,1,1, 0,0,1,0,0, 0,0,1,0,0, 0,0,1,0,0, 1,1,1,1,1],
    W: [1,0,0,0,1, 1,0,0,0,1, 1,0,1,0,1, 1,1,0,1,1, 1,0,0,0,1],
    O: [0,1,1,1,0, 1,0,0,0,1, 1,0,0,0,1, 1,0,0,0,1, 0,1,1,1,0],
    R: [1,1,1,1,0, 1,0,0,0,1, 1,1,1,1,0, 1,0,0,1,0, 1,0,0,0,1],
    K: [1,0,0,1,0, 1,0,1,0,0, 1,1,0,0,0, 1,0,1,0,0, 1,0,0,1,0],
    S: [0,1,1,1,1, 1,0,0,0,0, 0,1,1,1,0, 0,0,0,0,1, 1,1,1,1,0]
  };
  const word = ['A','I','W','O','R','K','S'];
  let currentIndex = 0;
  function showLetter() {
    const pattern = letterPatterns[word[currentIndex]];
    dots.forEach((dot, i) => {
      setTimeout(() => dot.classList.toggle('active', pattern[i] === 1), i * 30);
    });
    currentIndex++;
    if (currentIndex >= word.length) {
      setTimeout(() => {
        currentIndex = 0;
        dots.forEach(dot => dot.classList.remove('active'));
        setTimeout(showLetter, 600);
      }, 2500);
    } else {
      setTimeout(showLetter, 900);
    }
  }
  setTimeout(showLetter, 500);
}

// --- Smooth scroll ---
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute('href'));
    if (target) target.scrollIntoView({ behavior: 'smooth' });
  });
});

// ========================================
// Hero Physics - Matter.js (optimized)
// ========================================
(function () {
  const canvas = document.getElementById('heroCanvas');
  if (!canvas || typeof Matter === 'undefined') return;

  const isMobile = window.innerWidth < 768;
  const hero = document.querySelector('.hero');
  const W = hero.offsetWidth;
  const H = hero.offsetHeight;
  const dpr = isMobile ? 1 : Math.min(window.devicePixelRatio || 1, 2);

  canvas.width = W * dpr;
  canvas.height = H * dpr;
  canvas.style.width = W + 'px';
  canvas.style.height = H + 'px';

  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);

  const { Engine, World, Bodies, Body, Events, Runner } = Matter;

  // More realistic gravity (Earth-like feel at this scale)
  const engine = Engine.create({
    gravity: { x: 0, y: 0.8 },
    positionIterations: 8,   // better stacking precision
    velocityIterations: 6    // smoother collision response
  });
  const world = engine.world;

  const BG = '#E0E5EC';

  // --- Walls: floor with bounce, side walls smooth ---
  const floorY = H - 5;
  World.add(world, [
    Bodies.rectangle(W / 2, floorY, W + 200, 10, {
      isStatic: true, friction: 0.6, restitution: 0.4
    }),
    Bodies.rectangle(-5, H / 2, 10, H * 2, {
      isStatic: true, friction: 0.1, restitution: 0.3
    }),
    Bodies.rectangle(W + 5, H / 2, 10, H * 2, {
      isStatic: true, friction: 0.1, restitution: 0.3
    })
  ]);


  // --- Text barriers: sized to actual rendered text width, not container ---
  if (!isMobile) {
    const heroRect = hero.getBoundingClientRect();

    function getTextWidth(el) {
      // Use Range to measure actual inline text width
      const range = document.createRange();
      range.selectNodeContents(el);
      return range.getBoundingClientRect();
    }

    // H1 — measure the actual text span
    const h1 = hero.querySelector('.hero-content h1');
    if (h1) {
      const tr = getTextWidth(h1);
      World.add(world, Bodies.rectangle(
        tr.left - heroRect.left + tr.width / 2,
        tr.top - heroRect.top + tr.height / 2,
        tr.width + 16, tr.height + 8,
        { isStatic: true, friction: 0.4, restitution: 0.3, chamfer: { radius: 8 } }
      ));
    }

    // Subtitle — measure actual text lines
    const subtitle = hero.querySelector('.hero-content .hero-subtitle');
    if (subtitle) {
      const tr = getTextWidth(subtitle);
      World.add(world, Bodies.rectangle(
        tr.left - heroRect.left + tr.width / 2,
        tr.top - heroRect.top + tr.height / 2,
        tr.width + 12, tr.height + 6,
        { isStatic: true, friction: 0.4, restitution: 0.3, chamfer: { radius: 8 } }
      ));
    }

    // Buttons — already inline, getBoundingClientRect is accurate
    const actions = hero.querySelector('.hero-content .hero-actions');
    if (actions) {
      const r = actions.getBoundingClientRect();
      World.add(world, Bodies.rectangle(
        r.left - heroRect.left + r.width / 2,
        r.top - heroRect.top + r.height / 2,
        r.width + 12, r.height + 8,
        { isStatic: true, friction: 0.4, restitution: 0.3, chamfer: { radius: 8 } }
      ));
    }
  }

  // --- Shapes ---
  const shapes = [];
  const trails = [];

  function add(type, x, y, delay, opts) {
    const common = {
      restitution: opts.bounce || 0.35,
      friction: opts.friction || 0.4,
      frictionStatic: opts.frictionStatic || 0.6,  // prevents micro-sliding when at rest
      frictionAir: opts.air || 0.008,
      density: opts.density || 0.002,
      angle: (Math.random() - 0.5) * 0.8,
      slop: 0.01,  // tighter collision tolerance for cleaner stacking
    };
    let body;
    if (type === 'circle') {
      body = Bodies.circle(x, y, opts.r, common);
      body._type = 'circle'; body._r = opts.r;
    } else {
      body = Bodies.rectangle(x, y, opts.w, opts.h, { ...common, chamfer: { radius: opts.cr || 12 } });
      body._type = 'rect'; body._w = opts.w; body._h = opts.h; body._cr = opts.cr || 12;
    }
    body._accent = opts.accent || false;
    body._delay = delay;
    body._dropped = false;

    // Start offscreen and asleep — drop staggered
    Body.setStatic(body, true);
    shapes.push(body);
    trails.push([]);
    World.add(world, body);
  }

  // Staggered drop: wake each shape after its delay
  function dropShape(body) {
    Body.setStatic(body, false);
    body._dropped = true;
    // Heavier objects get less initial push — they should drop mostly straight down
    const massScale = Math.max(0.15, 1 / (body.mass * 80 + 1));
    const vx = (Math.random() - 0.5) * 1.5 * massScale;
    const vy = 0.5 + Math.random() * 1;
    Body.setVelocity(body, { x: vx, y: vy });
    Body.setAngularVelocity(body, (Math.random() - 0.5) * 0.04 * massScale);
  }

  // --- Shape definitions: staggered delays (ms) for sequential drops ---
  if (isMobile) {
    // 12 shapes for mobile
    add('circle', W * 0.15, -200, 0,    { r: 40, density: 0.005, bounce: 0.3, friction: 0.4, frictionStatic: 0.7, air: 0.003 });
    add('rect',   W * 0.80, -250, 600,  { w: 55, h: 55, cr: 14, density: 0.004, bounce: 0.25, friction: 0.5, frictionStatic: 0.8, air: 0.004 });
    add('circle', W * 0.50, -300, 1200, { r: 25, density: 0.003, bounce: 0.45, friction: 0.3, air: 0.005 });
    add('circle', W * 0.65, -220, 1800, { r: 32, density: 0.004, bounce: 0.3, friction: 0.35, air: 0.004 });
    add('rect',   W * 0.35, -200, 2500, { w: 80, h: 32, cr: 16, density: 0.003, bounce: 0.3, friction: 0.45, frictionStatic: 0.7, air: 0.004 });
    add('rect',   W * 0.55, -280, 3200, { w: 42, h: 42, cr: 12, density: 0.003, bounce: 0.35, friction: 0.4, air: 0.005 });
    add('circle', W * 0.40, -250, 3800, { r: 20, density: 0.002, bounce: 0.5, friction: 0.25, air: 0.006 });
    add('circle', W * 0.85, -300, 4500, { r: 28, density: 0.003, bounce: 0.35, friction: 0.35, air: 0.004 });
    add('rect',   W * 0.20, -200, 5200, { w: 65, h: 28, cr: 14, density: 0.002, bounce: 0.3, friction: 0.4, air: 0.005 });
    add('circle', W * 0.70, -350, 5800, { r: 15, density: 0.001, bounce: 0.55, friction: 0.2, air: 0.008, accent: true });
    add('circle', W * 0.25, -280, 6500, { r: 35, density: 0.004, bounce: 0.35, friction: 0.35, air: 0.003 });
    add('circle', W * 0.45, -320, 7200, { r: 12, density: 0.0008, bounce: 0.6, friction: 0.15, air: 0.01, accent: true });
  } else {
    // 22 shapes for desktop — doubled

    // Wave 1 (0-1s): heavy anchors
    add('circle', W * 0.10, -300, 0,    { r: 65, density: 0.006, bounce: 0.15, friction: 0.8, frictionStatic: 1.0, air: 0.008 });
    add('circle', W * 0.78, -250, 400,  { r: 55, density: 0.005, bounce: 0.18, friction: 0.7, frictionStatic: 0.9, air: 0.007 });
    add('circle', W * 0.45, -280, 800,  { r: 50, density: 0.005, bounce: 0.16, friction: 0.75, frictionStatic: 0.9, air: 0.007 });

    // Wave 2 (1.5-3s): medium-heavy blocks and circles
    add('rect',   W * 0.88, -280, 1400, { w: 80, h: 80, cr: 18, density: 0.005, bounce: 0.12, friction: 0.65, frictionStatic: 0.9, air: 0.006 });
    add('rect',   W * 0.30, -220, 1900, { w: 120, h: 44, cr: 22, density: 0.004, bounce: 0.22, friction: 0.5, frictionStatic: 0.7, air: 0.004 });
    add('circle', W * 0.55, -350, 2400, { r: 42, density: 0.004, bounce: 0.35, friction: 0.35, air: 0.004 });
    add('rect',   W * 0.15, -300, 2800, { w: 70, h: 70, cr: 16, density: 0.004, bounce: 0.14, friction: 0.6, frictionStatic: 0.85, air: 0.005 });

    // Wave 3 (3.5-5.5s): medium shapes — more variety
    add('rect',   W * 0.50, -400, 3500, { w: 40, h: 90, cr: 20, density: 0.003, bounce: 0.3, friction: 0.4, frictionStatic: 0.7, air: 0.003 });
    add('rect',   W * 0.20, -300, 4000, { w: 52, h: 52, cr: 14, density: 0.002, bounce: 0.4, friction: 0.35, air: 0.005 });
    add('circle', W * 0.42, -350, 4400, { r: 28, density: 0.002, bounce: 0.5, friction: 0.25, air: 0.005 });
    add('rect',   W * 0.72, -320, 4800, { w: 100, h: 38, cr: 19, density: 0.003, bounce: 0.25, friction: 0.45, frictionStatic: 0.7, air: 0.004 });
    add('circle', W * 0.62, -280, 5200, { r: 35, density: 0.003, bounce: 0.38, friction: 0.3, air: 0.004 });

    // Wave 4 (5.5-7.5s): small playful shapes
    add('rect',   W * 0.68, -250, 5600, { w: 36, h: 36, cr: 10, density: 0.0018, bounce: 0.5, friction: 0.3, air: 0.006 });
    add('circle', W * 0.35, -300, 6000, { r: 22, density: 0.0015, bounce: 0.55, friction: 0.25, air: 0.007 });
    add('rect',   W * 0.82, -260, 6400, { w: 44, h: 28, cr: 14, density: 0.002, bounce: 0.45, friction: 0.3, air: 0.006 });
    add('circle', W * 0.25, -280, 6800, { r: 25, density: 0.002, bounce: 0.48, friction: 0.28, air: 0.006 });
    add('rect',   W * 0.58, -240, 7200, { w: 32, h: 55, cr: 12, density: 0.0018, bounce: 0.42, friction: 0.35, air: 0.006 });

    // Wave 5 (7.5-9s): tiny accents — lightest, bounciest
    add('circle', W * 0.14, -300, 7600, { r: 18, density: 0.001, bounce: 0.6, friction: 0.2, air: 0.008, accent: true });
    add('circle', W * 0.48, -350, 8000, { r: 12, density: 0.0008, bounce: 0.65, friction: 0.15, air: 0.01, accent: true });
    add('circle', W * 0.90, -400, 8400, { r: 14, density: 0.0008, bounce: 0.65, friction: 0.15, air: 0.01, accent: true });
    add('circle', W * 0.70, -320, 8800, { r: 10, density: 0.0006, bounce: 0.7, friction: 0.12, air: 0.012, accent: true });
    add('circle', W * 0.32, -280, 9200, { r: 16, density: 0.001, bounce: 0.6, friction: 0.18, air: 0.009, accent: true });
  }

  // Timer-based staggered dropping
  const startTime = performance.now();

  // Add spin on collision for realism
  Events.on(engine, 'collisionStart', function (event) {
    event.pairs.forEach(function (pair) {
      const { bodyA, bodyB } = pair;
      [bodyA, bodyB].forEach(b => {
        if (b.isStatic) return;
        const impactSpeed = Math.abs(b.velocity.x) + Math.abs(b.velocity.y);
        // Only light objects get spin on impact — heavy ones just absorb it
        if (impactSpeed > 3 && b.mass < 0.5) {
          const kick = (Math.random() - 0.5) * 0.01 * Math.min(impactSpeed, 5);
          Body.setAngularVelocity(b, b.angularVelocity + kick);
        }
      });
    });
  });

  // Canvas must not capture any pointer/touch events — it blocks page scroll
  canvas.style.pointerEvents = 'none';

  // --- Scroll affects gravity (desktop only) ---
  if (!isMobile) {
    let lastScrollY = window.scrollY;
    let scrollGravityTimer = null;
    const baseGravityY = 0.8;

    window.addEventListener('scroll', function () {
      const currentScrollY = window.scrollY;
      const delta = currentScrollY - lastScrollY;
      lastScrollY = currentScrollY;

      // Scale: scroll speed → gravity impulse (clamped)
      const force = Math.max(-2.5, Math.min(2.5, delta * 0.04));

      engine.gravity.y = baseGravityY + force;

      // Wake physics if settled
      if (settled) {
        settled = false;
        settledFrames = 0;
        Runner.run(runner, engine);
        render();
      }

      // Reset gravity back to normal after scroll stops
      clearTimeout(scrollGravityTimer);
      scrollGravityTimer = setTimeout(() => {
        engine.gravity.y = baseGravityY;
      }, 150);
    }, { passive: true });
  }

  // --- Mouse repel: invisible static circle follows cursor, pushes shapes away ---
  if (!isMobile) {
    const cursorBody = Bodies.circle(-200, -200, 45, {
      isStatic: true,
      restitution: 0.6,
      friction: 0,
      collisionFilter: { group: 0, category: 0x0001, mask: 0xFFFFFFFF }
    });
    World.add(world, cursorBody);

    hero.addEventListener('mousemove', function (e) {
      const rect = hero.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      Body.setPosition(cursorBody, { x: mx, y: my });

      // Wake physics if settled
      if (settled) {
        settled = false;
        settledFrames = 0;
        Runner.run(runner, engine);
        render();
      }
    });

    // Move cursor body offscreen when mouse leaves
    hero.addEventListener('mouseleave', function () {
      Body.setPosition(cursorBody, { x: -200, y: -200 });
    });
  }

  // --- Drawing helpers (no ctx.filter — uses offset shapes for shadows) ---
  function drawCircle(x, y, r, accent) {
    // Shadow dark (offset bottom-right)
    ctx.beginPath();
    ctx.arc(x + 5, y + 5, r + 2, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(140,155,175,0.3)';
    ctx.fill();

    // Shadow light (offset top-left)
    ctx.beginPath();
    ctx.arc(x - 4, y - 4, r + 2, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.fill();

    // Body
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = accent ? 'rgba(242,122,26,0.25)' : BG;
    ctx.fill();

    // Highlight
    if (!accent) {
      const g = ctx.createRadialGradient(x - r * 0.28, y - r * 0.28, 0, x, y, r);
      g.addColorStop(0, 'rgba(255,255,255,0.3)');
      g.addColorStop(0.6, 'rgba(255,255,255,0)');
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fillStyle = g;
      ctx.fill();
    }
  }

  function rrPath(x, y, hw, hh, cr) {
    ctx.beginPath();
    ctx.moveTo(x - hw + cr, y - hh);
    ctx.lineTo(x + hw - cr, y - hh);
    ctx.quadraticCurveTo(x + hw, y - hh, x + hw, y - hh + cr);
    ctx.lineTo(x + hw, y + hh - cr);
    ctx.quadraticCurveTo(x + hw, y + hh, x + hw - cr, y + hh);
    ctx.lineTo(x - hw + cr, y + hh);
    ctx.quadraticCurveTo(x - hw, y + hh, x - hw, y + hh - cr);
    ctx.lineTo(x - hw, y - hh + cr);
    ctx.quadraticCurveTo(x - hw, y - hh, x - hw + cr, y - hh);
    ctx.closePath();
  }

  function drawRect(x, y, angle, hw, hh, cr) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);

    // Shadow dark
    rrPath(4, 4, hw + 1, hh + 1, cr);
    ctx.fillStyle = 'rgba(140,155,175,0.3)';
    ctx.fill();

    // Shadow light
    rrPath(-3, -3, hw + 1, hh + 1, cr);
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.fill();

    // Body
    rrPath(0, 0, hw, hh, cr);
    ctx.fillStyle = BG;
    ctx.fill();

    // Highlight
    const g = ctx.createLinearGradient(-hw, -hh, hw * 0.3, hh * 0.3);
    g.addColorStop(0, 'rgba(255,255,255,0.18)');
    g.addColorStop(0.5, 'rgba(255,255,255,0)');
    rrPath(0, 0, hw, hh, cr);
    ctx.fillStyle = g;
    ctx.fill();

    ctx.restore();
  }

  // --- Gyroscope: tilt device to shift gravity ---
  let gyroEnabled = false;

  function handleOrientation(e) {
    if (e.gamma === null || e.beta === null) return;

    // gamma = left/right tilt (-90 to 90), beta = front/back tilt (-180 to 180)
    const gx = Math.max(-1, Math.min(1, e.gamma / 30));  // clamp tilt to gentle range
    const gy = Math.max(0.2, Math.min(1.5, (e.beta - 20) / 40 + 0.6)); // keep gravity mostly down

    engine.gravity.x = gx * 0.8;
    engine.gravity.y = gy;

    // Wake physics if settled
    if (settled) {
      settled = false;
      settledFrames = 0;
      Runner.run(runner, engine);
      render();
    }
  }

  // iOS 13+ requires permission request
  if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
    // We'll request on first user tap (iOS requirement)
    document.addEventListener('touchstart', function requestGyro() {
      DeviceOrientationEvent.requestPermission().then(state => {
        if (state === 'granted') {
          window.addEventListener('deviceorientation', handleOrientation);
          gyroEnabled = true;
        }
      }).catch(() => {});
      document.removeEventListener('touchstart', requestGyro);
    }, { once: true });
  } else if (typeof DeviceOrientationEvent !== 'undefined') {
    // Android / non-iOS — just listen
    window.addEventListener('deviceorientation', handleOrientation);
    gyroEnabled = true;
  }

  // --- Render ---
  const runner = Runner.create();
  Runner.run(runner, engine);

  let settled = false;
  let settledFrames = 0;
  let rafId;

  function render() {
    const now = performance.now();
    const elapsed = now - startTime;

    ctx.clearRect(0, 0, W, H);

    // Staggered drop: release shapes based on delay
    for (let i = 0; i < shapes.length; i++) {
      if (!shapes[i]._dropped && elapsed >= shapes[i]._delay) {
        dropShape(shapes[i]);
      }
    }

    // Draw trails (only for dropped shapes still in motion)
    ctx.save();
    ctx.setLineDash([4, 8]);
    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgba(163,177,198,0.2)';
    ctx.lineCap = 'round';
    for (let i = 0; i < shapes.length; i++) {
      const t = trails[i];
      if (t.length < 3) continue;
      ctx.beginPath();
      ctx.moveTo(t[0].x, t[0].y);
      for (let j = 1; j < t.length; j++) ctx.lineTo(t[j].x, t[j].y);
      ctx.stroke();
    }
    ctx.restore();

    // Draw shapes + track motion
    let totalSpeed = 0;
    let allDropped = true;
    for (let i = 0; i < shapes.length; i++) {
      const b = shapes[i];
      if (!b._dropped) { allDropped = false; continue; }
      const p = b.position;
      const spd = b.speed;
      totalSpeed += spd;

      // Record trail while moving
      if (spd > 0.5 && p.y < floorY - 30) {
        const t = trails[i];
        if (t.length === 0 || Math.hypot(p.x - t[t.length - 1].x, p.y - t[t.length - 1].y) > 10) {
          t.push({ x: p.x, y: p.y });
          if (t.length > 35) t.shift();
        }
      }

      if (b._type === 'circle') {
        drawCircle(p.x, p.y, b._r, b._accent);
      } else {
        drawRect(p.x, p.y, b.angle, b._w / 2, b._h / 2, b._cr);
      }
    }

    // Settle detection: only after 10s, all dropped, and barely moving
    if (allDropped && elapsed > 12000 && totalSpeed < 0.12) {
      settledFrames++;
      if (settledFrames > 60) {
        settled = true;
        Runner.stop(runner);
        return; // final static frame stays painted
      }
    } else {
      settledFrames = 0;
    }

    rafId = requestAnimationFrame(render);
  }

  render();


  // Resize — only reload on significant WIDTH change (not height, which changes on mobile scroll/tilt)
  let lastWidth = window.innerWidth;
  window.addEventListener('resize', () => {
    const newWidth = window.innerWidth;
    if (Math.abs(newWidth - lastWidth) > 100) {
      lastWidth = newWidth;
      location.reload();
    }
  });
})();
