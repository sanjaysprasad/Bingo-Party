/**
 * Lightweight Zero-Dependency Canvas Confetti Engine
 * Compatible with canvas-confetti API
 */
(function(window) {
  let canvas = null;
  let ctx = null;
  let particles = [];
  let animationId = null;

  function initCanvas() {
    if (canvas) return;
    canvas = document.createElement('canvas');
    canvas.id = 'bingo-confetti-canvas';
    canvas.style.position = 'fixed';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100vw';
    canvas.style.height = '100vh';
    canvas.style.pointerEvents = 'none';
    canvas.style.zIndex = '999999';
    document.body.appendChild(canvas);
    ctx = canvas.getContext('2d');
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
  }

  function resizeCanvas() {
    if (!canvas) return;
    canvas.width = window.innerWidth * window.devicePixelRatio;
    canvas.height = window.innerHeight * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
  }

  const DEFAULT_COLORS = ['#ff3366', '#ffcc00', '#33cc66', '#3399ff', '#9933ff', '#ff6600', '#ff69b4', '#00f0ff'];

  function createParticle(x, y, options) {
    const angle = options.angle ? (options.angle * Math.PI) / 180 : Math.random() * Math.PI * 2;
    const spread = options.spread ? (options.spread * Math.PI) / 180 : Math.PI;
    const particleAngle = angle + (Math.random() - 0.5) * spread;
    const velocity = (options.startVelocity || 35) * (0.6 + Math.random() * 0.8);

    return {
      x: x,
      y: y,
      vx: Math.cos(particleAngle) * velocity,
      vy: Math.sin(particleAngle) * velocity,
      color: options.colors[Math.floor(Math.random() * options.colors.length)],
      radius: 4 + Math.random() * 4,
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 12,
      gravity: options.gravity || 0.45,
      friction: 0.96,
      opacity: 1,
      decay: 0.01 + Math.random() * 0.015,
      shape: Math.random() > 0.3 ? 'rect' : 'circle',
      w: 8 + Math.random() * 8,
      h: 4 + Math.random() * 6
    };
  }

  function update() {
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.vx *= p.friction;
      p.vy *= p.friction;
      p.vy += p.gravity;
      p.x += p.vx;
      p.y += p.vy;
      p.rotation += p.rotationSpeed;
      p.opacity -= p.decay;

      if (p.opacity <= 0 || p.y > window.innerHeight + 50) {
        particles.splice(i, 1);
        continue;
      }

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate((p.rotation * Math.PI) / 180);
      ctx.globalAlpha = Math.max(0, p.opacity);
      ctx.fillStyle = p.color;

      if (p.shape === 'rect') {
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      } else {
        ctx.beginPath();
        ctx.arc(0, 0, p.radius, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    if (particles.length > 0) {
      animationId = requestAnimationFrame(update);
    } else {
      animationId = null;
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    }
  }

  function confetti(opts = {}) {
    initCanvas();
    const count = opts.particleCount || 60;
    const origin = opts.origin || { x: 0.5, y: 0.5 };
    const x = origin.x * window.innerWidth;
    const y = origin.y * window.innerHeight;
    const colors = opts.colors || DEFAULT_COLORS;

    for (let i = 0; i < count; i++) {
      particles.push(createParticle(x, y, { ...opts, colors }));
    }

    if (!animationId) {
      animationId = requestAnimationFrame(update);
    }
  }

  function fireBingoCannons() {
    initCanvas();
    const end = Date.now() + 3500;
    const colors = ['#ffd700', '#ff0055', '#00e5ff', '#76ff03', '#d500f9', '#ffffff'];

    (function frame() {
      confetti({
        particleCount: 7,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.7 },
        colors: colors,
        startVelocity: 50
      });
      confetti({
        particleCount: 7,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.7 },
        colors: colors,
        startVelocity: 50
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    })();
  }

  window.BingoConfetti = {
    fire: confetti,
    fireBingoCannons: fireBingoCannons
  };
})(window);
