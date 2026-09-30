import { useState } from 'react';

const FAMILIES = [
  ['Arial', 'Arial, Helvetica, sans-serif'], ['Verdana', 'Verdana, Geneva, sans-serif'],
  ['Tahoma', 'Tahoma, sans-serif'], ['Trebuchet MS', '"Trebuchet MS", sans-serif'],
  ['Georgia', 'Georgia, serif'], ['Times New Roman', '"Times New Roman", Times, serif'],
  ['Courier New', '"Courier New", monospace'], ['System UI', 'system-ui, sans-serif'],
  ['Monospace', 'ui-monospace, Menlo, Consolas, monospace'],
];
const WEIGHTS = [[100, 'Thin'], [200, 'Extra light'], [300, 'Light'], [400, 'Normal'], [500, 'Medium'], [600, 'Semi-bold'], [700, 'Bold'], [800, 'Extra bold'], [900, 'Black']];

// Se remonta (key) al elegir otro elemento, así que alcanza con estado local.
export default function FontEditor({ styles, onChange }) {
  const first = styles.fontFamily.split(',')[0].replace(/["']/g, '').trim();
  const match = FAMILIES.find(([n]) => n.toLowerCase() === first.toLowerCase());
  const [family, setFamily] = useState(match ? match[1] : '');
  const [size, setSize] = useState(String(parseFloat(styles.fontSize) || 16));
  const [weight, setWeight] = useState(String(parseInt(styles.fontWeight, 10) || 400));

  const changeSize = (v) => { setSize(v); const n = parseFloat(v); if (n >= 1 && n <= 400) onChange({ fontSize: n + 'px' }); };

  return (
    <div className="fe">
      <h4>Fuente</h4>
      <label>Familia
        <select value={family} onChange={(e) => { setFamily(e.target.value); e.target.value && onChange({ fontFamily: e.target.value }); }}>
          {!match && <option value="">{first} (actual)</option>}
          {FAMILIES.map(([n, v]) => <option key={n} value={v}>{n}</option>)}
        </select>
      </label>
      <label>Tamaño (px)
        <div className="fe-size">
          <input type="range" min="8" max="96" value={Math.min(96, Math.max(8, parseFloat(size) || 16))} onChange={(e) => changeSize(e.target.value)} />
          <input type="number" min="1" max="400" value={size} onChange={(e) => changeSize(e.target.value)} />
        </div>
      </label>
      <label>Peso
        <select value={weight} onChange={(e) => { setWeight(e.target.value); onChange({ fontWeight: e.target.value }); }}>
          {WEIGHTS.map(([w, n]) => <option key={w} value={w}>{w} · {n}</option>)}
        </select>
      </label>
    </div>
  );
}
