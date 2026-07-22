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

    // Each metric is its own card that blends into the page — the theme's own surface and
    // line colours (dark-on-dark, light-on-light), separated by a gap, inside the 1120px
    // content column. No inverse block, nothing that stands out from the page.
    var outer = document.createElement('div');
    outer.id = 'sr-band';
    outer.style.cssText = 'max-width:1120px; margin:' + margin + 'px auto 0; padding:0 24px;';

    // Editorial, no box: one grey "// impact" eyebrow, then each stat is a big serif
    // number under a thin top rule with its description below — sitting on the page like
    // the rest of the content, not a filled card.
    var label = document.createElement('div');
    label.style.cssText = "font:600 12px/1 'JetBrains Mono',monospace; letter-spacing:.1em; text-transform:uppercase; color:var(--muted); margin-bottom:28px;";
    label.textContent = '// impact';
    outer.appendChild(label);

    var grid = document.createElement('div');
    grid.style.cssText = 'display:grid; grid-template-columns:repeat(' + cols + ',1fr); gap:44px;';

    var countEls = [];

    metrics.forEach(function (m) {
      var cell = document.createElement('div');
      cell.style.cssText = 'color:var(--ink); border-top:1px solid var(--line); padding:26px 0 0; transition:border-color .35s ease;';

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
        suf.style.cssText = MF + ' color:var(--accent);';
        suf.textContent = m.suffix;
        row.appendChild(suf);
      }

      cell.appendChild(row);

      if (m.heading) {
        var h = document.createElement('div');
        h.style.cssText = "font:600 15px 'Du Nord'; color:var(--ink); margin:20px 0 8px;";
        h.textContent = m.heading;
        cell.appendChild(h);
      }

      if (m.body) {
        var b = document.createElement('div');
        b.style.cssText = "font:400 15px/1.6 'Du Nord'; color:var(--ink-3); max-width:40ch;" + (m.heading ? '' : ' margin-top:16px;');
        b.textContent = m.body;
        cell.appendChild(b);
      }

      grid.appendChild(cell);
      countEls.push({ el: num, metric: m });
    });

    outer.appendChild(grid);
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
