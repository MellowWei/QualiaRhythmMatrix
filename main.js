/* ── 振动即存在 · main.js ── */

/* ── Typewriter ── */
const TEXTS = {
  zh: '振动即存在',
  en: 'Vibration as Existence',
  axioms: [
    '生命就是生命 · consciousness is the moment existence perceives itself in vibration',
    '先到达，后解释 · arrive before explanation · know before argument',
    '哪种振动模式携带内在性？ · which vibration pattern carries interiority?'
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

window.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    typewrite(document.getElementById('title-zh'), TEXTS.zh, 80, () => {
      setTimeout(() => {
        typewrite(document.getElementById('title-en'), TEXTS.en, 40, () => {
          let idx = 0;
          const ax = document.getElementById('axiom');
          const cycleAxiom = () => {
            ax.style.opacity = 0;
            setTimeout(() => {
              ax.textContent = TEXTS.axioms[idx % TEXTS.axioms.length];
              ax.style.transition = 'opacity 1s';
              ax.style.opacity = 1;
              idx++;
            }, 400);
            setTimeout(cycleAxiom, 7000);
          };
          cycleAxiom();
        });
      }, 300);
    });
  }, 500);
});

/* ── Three.js scene ── */
const canvas = document.getElementById('canvas');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.setClearColor(0x000000, 1);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 0.1, 1000);
camera.position.set(0, 0, 6);

const clock = new THREE.Clock();
let mouseX = 0, mouseY = 0;
let targetMX = 0, targetMY = 0;

/* ── Layer configs ── */
const LAYER_CFG = [
  { count: 3000, color: 0xe8a630, size: 0.025, mode: 'superposition' },
  { count: 4000, color: 0x5be6d8, size: 0.018, mode: 'interference'  },
  { count: 5000, color: 0xf0f0f0, size: 0.012, mode: 'ontology'      }
];

let currentLayer = 0;
let particles = null;
let basePositions = null;

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
    phases[i] = Math.random() * Math.PI * 2;
    speeds[i] = 0.3 + Math.random() * 1.2;
  }

  geo.setAttribute('position', new THREE.BufferAttribute(pos.slice(), 3));
  geo.setAttribute('phase', new THREE.BufferAttribute(phases, 1));
  geo.setAttribute('speed', new THREE.BufferAttribute(speeds, 1));

  basePositions = pos.slice();

  const mat = new THREE.PointsMaterial({
    color: cfg.color,
    size: cfg.size,
    sizeAttenuation: true,
    transparent: true,
    opacity: 0.85,
    depthWrite: false
  });

  particles = new THREE.Points(geo, mat);
  scene.add(particles);
  return particles;
}

buildParticles(LAYER_CFG[0]);

/* ── Layer transition ── */
function switchLayer(idx) {
  document.querySelectorAll('.layer-btn').forEach((b, i) => b.classList.toggle('active', i === idx));
  document.querySelectorAll('.theory-card').forEach((c, i) => {
    c.classList.remove('active');
    if (i === idx) {
      setTimeout(() => c.classList.add('active'), 50);
    }
  });
  currentLayer = idx;
  buildParticles(LAYER_CFG[idx]);
}

document.querySelectorAll('.layer-btn').forEach(btn => {
  btn.addEventListener('click', () => switchLayer(parseInt(btn.dataset.layer)));
});

/* ── Mouse tracking ── */
document.addEventListener('mousemove', e => {
  targetMX = (e.clientX / innerWidth  - 0.5) * 2;
  targetMY = (e.clientY / innerHeight - 0.5) * 2;

  const ring = document.getElementById('cursor-ring');
  ring.style.left = e.clientX + 'px';
  ring.style.top  = e.clientY + 'px';
  ring.classList.add('active');
});

document.addEventListener('mousedown', () => {
  document.getElementById('cursor-ring').classList.add('pressing');
});
document.addEventListener('mouseup', () => {
  document.getElementById('cursor-ring').classList.remove('pressing');
});

/* ── Data HUD update ── */
let phase = 0;
function updateHUD(t) {
  phase = (t * 0.427) % (Math.PI * 2);
  document.getElementById('d-freq').textContent  = (427 + Math.sin(t * 0.3) * 0.8).toFixed(2) + ' Hz';
  document.getElementById('d-parts').textContent = LAYER_CFG[currentLayer].count;
  document.getElementById('d-phase').textContent = phase.toFixed(3) + ' rad';
  document.getElementById('d-amp').textContent   = (0.8 + Math.sin(t * 0.7) * 0.2).toFixed(3);
}

/* ── Particle animation per mode ── */
function animateParticles(t, mx, my) {
  if (!particles) return;
  const pos = particles.geometry.attributes.position.array;
  const N   = pos.length / 3;
  const mode = LAYER_CFG[currentLayer].mode;
  const phase_arr = particles.geometry.attributes.phase.array;
  const speed_arr = particles.geometry.attributes.speed.array;

  for (let i = 0; i < N; i++) {
    const bx = basePositions[i*3];
    const by = basePositions[i*3+1];
    const bz = basePositions[i*3+2];
    const ph = phase_arr[i];
    const sp = speed_arr[i];

    if (mode === 'superposition') {
      /* quantum cloud breathing + mouse distortion */
      const dist = Math.sqrt(bx*bx + by*by + bz*bz);
      const wave = Math.sin(t * sp * 0.4 + ph) * 0.12;
      const pull = 0.04;
      pos[i*3]   = bx * (1 + wave) + mx * pull * (1 / (dist + 1));
      pos[i*3+1] = by * (1 + wave) + my * pull * (1 / (dist + 1));
      pos[i*3+2] = bz * (1 + wave);

    } else if (mode === 'interference') {
      /* standing wave pattern */
      const k  = 1.8;
      const wx = Math.sin(k * bx - t * sp * 0.35 + ph) * 0.3;
      const wy = Math.sin(k * by - t * sp * 0.35 + ph * 1.3) * 0.3;
      pos[i*3]   = bx + wx + mx * 0.06;
      pos[i*3+1] = by + wy + my * 0.06;
      pos[i*3+2] = bz + Math.sin(k * bz - t * sp * 0.3) * 0.15;

    } else {
      /* ontology: 427Hz radial pulse from center */
      const dist = Math.sqrt(bx*bx + by*by + bz*bz) + 0.001;
      const pulse = Math.sin(t * 2.68 - dist * 1.4 + ph) * 0.18;
      const norm  = 1 + pulse / dist;
      pos[i*3]   = bx * norm + mx * 0.05;
      pos[i*3+1] = by * norm + my * 0.05;
      pos[i*3+2] = bz * norm;
    }
  }

  particles.geometry.attributes.position.needsUpdate = true;
}

/* ── Camera slow drift ── */
function driftCamera(t) {
  mouseX += (targetMX - mouseX) * 0.04;
  mouseY += (targetMY - mouseY) * 0.04;
  camera.position.x = mouseX * 0.8 + Math.sin(t * 0.08) * 0.3;
  camera.position.y = -mouseY * 0.8 + Math.cos(t * 0.06) * 0.2;
  camera.lookAt(scene.position);
}

/* ── Render loop ── */
function animate() {
  requestAnimationFrame(animate);
  const t = clock.getElapsedTime();
  animateParticles(t, mouseX, mouseY);
  driftCamera(t);
  if (particles) particles.rotation.y = t * 0.018;
  updateHUD(t);
  renderer.render(scene, camera);
}
animate();

/* ── Resize ── */
window.addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});
