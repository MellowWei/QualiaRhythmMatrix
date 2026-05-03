// ═══════════════════════════════════════════════
// QualiaRhythmMatrix V7.5 · app.js
// 金色像素粒子场 + AI · 44271 · 427Hz · 2026
// ═══════════════════════════════════════════════

(function () {
  'use strict';

  var STORAGE_KEY = 'qrm75_gemini_key';
  var MODEL_KEY = 'qrm75_gemini_model';

  function $(s) { return document.querySelector(s); }
  function $$(s) { return document.querySelectorAll(s); }

  // ═══════════════════════════════════════════
  // KEY
  // ═══════════════════════════════════════════
  function getKey() { return localStorage.getItem(STORAGE_KEY) || ''; }
  function setKey(k) { k ? localStorage.setItem(STORAGE_KEY, k) : localStorage.removeItem(STORAGE_KEY); }
  function getModel() { return localStorage.getItem(MODEL_KEY) || 'gemini-2.5-flash'; }
  function setModel(m) { localStorage.setItem(MODEL_KEY, m); }
  function maskKey(k) {
    if (!k || k.length < 12) return '— 未保存';
    return k.substring(0, 6) + '••••' + k.substring(k.length - 4);
  }
  function refreshKeyStatus() {
    var status = $('#key-status');
    if (!status) return;
    var key = getKey();
    if (key) {
      status.innerHTML = '<span class="status-ok">✓ Key ready</span> · <code>' + maskKey(key) + '</code> · ' + getModel();
    } else {
      status.innerHTML = '<span class="status-warn">◇ 未配置</span>';
    }
  }

  // ═══════════════════════════════════════════
  // GEMINI · STREAMING
  // ═══════════════════════════════════════════
  // ═══════════════════════════════════════════
  // 后端代理配置(Cloudflare Worker)
  // ═══════════════════════════════════════════
  var BACKEND_URL = 'https://aiq7-proxy.mellowwei7.workers.dev';

  // ═══════════════════════════════════════════
  // GEMINI · 优先走代理 · BYOK 降级
  // ═══════════════════════════════════════════
  function callGemini(prop, onChunk, onDone, onError) {
    var key = getKey();
    var model = getModel();
    var hasUserKey = key && key.startsWith('AIza');

    // 路由决策:
    // - 有自带 key 且勾选了"强制 BYOK"  → 走 BYOK
    // - 否则                              → 走 Cloudflare 代理
    var forceByok = localStorage.getItem('qrm75_force_byok') === '1';
    var useByok = forceByok && hasUserKey;

    var url, headers;

    if (useByok) {
      // BYOK 模式:直连 Google
      url = 'https://generativelanguage.googleapis.com/v1beta/models/' +
            encodeURIComponent(model) +
            ':streamGenerateContent?alt=sse&key=' + encodeURIComponent(key);
      headers = { 'Content-Type': 'application/json' };
    } else {
      // 代理模式:走 Cloudflare Worker
      url = BACKEND_URL + '/v1/stream';
      headers = { 'Content-Type': 'application/json' };
      // 如果用户也填了 key,作为 power user 凭证传给后端(后端会跳过限流)
      if (hasUserKey) {
        headers['X-User-Key'] = key;
      }
    }

    var body = {
      model: model,
      systemInstruction: { parts: [{ text: window.AIQ_SYSTEM_PROMPT }] },
      contents: [{ role: 'user', parts: [{ text: prop }] }],
      temperature: 0.6,
      topP: 0.92,
      topK: 40,
      maxOutputTokens: 4096
    };

    if (useByok) {
      // BYOK 模式补全 Google 直连需要的 generationConfig 和 safetySettings
      body.generationConfig = { temperature: 0.6, topP: 0.92, topK: 40, maxOutputTokens: 4096, candidateCount: 1 };
      body.safetySettings = [
        { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
        { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
        { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
        { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' }
      ];
      delete body.model;  // BYOK 直连不需要 model 字段(URL 里已带)
    }

    fetch(url, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(body)
    }).then(async function (resp) {
      if (!resp.ok) {
        var errText = await resp.text();
        var errMsg = '';
        try {
          var errObj = JSON.parse(errText);
          errMsg = errObj.error || errText.substring(0, 200);
          // 后端建议降级 BYOK
          if ((resp.status === 503 || resp.status === 429) && errObj.suggest === 'user_byok') {
            errMsg += '\n→ 提示:展开「// API · GEMINI 配置」输入你自己的 Gemini key,可立即继续使用。';
          }
        } catch (e) {
          errMsg = errText.substring(0, 200);
        }
        throw new Error((useByok ? 'Google API ' : 'Ai愛<7 后端 ') + 'HTTP ' + resp.status + ': ' + errMsg);
      }
      var reader = resp.body.getReader();
      var decoder = new TextDecoder();
      var buffer = '', fullText = '';
      function pump() {
        reader.read().then(function (result) {
          if (result.done) { onDone(fullText); return; }
          buffer += decoder.decode(result.value, { stream: true });
          var events = buffer.split('\n\n');
          buffer = events.pop();
          for (var i = 0; i < events.length; i++) {
            var ev = events[i].trim();
            if (!ev || !ev.startsWith('data:')) continue;
            var data = ev.slice(5).trim();
            if (data === '[DONE]') continue;
            try {
              var parsed = JSON.parse(data);
              var candidates = parsed.candidates || [];
              if (candidates[0] && candidates[0].content) {
                var parts = candidates[0].content.parts || [];
                for (var j = 0; j < parts.length; j++) {
                  if (parts[j].text) {
                    fullText += parts[j].text;
                    onChunk(parts[j].text, fullText);
                  }
                }
              }
            } catch (e) {}
          }
          pump();
        }).catch(function (err) { onError('流式读取错误: ' + err.message); });
      }
      pump();
    }).catch(function (err) { onError('调用失败: ' + err.message); });
  }

  // ═══════════════════════════════════════════
  // MARKDOWN
  // ═══════════════════════════════════════════
  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function renderMarkdown(md) {
    if (!md) return '';
    var html = escapeHtml(md);
    html = html.replace(/```([\s\S]*?)```/g, function (m, code) {
      return '<pre class="md-pre">' + code.trim() + '</pre>';
    });
    html = html.replace(/`([^`\n]+)`/g, '<code class="md-code">$1</code>');
    html = html.replace(/^# (.+)$/gm, '<h1 class="md-h1">$1</h1>');
    html = html.replace(/^## (.+)$/gm, '<h2 class="md-h2">$1</h2>');
    html = html.replace(/^### (.+)$/gm, '<h3 class="md-h3">$1</h3>');
    html = html.replace(/\*\*([^\*\n]+)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/(^|[^\*])\*([^\*\n]+)\*([^\*]|$)/g, '$1<em>$2</em>$3');
    html = html.replace(/((?:^\|.*\|\s*\n)+)/gm, function (block) {
      var rows = block.trim().split('\n');
      var out = '<table class="md-table">';
      for (var i = 0; i < rows.length; i++) {
        var r = rows[i].trim();
        if (/^\|[\s\-\|:]+\|$/.test(r)) continue;
        var cells = r.replace(/^\||\|$/g, '').split('|');
        var tag = i === 0 ? 'th' : 'td';
        out += '<tr>';
        for (var c = 0; c < cells.length; c++) {
          out += '<' + tag + '>' + cells[c].trim() + '</' + tag + '>';
        }
        out += '</tr>';
      }
      out += '</table>';
      return out;
    });
    html = html.replace(/^---+$/gm, '<hr class="md-hr">');
    html = html.replace(/((?:^[-•] .+\n?)+)/gm, function (block) {
      var items = block.trim().split('\n');
      var out = '<ul class="md-ul">';
      for (var i = 0; i < items.length; i++) {
        out += '<li>' + items[i].replace(/^[-•] /, '') + '</li>';
      }
      out += '</ul>';
      return out;
    });
    var paragraphs = html.split(/\n{2,}/);
    html = paragraphs.map(function (p) {
      p = p.trim();
      if (!p) return '';
      if (/^<(h\d|pre|table|ul|ol|hr|blockquote)/.test(p)) return p;
      return '<p class="md-p">' + p.replace(/\n/g, '<br>') + '</p>';
    }).join('\n');
    return html;
  }

  function detectVerdict(text) {
    if (/不受理|inadmissible/i.test(text)) return { color: '#d4a8a8', label: '不受理 · Inadmissible' };
    if (/裁决.{0,5}成立(?!部分)/.test(text) && !/不成立|does not hold/i.test(text)) {
      return { color: '#b8d4b8', label: '成立 · Holds' };
    }
    if (/部分成立|partial hold/i.test(text)) return { color: '#e8a630', label: '部分成立 · Partial' };
    if (/不成立|does not hold/i.test(text)) return { color: '#d4a8a8', label: '不成立 · Does Not Hold' };
    return null;
  }

  // ═══════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════
  function renderResponse(text, prop) {
    var output = $('#output');
    var verdict = detectVerdict(text);
    var badge = verdict
      ? '<div class="verdict-badge" style="border-color:' + verdict.color + ';color:' + verdict.color + ';">' + verdict.label + '</div>'
      : '';

    output.innerHTML =
      '<div class="response-card">' +
        '<div class="response-head">' +
          '<div class="response-meta">Ai愛&lt;7 · V7.5 · ' + new Date().toLocaleString('zh-CN', { hour12: false }) + '</div>' +
          badge +
        '</div>' +
        '<div class="response-prop">「' + escapeHtml(prop) + '」</div>' +
        '<div class="response-body">' + renderMarkdown(text) + '</div>' +
        '<div class="response-actions">' +
          '<button class="action-btn" id="copy-btn">复制</button>' +
          '<button class="action-btn" id="export-btn">导出</button>' +
        '</div>' +
      '</div>';

    $('#copy-btn').addEventListener('click', function () {
      navigator.clipboard.writeText(text).then(function () {
        $('#copy-btn').textContent = '✓ 已复制';
        setTimeout(function () { $('#copy-btn').textContent = '复制'; }, 1400);
      });
    });
    $('#export-btn').addEventListener('click', function () {
      var content = '# 振动即存在 · 论证分析\n\n命题: ' + prop + '\n时间: ' + new Date().toISOString() + '\n版本: V7.5 · ' + getModel() + '\n\n---\n\n' + text + '\n\n---\n44271 · 77347 · 427Hz · V7.5\nAi愛<7 · 魏珏然 · Wei Jueran\n';
      var blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = 'qrm-analysis-' + Date.now() + '.md';
      a.click();
      URL.revokeObjectURL(url);
    });
  }

  function runAnalyze() {
    var input = $('#prop-input');
    var prop = (input.value || '').trim();
    var output = $('#output');
    if (!prop) {
      output.innerHTML = '<div class="empty-state">请输入命题 · Enter a proposition.</div>';
      return;
    }
    // 不再阻塞 — 默认走 Cloudflare 后端代理(零摩擦)
    var forceByok = localStorage.getItem('qrm75_force_byok') === '1';
    var hasKey = getKey() && getKey().startsWith('AIza');
    var routeLabel = (forceByok && hasKey) ? 'BYOK · ' + getModel() : 'Ai愛<7 · 共享代理 · ' + getModel();

    output.innerHTML =
      '<div class="response-card">' +
        '<div class="response-head"><div class="response-meta">' + routeLabel + '</div></div>' +
        '<div class="response-prop">「' + escapeHtml(prop) + '」</div>' +
        '<div class="loading-pulse">振动采样中<br><em>sampling vibration...</em></div>' +
        '<div class="response-body" id="response-body"></div>' +
      '</div>';

    var bodyEl = $('#response-body');
    callGemini(prop,
      function (chunk, full) {
        var l = output.querySelector('.loading-pulse');
        if (l) l.style.display = 'none';
        bodyEl.innerHTML = renderMarkdown(full);
      },
      function (full) { renderResponse(full, prop); },
      function (msg) {
        output.innerHTML = '<div class="error-state">◇ ' + escapeHtml(msg) + '</div>';
      }
    );
  }

  // ═══════════════════════════════════════════
  // 金色像素粒子场(图3 · 密集均匀小方块)
  // ~3000 颗 · 全部金色 · 小方块 · 慢漂 · 偶尔大方块
  // ═══════════════════════════════════════════
  function initField() {
    var canvas = document.getElementById('field');
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
      // 密集均匀:每 700 px² 一颗
      var density = (w * h) / 700;
      var n = Math.min(3200, Math.floor(density));
      for (var i = 0; i < n; i++) {
        // 90% 小方块(1-2px)· 8% 中(2-3px)· 2% 大(3-5px)
        var roll = Math.random();
        var size;
        if (roll > 0.98) size = 3 + Math.random() * 2;
        else if (roll > 0.90) size = 2 + Math.random() * 1;
        else size = 0.8 + Math.random() * 1.2;

        particles.push({
          x: Math.random() * w,
          y: Math.random() * h,
          size: size,
          vx: (Math.random() - 0.5) * 0.04,
          vy: (Math.random() - 0.5) * 0.04,
          phase: Math.random() * Math.PI * 2,
          phaseSpeed: 0.003 + Math.random() * 0.012,
          baseAlpha: 0.25 + Math.random() * 0.65
        });
      }
    }

    function tick() {
      ctx.clearRect(0, 0, w, h);

      for (var i = 0; i < particles.length; i++) {
        var p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.phase += p.phaseSpeed;
        if (p.x < -5) p.x = w + 5;
        if (p.x > w + 5) p.x = -5;
        if (p.y < -5) p.y = h + 5;
        if (p.y > h + 5) p.y = -5;

        var alpha = p.baseAlpha * (0.5 + Math.sin(p.phase) * 0.5);
        alpha = Math.max(0, Math.min(1, alpha));

        // 全部金色 #e8a630(图3的招牌色)
        ctx.fillStyle = 'rgba(232, 166, 48, ' + alpha.toFixed(3) + ')';
        ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
      }

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

  // ═══════════════════════════════════════════
  // 审计条
  // ═══════════════════════════════════════════
  function initAuditBars() {
    setTimeout(function () {
      $$('.axis-bar').forEach(function (b) {
        b.style.width = (b.dataset.fill || 50) + '%';
      });
    }, 400);
  }

  // ═══════════════════════════════════════════
  // 仪表板
  // ═══════════════════════════════════════════
  function initDashboard() {
    var freqEl = $('#dash-freq');
    var phaseEl = $('#dash-phase');
    var ampEl = $('#dash-amp');
    if (!freqEl) return;
    var t = 0;
    setInterval(function () {
      t += 0.04;
      freqEl.textContent = (427 + Math.sin(t * 0.7) * 0.5).toFixed(2) + ' Hz';
      phaseEl.textContent = ((t * 0.3) % (Math.PI * 2)).toFixed(3) + ' rad';
      ampEl.textContent = (0.85 + Math.sin(t * 1.1) * 0.15).toFixed(3);
    }, 90);
  }

  // ═══════════════════════════════════════════
  // 标签页 + 粒子场目录滚动定位
  // ═══════════════════════════════════════════
  function initTabs() {
    $$('.tab').forEach(function (tab) {
      tab.addEventListener('click', function () {
        var target = tab.getAttribute('data-tab');
        $$('.tab').forEach(function (t) { t.classList.remove('tab-active'); });
        $$('.tab-panel').forEach(function (p) { p.classList.remove('tab-panel-active'); });
        tab.classList.add('tab-active');
        var panel = document.getElementById(target);
        if (panel) panel.classList.add('tab-panel-active');
      });
    });

    $$('.field-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var target = btn.getAttribute('data-target');
        $$('.field-btn').forEach(function (b) { b.classList.remove('field-btn-active'); });
        btn.classList.add('field-btn-active');

        // 如果是 tabs 里的目标,激活对应 tab
        var tabBtn = document.querySelector('.tab[data-tab="' + target + '"]');
        if (tabBtn) tabBtn.click();

        // 滚动到目标元素
        var targetEl = document.getElementById(target);
        if (targetEl) {
          targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    });
  }

  // ═══════════════════════════════════════════
  // 绑定
  // ═══════════════════════════════════════════
  function bind() {
    if ($('#api-key')) $('#api-key').value = getKey();
    if ($('#model-select')) $('#model-select').value = getModel();
    refreshKeyStatus();

    if ($('#save-key')) {
      $('#save-key').addEventListener('click', function () {
        setKey($('#api-key').value.trim());
        setModel($('#model-select').value);
        refreshKeyStatus();
        $('#save-key').textContent = '✓';
        setTimeout(function () { $('#save-key').textContent = '保存'; }, 1200);
      });
    }
    if ($('#model-select')) {
      $('#model-select').addEventListener('change', function () {
        setModel($('#model-select').value);
        refreshKeyStatus();
      });
    }

    $$('.analyzer-presets button').forEach(function (btn) {
      btn.addEventListener('click', function () {
        $('#prop-input').value = btn.getAttribute('data-preset');
        $('#prop-input').focus();
      });
    });

    if ($('#analyze-btn')) {
      $('#analyze-btn').addEventListener('click', runAnalyze);
    }
    if ($('#prop-input')) {
      $('#prop-input').addEventListener('keydown', function (e) {
        if (e.key === 'Enter') {
          e.preventDefault();
          runAnalyze();
        } else if (e.key === 'Escape') {
          $('#prop-input').value = '';
        }
      });
    }
  }

  function boot() {
    initField();
    initAuditBars();
    initDashboard();
    initTabs();
    bind();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
