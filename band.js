// Metric band component.
// Usage: place a <div class="sr-metric-band" data-cols="2" data-margin="104"> in the page
// with a <script type="application/json"> child containing the metrics array:
// [{ prefix?, value, decimal?, suffix?, heading?, body? }, ...]
(function () {
  'use strict';

  var MF = "font:700 66px/0.95 'Saol Text',serif; letter-spacing:-.03em;";

  function fmt(metric, progress) {
    var v = (progress === undefined) ? metric.value : metric.value * progress;
    if (metric.decimal) return v.toFixed(1);
    return Math.round(v).toString();
  }

  function animate(el, metric) {
    var start = null, dur = 1400;
    (function step(ts) {
      if (start === null) start = ts;
      var p = Math.min((ts - start) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = fmt(metric, eased);
      if (p < 1) requestAnimationFrame(step);
      else el.textContent = fmt(metric);
    })(performance.now());
  }

  function renderBand(placeholder) {
    if (placeholder.dataset.bandInit) return;
    placeholder.dataset.bandInit = '1';

    var scriptEl = placeholder.querySelector('script[type="application/json"]');
    if (!scriptEl) return;
    var metrics = JSON.parse(scriptEl.textContent);
    var cols = parseInt(placeholder.getAttribute('data-cols') || '2', 10);
    var margin = parseInt(placeholder.getAttribute('data-margin') || '104', 10);

    var outer = document.createElement('div');
    outer.style.cssText = 'background:var(--band-bg); color:var(--band-ink); margin-top:' + margin + 'px; transition:background .35s ease;';

    var inner = document.createElement('div');
    inner.id = 'sr-band';
    inner.style.cssText = 'max-width:1120px; margin:0 auto; padding:0 48px;';

    var grid = document.createElement('div');
    grid.style.cssText = 'display:grid; grid-template-columns:repeat(' + cols + ',1fr); gap:1px; background:var(--band-line);';

    var countEls = [];

    metrics.forEach(function (m) {
      var cell = document.createElement('div');
      cell.style.cssText = 'background:var(--band-bg); padding:40px 40px 48px; transition:background .35s ease;';

      var lbl = document.createElement('div');
      lbl.style.cssText = "font:600 12px/1 'JetBrains Mono',monospace; letter-spacing:.1em; text-transform:uppercase; color:var(--band-muted); margin-bottom:24px;";
      lbl.textContent = '// impact';
      cell.appendChild(lbl);

      var row = document.createElement('div');
      row.style.cssText = 'display:flex; align-items:baseline;';

      if (m.prefix) {
        var pre = document.createElement('span');
        pre.style.cssText = MF;
        pre.textContent = m.prefix;
        row.appendChild(pre);
      }

      var num = document.createElement('span');
      num.style.cssText = MF;
      num.textContent = fmt(m);
      row.appendChild(num);

      if (m.suffix) {
        var suf = document.createElement('span');
        suf.style.cssText = MF + ' color:var(--band-accent);';
        suf.textContent = m.suffix;
        row.appendChild(suf);
      }

      cell.appendChild(row);

      if (m.heading) {
        var h = document.createElement('div');
        h.style.cssText = "font:600 15px 'Du Nord'; color:var(--band-ink); margin:18px 0 6px;";
        h.textContent = m.heading;
        cell.appendChild(h);
      }

      if (m.body) {
        var b = document.createElement('div');
        b.style.cssText = "font:400 15px/1.6 'Du Nord'; color:var(--band-ink-2); max-width:42ch;" + (m.heading ? '' : ' margin-top:16px;');
        b.textContent = m.body;
        cell.appendChild(b);
      }

      grid.appendChild(cell);
      countEls.push({ el: num, metric: m });
    });

    inner.appendChild(grid);
    outer.appendChild(inner);
    placeholder.replaceWith(outer);

    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            countEls.forEach(function (c) { animate(c.el, c.metric); });
          } else {
            countEls.forEach(function (c) { c.el.textContent = fmt(c.metric, 0); });
          }
        });
      }, { threshold: 0.4 });
      io.observe(outer);
    }
  }

  function initBands() {
    document.querySelectorAll('.sr-metric-band:not([data-band-init])').forEach(renderBand);
  }

  document.addEventListener('DOMContentLoaded', function () {
    initBands();
    // DC framework renders x-dc content after DOMContentLoaded — watch for placeholders added late
    var mo = new MutationObserver(initBands);
    mo.observe(document.body, { childList: true, subtree: true });
    setTimeout(function () { mo.disconnect(); }, 3000);
  });
})();
