function Node({ n, depth, selectedId, onSelect }) {
  const label = (
    <button className={'tn' + (n.id === selectedId ? ' on' : '')} onClick={() => onSelect(n.id)}>
      <b>{n.tag}</b>
      {n.classes && <em>.{n.classes.trim().split(/\s+/)[0]}</em>}
      {n.text && <span>{n.text}</span>}
    </button>
  );
  if (!n.children.length) return <li className="leaf">{label}</li>;
  return (
    <li>
      <details open={depth < 2}>
        <summary>{label}</summary>
        <ul>{n.children.map((c) => <Node key={c.id} n={c} depth={depth + 1} selectedId={selectedId} onSelect={onSelect} />)}</ul>
      </details>
    </li>
  );
}

export default function ElementTree({ tree, selectedId, onSelect, onRefresh }) {
  return (
    <aside className="tree-wrap">
      <div className="tree-head"><h3>Estructura</h3><button className="ghost sm" onClick={onRefresh} title="Releer la página">↻</button></div>
      {!tree.length
        ? <p className="muted pad">Cargá una página para ver sus elementos.</p>
        : <ul className="tree">{tree.map((n) => <Node key={n.id} n={n} depth={0} selectedId={selectedId} onSelect={onSelect} />)}</ul>}
    </aside>
  );
}
