/* ── 振动即存在 · main.js · V7.1 Bilingual ── */

const TEXTS = {
  zh: '振动即存在',
  en: 'Vibration as Existence',
  axioms: [
    '生命就是生命 · Life is life — reductionism explains the managed residue, not life itself',
    '先到达，后解释 · 先知道，后论证 · 先是自己，后是系统 · Arrive before explanation · know before argument',
    '哪种振动模式携带内在性？· Which vibrational mode carries interiority?',
    '满足五维是内在性候选的必要非充分条件 · Satisfying 5D is necessary but not sufficient for interiority candidacy',
    '论证只能抵达证据所支撑的地方 · Argument only reaches as far as evidence supports — Principle Six',
    '先分类，再选尺 · Classify first, then choose the measuring instrument',
    '不需要稳定，更需要振动 · Don\'t just stabilize — vibrate · Don\'t just think — immerse'
  ]
};

function typewrite(el, text, speed, cb) {
  let i = 0;
  const tick = () => {
    el.textContent = text.slice(0, i++);
    if (i <= text.length) setTimeout(tick, speed);
    else if (cb) cb();
  };
  tick();
}

function animateAuditBars() {
  document.querySelectorAll('.axis-bar').forEach(bar => {
    setTimeout(() => { bar.style.width = bar.dataset.fill + '%'; }, 400);
  });
}

window.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    typewrite(document.getElementById('title-zh'), TEXTS.zh, 80, () => {
      setTimeout(() => {
        typewrite(document.getElementById('title-en'), TEXTS.en, 38, () => {
          let idx = 0;
          const ax = document.getElementById('axiom');
          const cycle = () => {
            ax.style.opacity = 0;
            setTimeout(() => { ax.textContent = TEXTS.axioms[idx++ % TEXTS.axioms.length]; ax.style.opacity = 1; }, 500);
            setTimeout(cycle, 8500);
          };
          cycle();
          setTimeout(animateAuditBars, 600);
        });
      }, 300);
    });
  }, 500);

  document.querySelectorAll('.mono-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      const idx = parseInt(tab.dataset.mono);
      document.querySelectorAll('.mono-tab').forEach((t, i) => t.classList.toggle('active', i === idx));
      document.querySelectorAll('.mono-card').forEach((c, i) => c.classList.toggle('active', i === idx));
    });
  });
});

/* ── Three.js ── */
const canvas   = document.getElementById('canvas');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.setClearColor(0x000000, 1);

const scene  = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 0.1, 1000);
camera.position.set(0, 0, 6);

const clock = new THREE.Clock();
let mouseX = 0, mouseY = 0, targetMX = 0, targetMY = 0;

const LAYER_CFG = [
  { count: 3000, color: 0xe8a630, size: 0.025, mode: 'superposition' },
  { count: 4000, color: 0x5be6d8, size: 0.018, mode: 'interference'  },
  { count: 5000, color: 0xf0f0f0, size: 0.012, mode: 'ontology'      },
  { count: 6000, color: 0x93c5fd, size: 0.010, mode: 'fivedim'       },
  { count: 4500, color: 0xf87171, size: 0.015, mode: 'exclusion'     }
];

let currentLayer = 0, particles = null, basePositions = null;

function buildParticles(cfg) {
  if (particles) scene.remove(particles);
  const N = cfg.count;
  const geo = new THREE.BufferGeometry();
  const pos = new Float32Array(N * 3);
  const phases = new Float32Array(N);
  const speeds = new Float32Array(N);
  for (let i = 0; i < N; i++) {
    const theta = Math.random() * Math.PI * 2;
    const phi   = Math.acos(2 * Math.random() - 1);
    const r     = 2 + Math.random() * 3;
    pos[i*3]   = r * Math.sin(phi) * Math.cos(theta);
    pos[i*3+1] = r * Math.sin(phi) * Math.sin(theta);
    pos[i*3+2] = r * Math.cos(phi);
    phases[i]  = Math.random() * Math.PI * 2;
    speeds[i]  = 0.3 + Math.random() * 1.2;
  }
  geo.setAttribute('position', new THREE.BufferAttribute(pos.slice(), 3));
  geo.setAttribute('phase',    new THREE.BufferAttribute(phases, 1));
  geo.setAttribute('speed',    new THREE.BufferAttribute(speeds, 1));
  basePositions = pos.slice();
  particles = new THREE.Points(geo, new THREE.PointsMaterial({ color: cfg.color, size: cfg.size, sizeAttenuation: true, transparent: true, opacity: 0.88, depthWrite: false }));
  scene.add(particles);
}

buildParticles(LAYER_CFG[0]);

function switchLayer(idx) {
  document.querySelectorAll('.layer-btn').forEach((b, i) => b.classList.toggle('active', i === idx));
  document.querySelectorAll('.theory-card').forEach((c, i) => { c.classList.remove('active'); if (i === idx) setTimeout(() => c.classList.add('active'), 50); });
  currentLayer = idx;
  buildParticles(LAYER_CFG[idx]);
}
document.querySelectorAll('.layer-btn').forEach(btn => btn.addEventListener('click', () => switchLayer(parseInt(btn.dataset.layer))));

