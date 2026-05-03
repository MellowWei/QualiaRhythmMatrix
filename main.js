/* ── 振动即存在 · QualiaRhythmMatrix V7.2 · main.js ── */

/* ── Typewriter ── */
const TITLE_ZH = '振动即存在';
const TITLE_EN = 'Vibration as Existence · QualiaRhythmMatrix';

function typewrite(el, text, speed, cb) {
  let i = 0;
  const tick = () => { el.textContent = text.slice(0, i++); if (i <= text.length) setTimeout(tick, speed); else if (cb) cb(); };
  tick();
}

function animateAuditBars() {
  document.querySelectorAll('.axis-bar').forEach(bar => {
    setTimeout(() => { bar.style.width = bar.dataset.fill + '%'; }, 400);
  });
}

window.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    typewrite(document.getElementById('title-zh'), TITLE_ZH, 80, () => {
      setTimeout(() => {
        typewrite(document.getElementById('title-en'), TITLE_EN, 32, () => {
          setTimeout(animateAuditBars, 500);
        });
      }, 300);
    });
  }, 500);

  /* ── Mono tabs ── */
  document.querySelectorAll('.mono-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      const idx = parseInt(tab.dataset.mono);
      document.querySelectorAll('.mono-tab').forEach((t, i) => t.classList.toggle('active', i === idx));
      document.querySelectorAll('.mono-card').forEach((c, i) => c.classList.toggle('active', i === idx));
    });
  });

  /* ── Logic node tooltips ── */
  const tooltip = document.getElementById('lnode-tooltip');
  document.querySelectorAll('.lnode').forEach(node => {
    node.addEventListener('mouseenter', e => {
      tooltip.textContent = node.dataset.logic;
      tooltip.classList.add('visible');
      positionTooltip(e);
    });
    node.addEventListener('mousemove', positionTooltip);
    node.addEventListener('mouseleave', () => tooltip.classList.remove('visible'));
  });

  function positionTooltip(e) {
    const x = e.clientX + 14;
    const y = e.clientY - 32;
    tooltip.style.left = Math.min(x, window.innerWidth - 300) + 'px';
    tooltip.style.top  = Math.max(y, 8) + 'px';
  }

  /* ── Adversarial Audit ── */
  const btn = document.getElementById('audit-btn');
  const inp = document.getElementById('audit-input');
  btn.addEventListener('click', runAudit);
  inp.addEventListener('keydown', e => { if (e.key === 'Enter') runAudit(); });
});

