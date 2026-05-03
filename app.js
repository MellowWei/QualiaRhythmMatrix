// ═══════════════════════════════════════════════════════
// 振动即存在 · Premium · app.js
// 3 层粒子场 · 公式打字机 · 滚动渐入 · 实时仪表板
// ═══════════════════════════════════════════════════════

(function () {
  'use strict';

  // ═══════════════════════════════════════════════
  // 多层粒子场(三个 canvas 叠加)
  // ═══════════════════════════════════════════════

  function makeParticleLayer(canvasId, config) {
    var canvas = document.getElementById(canvasId);
    if (!canvas) return;
    var ctx = canvas.getContext('2d');
    var w, h, dpr;
    var particles = [];

    function resize() {
      dpr = window.devicePixelRatio || 1;
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = w + 'px';
      canvas.style.height = h + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function init() {
      resize();
      particles.length = 0;
      var density = (w * h) / config.divisor;
      var n = Math.min(config.maxCount, Math.floor(density));
      for (var i = 0; i < n; i++) {
        var color = config.colors[Math.floor(Math.random() * config.colors.length)];
        particles.push({
          x: Math.random() * w,
          y: Math.random() * h,
          size: config.minSize + Math.random() * (config.maxSize - config.minSize),
          color: color,
          vx: (Math.random() - 0.5) * config.speed,
          vy: (Math.random() - 0.5) * config.speed,
          phase: Math.random() * Math.PI * 2,
          phaseSpeed: config.phaseMin + Math.random() * (config.phaseMax - config.phaseMin),
          baseAlpha: config.alphaMin + Math.random() * (config.alphaMax - config.alphaMin),
          shape: config.shape,
          glow: Math.random() > config.glowChance
        });
      }
    }

    function tick() {
      ctx.clearRect(0, 0, w, h);
      ctx.globalCompositeOperation = 'lighter';

      for (var i = 0; i < particles.length; i++) {
        var p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.phase += p.phaseSpeed;
        if (p.x < -10) p.x = w + 10;
        if (p.x > w + 10) p.x = -10;
        if (p.y < -10) p.y = h + 10;
        if (p.y > h + 10) p.y = -10;

        var alpha = p.baseAlpha * (0.4 + Math.sin(p.phase) * 0.6);
        alpha = Math.max(0, Math.min(1, alpha));

        // 大粒子有光晕
        if (p.glow && p.size > 1.6) {
          var grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 8);
          grad.addColorStop(0, p.color + Math.floor(alpha * 80).toString(16).padStart(2, '0'));
          grad.addColorStop(1, p.color + '00');
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * 8, 0, Math.PI * 2);
          ctx.fill();
        }

        // 主体
        ctx.fillStyle = p.color + Math.floor(alpha * 255).toString(16).padStart(2, '0');
        if (p.shape === 'square') {
          ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
        } else {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      ctx.globalCompositeOperation = 'source-over';
      requestAnimationFrame(tick);
    }

    var rt;
    window.addEventListener('resize', function () {
      clearTimeout(rt);
      rt = setTimeout(init, 200);
    });
    init();
    tick();
  }

  // 三层叠加:bg(慢且稀)+ mid(主体金粒子方块)+ fg(零星亮点)
  function initAllParticles() {
    // 背景层 · 慢漂移的远星 · 雾蓝/薄紫
    makeParticleLayer('particles-bg', {
      divisor: 8000,
      maxCount: 180,
      colors: ['#7dd9d4', '#c8a6e8', '#8eb8e8', '#f0ead8'],
      minSize: 0.4, maxSize: 1.2,
      speed: 0.025,
      phaseMin: 0.003, phaseMax: 0.012,
      alphaMin: 0.1, alphaMax: 0.45,
      shape: 'circle',
      glowChance: 0.95
    });

    // 中层 · 金色像素方块(QRM 招牌)
    makeParticleLayer('particles-mid', {
      divisor: 2400,
      maxCount: 600,
      colors: ['#e8c389', '#d4a056', '#f0ead8'],
      minSize: 1.2, maxSize: 2.6,
      speed: 0.05,
      phaseMin: 0.006, phaseMax: 0.018,
      alphaMin: 0.2, alphaMax: 0.7,
      shape: 'square',
      glowChance: 0.85
    });

    // 前景层 · 罕见的亮金 / 玫红光点(惊喜)
    makeParticleLayer('particles-fg', {
      divisor: 18000,
      maxCount: 80,
      colors: ['#e8c389', '#e8a6b8', '#ffffff'],
      minSize: 1.8, maxSize: 3.5,
      speed: 0.04,
      phaseMin: 0.01, phaseMax: 0.025,
      alphaMin: 0.3, alphaMax: 0.85,
      shape: 'square',
      glowChance: 0.5  // 50% 都有光晕,显得显眼
    });
  }

  // ═══════════════════════════════════════════════
  // 公式打字机
  // ═══════════════════════════════════════════════
  function typeFormulas() {
    var formulas = document.querySelectorAll('.prop-formula');
    formulas.forEach(function (el, idx) {
      var text = el.dataset.formula;
      if (!text) return;
      el.textContent = '';
      el.classList.add('typing');

      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting && !el.dataset.typed) {
            el.dataset.typed = '1';
            io.disconnect();

            var i = 0;
            var interval = setInterval(function () {
              if (i >= text.length) {
                clearInterval(interval);
                setTimeout(function () { el.classList.remove('typing'); }, 800);
                return;
              }
              el.textContent += text[i];
              i++;
            }, 50 + Math.random() * 30);
          }
        });
      }, { threshold: 0.4 });

      io.observe(el);
    });
  }

  // ═══════════════════════════════════════════════
  // 滚动渐入
  // ═══════════════════════════════════════════════
  function initRevealOnScroll() {
    var els = document.querySelectorAll('.reveal-up');
    if (!('IntersectionObserver' in window)) {
      els.forEach(function (el) { el.classList.add('is-visible'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add('is-visible');
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.15 });
    els.forEach(function (el) {
      // hero 内部 reveal 立即显示
      if (el.closest('.hero')) {
        setTimeout(function () { el.classList.add('is-visible'); }, 100);
      } else {
        io.observe(el);
      }
    });
  }

  // ═══════════════════════════════════════════════
  // 实时仪表板(数值 + 进度条)
  // ═══════════════════════════════════════════════
  function initDashboard() {
    var freqEl = document.getElementById('dash-freq');
    var partEl = document.getElementById('dash-particles');
    var phaseEl = document.getElementById('dash-phase');
    var ampEl = document.getElementById('dash-amp');
    var freqBar = document.getElementById('freq-bar');
    var partBar = document.getElementById('part-bar');
    var phaseBar = document.getElementById('phase-bar');
    var ampBar = document.getElementById('amp-bar');
    if (!freqEl) return;

    var t = 0;
    setInterval(function () {
      t += 0.04;
      var freq = 427 + Math.sin(t * 0.7) * 0.8;
      var phase = (t * 0.3) % (Math.PI * 2);
      var amp = 0.85 + Math.sin(t * 1.1) * 0.15;
      var particles = 3000 + Math.floor(Math.sin(t * 0.5) * 30);

      freqEl.textContent = freq.toFixed(2) + ' Hz';
      partEl.textContent = particles.toLocaleString();
      phaseEl.textContent = phase.toFixed(3) + ' rad';
      ampEl.textContent = amp.toFixed(3);

      // 条形动态(基于值的相对位置)
      if (freqBar) freqBar.style.width = (50 + Math.sin(t * 0.7) * 40) + '%';
      if (partBar) partBar.style.width = (60 + Math.sin(t * 0.5) * 30) + '%';
      if (phaseBar) phaseBar.style.width = ((phase / (Math.PI * 2)) * 100) + '%';
      if (ampBar) ampBar.style.width = (amp * 100) + '%';
    }, 80);
  }

  // ═══════════════════════════════════════════════
  // BOOT
  // ═══════════════════════════════════════════════
  function boot() {
    initAllParticles();
    typeFormulas();
    initRevealOnScroll();
    initDashboard();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
