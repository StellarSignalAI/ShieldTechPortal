/* Universal mobile table → card transformer (verbatim from "ShieldTech Mobile.html") */
(function () {
  function mobilizeTables(root) {
    (root || document).querySelectorAll('.m-screen table:not([data-mob])').forEach(function (t) {
      t.setAttribute('data-mob', '1');
      var ths = [].map.call(t.querySelectorAll('thead th, thead td'), function (th) { return th.textContent.trim(); });
      if (!ths.length) return; // no header row → leave as horizontally scrollable
      var rows = [].slice.call(t.querySelectorAll('tbody tr'));
      if (!rows.length) rows = [].slice.call(t.querySelectorAll('tr')).filter(function (r) { return !r.querySelector('th'); });
      if (!rows.length) return;
      var complex = false;
      rows.forEach(function (tr) {
        var tds = [].slice.call(tr.children);
        tds.forEach(function (td, i) {
          if (td.colSpan > 1) complex = true;
          td.setAttribute('data-label', ths[i] || '');
          if (i === 0) td.classList.add('m-cards-title');
        });
      });
      if (!complex) t.classList.add('m-cards');
    });
  }
  /* Stack desktop master-detail / two-pane flex layouts into a single column. */
  function stackPanes(root) {
    var area = (root || document).querySelector('.m-screen[data-desk="true"]');
    if (!area) return;
    var cw = area.clientWidth;
    [].forEach.call(area.querySelectorAll('*:not([data-stacked])'), function (el) {
      var cs = getComputedStyle(el);
      if (cs.display !== 'flex' || cs.flexDirection !== 'row') return;
      if (el.clientWidth < cw * 0.7) return;                 // must be a top-level layout row
      if (el.offsetHeight < 260) return;                     // tall = real content panes, not a toolbar
      var kids = [].filter.call(el.children, function (c) { return c.offsetHeight > 150; });
      if (kids.length < 2) return;                           // need >=2 tall panes side by side
      el.setAttribute('data-stacked', '1');
      el.style.flexDirection = 'column';
      el.style.alignItems = 'stretch';
      [].forEach.call(el.children, function (c) { c.style.maxWidth = '100%'; c.style.width = 'auto'; });
    });
  }
  var pending = null;
  function schedule() { if (pending) return; pending = requestAnimationFrame(function () { pending = null; mobilizeTables(); stackPanes(); }); }
  var obs = new MutationObserver(schedule);
  function start() {
    if (!document.body) return setTimeout(start, 50);
    obs.observe(document.body, { childList: true, subtree: true });
    mobilizeTables(); stackPanes();
  }
  start();
})();
