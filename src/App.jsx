import { useEffect, useRef, useState } from 'react';
import ColorPicker from './components/ColorPicker.jsx';
import FontEditor from './components/FontEditor.jsx';
import ElementTree from './components/ElementTree.jsx';

export default function App() {
  const [url, setUrl] = useState('https://example.com');
  const [src, setSrc] = useState('');
  const [selected, setSelected] = useState(null);
  const [selKey, setSelKey] = useState(0); // remonta los editores al elegir otro elemento o restaurar
  const [tree, setTree] = useState([]);
  const [css, setCss] = useState('');
  const [copied, setCopied] = useState(false);
  const frame = useRef(null);

  const post = (msg) => frame.current?.contentWindow.postMessage({ target: 'style-inspector', ...msg }, '*');

  useEffect(() => {
    const onMsg = (e) => {
      const d = e.data;
      if (d?.source !== 'style-inspector') return;
      if (d.type === 'select') { setSelected(d.element); setSelKey((k) => k + 1); }
      if (d.type === 'updated') { setSelected(d.element); setCss(d.css); if (d.reset) setSelKey((k) => k + 1); }
      if (d.type === 'tree') setTree(d.tree);
    };
    window.addEventListener('message', onMsg);
    return () => window.removeEventListener('message', onMsg);
  }, []);

  const load = () => { setSelected(null); setTree([]); setCss(''); setSrc(`/proxy?url=${encodeURIComponent(url)}`); };
  const applyStyle = (styles) => post({ type: 'style', styles });
  const copy = async () => { await navigator.clipboard.writeText(css); setCopied(true); setTimeout(() => setCopied(false), 1500); };

  return (
    <div className="app">
      <header className="bar">
        <input value={url} onChange={(e) => setUrl(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && load()} />
        <button onClick={load}>Cargar</button>
      </header>
      <main className="main">
        <ElementTree tree={tree} selectedId={selected?.id} onSelect={(id) => post({ type: 'selectById', id })} onRefresh={() => post({ type: 'requestTree' })} />
        <iframe ref={frame} title="preview" src={src} />
        <aside className="panel">
          <h3>Elemento</h3>
          {!selected ? <p className="muted">Hacé click en la página o elegí un elemento de la estructura.</p> : (
            <>
              <p className="tagline">&lt;{selected.tag}&gt; <span className="muted">{selected.classes}</span></p>
              <p className="muted">{selected.text || '—'}</p>
              <ColorPicker key={'c' + selKey} initial={selected.styles} onChange={applyStyle} />
              <FontEditor key={'f' + selKey} styles={selected.styles} onChange={applyStyle} />
              <button className="ghost block" onClick={() => post({ type: 'reset' })}>Restaurar este elemento</button>
            </>
          )}
          <div className="css-out">
            <div className="tree-head"><h4>CSS de tus cambios</h4><button className="sm" disabled={!css} onClick={copy}>{copied ? '¡Copiado!' : 'Copiar'}</button></div>
            <pre>{css || '/* Todavía no editaste nada */'}</pre>
          </div>
        </aside>
      </main>
    </div>
  );
}
