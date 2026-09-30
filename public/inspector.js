// Se inyecta en la página objetivo. Sirve también suelto en tus proyectos:
// <script src="/inspector.js"></script>  (solo dentro de un iframe del editor)
(() => {
  if (window.__styleInspector) return;
  window.__styleInspector = true;

  const TAGS = new Set(['DIV','SPAN','P','H1','H2','H3','H4','H5','H6','A','LI','UL','OL','TABLE','TR','TD','TH','BUTTON','SECTION','HEADER','FOOTER','NAV','MAIN','ARTICLE','LABEL']);
  const SKIP = new Set(['SCRIPT','STYLE','NOSCRIPT','LINK','META']);
  const parent = window.parent !== window ? window.parent : null;
  const send = (msg) => parent && parent.postMessage({ source: 'style-inspector', ...msg }, '*');

  let hoverEl = null, selected = null, counter = 0;
  const ids = new WeakMap(), byId = new Map();   // sin tocar el DOM de la página
  const edits = new Map(), orig = new WeakMap();  // cambios hechos y estilo original
  const idOf = (el) => {
    if (!ids.has(el)) { const id = 'si-' + (++counter); ids.set(el, id); byId.set(id, el); }
    return ids.get(el);
  };

  const box = document.createElement('div');
  box.style.cssText = 'position:fixed;pointer-events:none;z-index:2147483647;border:2px solid #11734b;background:rgba(17,115,75,.12);display:none';
  document.documentElement.appendChild(box);
  const place = (el) => {
    if (!el) { box.style.display = 'none'; return; }
    const r = el.getBoundingClientRect();
    Object.assign(box.style, { display: 'block', top: r.top + 'px', left: r.left + 'px', width: r.width + 'px', height: r.height + 'px' });
  };

  const selectorOf = (el) => {
    const parts = [];
    for (let e = el; e && e.nodeType === 1 && e !== document.documentElement; e = e.parentElement) {
      let s = e.tagName.toLowerCase();
      if (e.id && /^[\w-]+$/.test(e.id)) { parts.unshift(s + '#' + e.id); break; }
      const cls = (typeof e.className === 'string' ? e.className : '').split(/\s+/).filter((c) => /^[\w-]+$/.test(c)).slice(0, 2);
      if (cls.length) s += '.' + cls.join('.');
      const sibs = e.parentElement ? [...e.parentElement.children].filter((x) => x.tagName === e.tagName) : [];
      if (sibs.length > 1) s += `:nth-of-type(${sibs.indexOf(e) + 1})`;
      parts.unshift(s);
    }
    return parts.join(' > ');
  };

  const read = (el) => {
    const cs = getComputedStyle(el);
    const own = [...el.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent.trim()).join(' ').slice(0, 80);
    return {
      id: idOf(el), tag: el.tagName.toLowerCase(),
      classes: typeof el.className === 'string' ? el.className : '', text: own,
      styles: { color: cs.color, backgroundColor: cs.backgroundColor, fontFamily: cs.fontFamily, fontSize: cs.fontSize, fontWeight: cs.fontWeight },
    };
  };

  const exportCss = () => [...edits].map(([el, p]) =>
    `${selectorOf(el)} {\n${Object.entries(p).map(([k, v]) => `  ${k.replace(/[A-Z]/g, (m) => '-' + m.toLowerCase())}: ${v};`).join('\n')}\n}`).join('\n\n');

  // Árbol de elementos (aplana los que no son de interés)
  const buildTree = () => {
    let count = 0;
    const walk = (el, depth) => {
      const out = [];
      for (const c of el.children) {
        if (c === box || SKIP.has(c.tagName) || count > 400) continue;
        if (TAGS.has(c.tagName)) {
          count++;
          const r = read(c);
          out.push({ id: r.id, tag: r.tag, classes: r.classes, text: r.text.slice(0, 30), children: depth < 9 ? walk(c, depth + 1) : [] });
        } else out.push(...walk(c, depth));
      }
      return out;
    };
    return walk(document.body, 0);
  };

  const choose = (el, scroll) => {
    selected = el;
    if (scroll) el.scrollIntoView?.({ block: 'center', behavior: 'smooth' });
    place(el);
    send({ type: 'select', element: read(el) });
  };

  document.addEventListener('mousemove', (e) => {
    const el = e.target;
    if (el === box || !TAGS.has(el.tagName)) return;
    hoverEl = el; place(el);
  }, true);
  document.addEventListener('click', (e) => {
    if (!hoverEl) return;
    e.preventDefault(); e.stopPropagation();
    choose(hoverEl, false);
  }, true);
  window.addEventListener('scroll', () => place(selected || hoverEl), true);

  const echo = (extra) => send({ type: 'updated', element: read(selected), css: exportCss(), ...extra });

  window.addEventListener('message', (e) => {
    const d = e.data;
    if (!d || d.target !== 'style-inspector') return;
    if (d.type === 'requestTree') return send({ type: 'tree', tree: buildTree() });
    if (d.type === 'selectById') { const el = byId.get(d.id); return el && choose(el, true); }
    if (!selected) return;
    if (d.type === 'style') {
      if (!orig.has(selected)) orig.set(selected, selected.getAttribute('style'));
      Object.assign(selected.style, d.styles);
      edits.set(selected, { ...(edits.get(selected) || {}), ...d.styles });
      place(selected); echo();
    }
    if (d.type === 'reset') {
      const o = orig.get(selected);
      if (o === null || o === undefined) selected.removeAttribute('style'); else selected.setAttribute('style', o);
      edits.delete(selected); orig.delete(selected);
      place(selected); echo({ reset: true });
    }
  });

  const announce = () => send({ type: 'tree', tree: buildTree() });
  document.readyState === 'complete' ? announce() : window.addEventListener('load', announce);
})();