/* Audit logic — proposition decomposer */
function runAudit() {
  const input = document.getElementById('audit-input').value.trim();
  if (!input) return;

  const output = document.getElementById('audit-output');
  output.classList.remove('audit-hidden');
  output.classList.add('audit-visible');

  /* ── Scoring heuristics ── */
  let circularity = 0;
  let foam = 0;

  /* circularity signals */
  const circularKeywords = ['一定', '本质上', '必然', '根本', '不可能', '绝对', 'necessarily', 'essentially', 'must be', 'obviously'];
  const foamKeywords = ['意义', '本质', '真相', '终极', '宇宙', 'meaning', 'truth', 'ultimate', 'essence'];
  const structuralKeywords = ['因为', '所以', '如果', '那么', '证明', 'because', 'therefore', 'if', 'then', 'proof', 'evidence'];

  circularKeywords.forEach(k => { if (input.includes(k)) circularity += 22; });
  foamKeywords.forEach(k => { if (input.includes(k)) foam += 18; });
  structuralKeywords.forEach(k => { if (input.includes(k)) { circularity -= 8; foam -= 8; } });

  if (input.length < 10) { circularity += 40; foam += 30; }
  if (input.length > 60) { circularity -= 10; foam -= 10; }

  /* add noise ± small amount */
  circularity = Math.max(0, Math.min(99.9, circularity + (Math.random() * 14 - 4)));
  foam        = Math.max(0, Math.min(99.9, foam        + (Math.random() * 16 - 5)));

  document.getElementById('m-circular').textContent = circularity.toFixed(1) + '%';
  document.getElementById('m-foam').textContent     = foam.toFixed(1) + '%';

  const verdictEl  = document.getElementById('m-verdict');
  const commentEl  = document.getElementById('audit-comment');

  if (circularity > 70) {
    verdictEl.textContent = 'FAILED: CIRCULAR LOOP';
    verdictEl.style.color = '#f87171';
    commentEl.textContent = '审计结果：该命题试图通过预设结论来论证自身。逻辑坍塌——违反律二（循环禁止律）。建议重新检查举证责任归属（律一），并提供非占位性构成性判据。';
  } else if (foam > 60) {
    verdictEl.textContent = 'REJECTED: SEMANTIC FOAM';
    verdictEl.style.color = '#fbbf24';
    commentEl.textContent = '审计结果：语义密度过低。充满本体论占位符，不具备可验证的物理参数（律三）。这类命题若宣称是经验命题，则违反可证伪性要求。若是本体论姿态命题，则无需进入论证链。先分类，再选尺。';
  } else if (circularity > 40 || foam > 35) {
    verdictEl.textContent = 'PARTIAL: DEFEASIBLE';
    verdictEl.style.color = '#5be6d8';
    commentEl.textContent = '审计结果：具备初步结构，但可证伪性路径尚不明确。建议在 427Hz 频率下重新校准——即检查命题类型（本体论/结构性/经验性/防御性），并确认对应的评估尺度。论证只能抵达证据所支撑的地方（律六）。';
  } else {
    verdictEl.textContent = 'PASS: STRUCTURALLY SOUND';
    verdictEl.style.color = '#86efac';
    commentEl.textContent = '审计结果：命题具备初步结构合法性。循环指数与语义泡沫残留均在可接受范围。建议继续进行 PRAP 预注册与 NRIP 验证流程以获得正面归因资格。';
  }
}

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
  const pos = new Float32Array(N * 3), phases = new Float32Array(N), speeds = new Float32Array(N);
  for (let i = 0; i < N; i++) {
    const t = Math.random() * Math.PI * 2, p = Math.acos(2 * Math.random() - 1), r = 2 + Math.random() * 3;
    pos[i*3] = r*Math.sin(p)*Math.cos(t); pos[i*3+1] = r*Math.sin(p)*Math.sin(t); pos[i*3+2] = r*Math.cos(p);
    phases[i] = Math.random() * Math.PI * 2; speeds[i] = 0.3 + Math.random() * 1.2;
  }
  geo.setAttribute('position', new THREE.BufferAttribute(pos.slice(), 3));
  geo.setAttribute('phase', new THREE.BufferAttribute(phases, 1));
  geo.setAttribute('speed', new THREE.BufferAttribute(speeds, 1));
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
  targetMX = (e.clientX / innerWidth - 0.5) * 2;
  targetMY = (e.clientY / innerHeight - 0.5) * 2;
  const ring = document.getElementById('cursor-ring');
  ring.style.left = e.clientX + 'px'; ring.style.top = e.clientY + 'px';
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
  const pos = particles.geometry.attributes.position.array;
  const N = pos.length / 3;
  const mode = LAYER_CFG[currentLayer].mode;
  const ph = particles.geometry.attributes.phase.array;
  const sp = particles.geometry.attributes.speed.array;
  for (let i = 0; i < N; i++) {
    const bx = basePositions[i*3], by = basePositions[i*3+1], bz = basePositions[i*3+2];
    const p = ph[i], s = sp[i], d = Math.sqrt(bx*bx+by*by+bz*bz)+0.001;
    if (mode === 'superposition') {
      const w = Math.sin(t*s*0.4+p)*0.12;
      pos[i*3]=bx*(1+w)+mx*0.04/(d+1); pos[i*3+1]=by*(1+w)+my*0.04/(d+1); pos[i*3+2]=bz*(1+w);
    } else if (mode === 'interference') {
      const k=1.8;
      pos[i*3]=bx+Math.sin(k*bx-t*s*0.35+p)*0.3+mx*0.06; pos[i*3+1]=by+Math.sin(k*by-t*s*0.35+p*1.3)*0.3+my*0.06; pos[i*3+2]=bz+Math.sin(k*bz-t*s*0.3)*0.15;
    } else if (mode === 'ontology') {
      const pulse=Math.sin(t*2.68-d*1.4+p)*0.18, n=1+pulse/d;
      pos[i*3]=bx*n+mx*0.05; pos[i*3+1]=by*n+my*0.05; pos[i*3+2]=bz*n;
    } else if (mode === 'fivedim') {
      pos[i*3]=bx+Math.sin(t*.40+p)*.08+Math.sin(t*.30+p*1.7)*.10+mx*.04;
      pos[i*3+1]=by+Math.cos(t*.55*s+p)*.06+Math.sin(t*.20*s+p)*.07+my*.04;
      pos[i*3+2]=bz+Math.sin(t*.15+p*2.1)*.12;
    } else if (mode === 'exclusion') {
      const o=t*s*0.2+p, c=Math.sin(t*1.1+p*0.5)*0.3/d;
      pos[i*3]=bx*Math.cos(o*.01)-by*Math.sin(o*.01)*.5+c*bx+mx*.05;
      pos[i*3+1]=by*Math.cos(o*.01)+bx*Math.sin(o*.01)*.5+c*by+my*.05;
      pos[i*3+2]=bz+Math.sin(t*.4+p)*.2;
    }
  }
  particles.geometry.attributes.position.needsUpdate = true;
}

function driftCamera(t) {
  mouseX += (targetMX - mouseX) * 0.04; mouseY += (targetMY - mouseY) * 0.04;
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