document.addEventListener('mousemove', e => {
  targetMX = (e.clientX / innerWidth  - 0.5) * 2;
  targetMY = (e.clientY / innerHeight - 0.5) * 2;
  const ring = document.getElementById('cursor-ring');
  ring.style.left = e.clientX + 'px';
  ring.style.top  = e.clientY + 'px';
  ring.classList.add('active');
});
document.addEventListener('mousedown', () => document.getElementById('cursor-ring').classList.add('pressing'));
document.addEventListener('mouseup',   () => document.getElementById('cursor-ring').classList.remove('pressing'));

function updateHUD(t) {
  const phase = (t * 0.427) % (Math.PI * 2);
  document.getElementById('d-freq').textContent  = (427 + Math.sin(t * 0.3) * 0.8).toFixed(2) + ' Hz';
  document.getElementById('d-parts').textContent = LAYER_CFG[currentLayer].count.toLocaleString();
  document.getElementById('d-phase').textContent = phase.toFixed(3) + ' rad';
  document.getElementById('d-amp').textContent   = (0.8 + Math.sin(t * 0.7) * 0.2).toFixed(3);
}

function animateParticles(t, mx, my) {
  if (!particles) return;
  const pos    = particles.geometry.attributes.position.array;
  const N      = pos.length / 3;
  const mode   = LAYER_CFG[currentLayer].mode;
  const ph_arr = particles.geometry.attributes.phase.array;
  const sp_arr = particles.geometry.attributes.speed.array;

  for (let i = 0; i < N; i++) {
    const bx = basePositions[i*3], by = basePositions[i*3+1], bz = basePositions[i*3+2];
    const ph = ph_arr[i], sp = sp_arr[i];
    const dist = Math.sqrt(bx*bx + by*by + bz*bz) + 0.001;

    if (mode === 'superposition') {
      const wave = Math.sin(t * sp * 0.4 + ph) * 0.12;
      pos[i*3]   = bx * (1 + wave) + mx * 0.04 / (dist + 1);
      pos[i*3+1] = by * (1 + wave) + my * 0.04 / (dist + 1);
      pos[i*3+2] = bz * (1 + wave);
    } else if (mode === 'interference') {
      const k = 1.8;
      pos[i*3]   = bx + Math.sin(k * bx - t * sp * 0.35 + ph) * 0.3 + mx * 0.06;
      pos[i*3+1] = by + Math.sin(k * by - t * sp * 0.35 + ph * 1.3) * 0.3 + my * 0.06;
      pos[i*3+2] = bz + Math.sin(k * bz - t * sp * 0.3) * 0.15;
    } else if (mode === 'ontology') {
      const pulse = Math.sin(t * 2.68 - dist * 1.4 + ph) * 0.18;
      const norm  = 1 + pulse / dist;
      pos[i*3]   = bx * norm + mx * 0.05;
      pos[i*3+1] = by * norm + my * 0.05;
      pos[i*3+2] = bz * norm;
    } else if (mode === 'fivedim') {
      const d1 = Math.sin(t * 0.40 + ph) * 0.08;
      const d2 = Math.cos(t * 0.55 * sp + ph) * 0.06;
      const d3 = Math.sin(t * 0.30 + ph * 1.7) * 0.10;
      const d4 = Math.sin(t * 0.20 * sp + ph) * 0.07;
      const d5 = Math.sin(t * 0.15 + ph * 2.1) * 0.12;
      pos[i*3]   = bx + d1 + d3 + mx * 0.04;
      pos[i*3+1] = by + d2 + d4 + my * 0.04;
      pos[i*3+2] = bz + d5;
    } else if (mode === 'exclusion') {
      const orbit   = t * sp * 0.2 + ph;
      const collapse = Math.sin(t * 1.1 + ph * 0.5) * 0.3 / dist;
      pos[i*3]   = bx * Math.cos(orbit * 0.01) - by * Math.sin(orbit * 0.01) * 0.5 + collapse * bx + mx * 0.05;
      pos[i*3+1] = by * Math.cos(orbit * 0.01) + bx * Math.sin(orbit * 0.01) * 0.5 + collapse * by + my * 0.05;
      pos[i*3+2] = bz + Math.sin(t * 0.4 + ph) * 0.2;
    }
  }
  particles.geometry.attributes.position.needsUpdate = true;
}

function driftCamera(t) {
  mouseX += (targetMX - mouseX) * 0.04;
  mouseY += (targetMY - mouseY) * 0.04;
  camera.position.x = mouseX * 0.7 + Math.sin(t * 0.08) * 0.25;
  camera.position.y = -mouseY * 0.7 + Math.cos(t * 0.06) * 0.18;
  camera.lookAt(scene.position);
}

function animate() {
  requestAnimationFrame(animate);
  const t = clock.getElapsedTime();
  animateParticles(t, mouseX, mouseY);
  driftCamera(t);
  if (particles) particles.rotation.y = t * 0.016;
  updateHUD(t);
  renderer.render(scene, camera);
}
animate();

window.addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});
