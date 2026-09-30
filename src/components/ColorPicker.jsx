import { useRef, useState } from 'react';
import { clamp, hexToRgb, hsvToRgb, parseColor, rgbToHex, rgbToHsv } from '../color.js';

const TABS = [['color', 'Texto'], ['backgroundColor', 'Fondo']];

// Selector estilo Google Sheets. Aplica en vivo (onChange) y permite Cancelar.
export default function ColorPicker({ initial, onChange }) {
  const [tab, setTab] = useState('color');
  const [base, setBase] = useState(initial); // último valor aceptado (strings CSS)
  const [hsv, setHsv] = useState({
    color: rgbToHsv(parseColor(initial.color)),
    backgroundColor: rgbToHsv(parseColor(initial.backgroundColor)),
  });
  const [hexDraft, setHexDraft] = useState(null);
  const area = useRef(null);

  const cur = hsv[tab];
  const rgb = hsvToRgb(cur);
  const hex = rgbToHex(rgb);

  const commit = (next, key = tab) => {
    setHsv((p) => ({ ...p, [key]: next }));
    setHexDraft(null);
    onChange({ [key]: rgbToHex(hsvToRgb(next)) });
  };

  const pickArea = (e) => {
    const r = area.current.getBoundingClientRect();
    commit({ ...cur, s: clamp((e.clientX - r.left) / r.width, 0, 1), v: 1 - clamp((e.clientY - r.top) / r.height, 0, 1) });
  };
  const onDown = (e) => { e.currentTarget.setPointerCapture(e.pointerId); pickArea(e); };
  const onMove = (e) => e.buttons && pickArea(e);

  const setRgbChannel = (i, val) => {
    const n = clamp(parseInt(val, 10) || 0, 0, 255);
    const next = [...rgb]; next[i] = n;
    const t = rgbToHsv(next);
    commit({ h: t.s === 0 || t.v === 0 ? cur.h : t.h, s: t.s, v: t.v });
  };

  const onHex = (val) => {
    setHexDraft(val);
    const c = hexToRgb(val);
    if (c) { const t = rgbToHsv(c); commit({ h: t.s === 0 ? cur.h : t.h, s: t.s, v: t.v }); setHexDraft(val); }
  };

  const eyedrop = async () => {
    try {
      const { sRGBHex } = await new window.EyeDropper().open();
      const t = rgbToHsv(hexToRgb(sRGBHex));
      commit({ h: t.s === 0 ? cur.h : t.h, s: t.s, v: t.v });
    } catch { /* cancelado */ }
  };

  const accept = () => setBase({ color: rgbToHex(hsvToRgb(hsv.color)), backgroundColor: rgbToHex(hsvToRgb(hsv.backgroundColor)) });
  const cancel = () => {
    onChange(base);
    setHsv({ color: rgbToHsv(parseColor(base.color)), backgroundColor: rgbToHsv(parseColor(base.backgroundColor)) });
    setHexDraft(null);
  };

  return (
    <div className="cp">
      <div className="cp-tabs">
        {TABS.map(([k, label]) => (
          <button key={k} className={tab === k ? 'on' : ''} onClick={() => { setTab(k); setHexDraft(null); }}>{label}</button>
        ))}
      </div>

      <div
        ref={area} className="cp-area" onPointerDown={onDown} onPointerMove={onMove}
        style={{ background: `linear-gradient(to top,#000,transparent),linear-gradient(to right,#fff,hsl(${cur.h},100%,50%))` }}
      >
        <span className="cp-knob" style={{ left: `${cur.s * 100}%`, top: `${(1 - cur.v) * 100}%`, background: hex }} />
      </div>

      <div className="cp-row">
        <span className="cp-preview" style={{ background: hex }} />
        {'EyeDropper' in window && <button className="cp-eye" onClick={eyedrop} title="Cuentagotas">💧</button>}
        <input
          className="cp-hue" type="range" min="0" max="360" value={Math.round(cur.h)}
          onChange={(e) => commit({ ...cur, h: +e.target.value })}
        />
      </div>

      <div className="cp-fields">
        <label className="hex">Hexadecimal
          <input value={hexDraft ?? hex} onChange={(e) => onHex(e.target.value)} spellCheck={false} />
        </label>
        {['R', 'V', 'B'].map((l, i) => (
          <label key={l}>{l}
            <input type="number" min="0" max="255" value={rgb[i]} onChange={(e) => setRgbChannel(i, e.target.value)} />
          </label>
        ))}
      </div>

      <div className="cp-actions">
        <button className="ghost" onClick={cancel}>Cancelar</button>
        <button onClick={accept}>Aceptar</button>
      </div>
    </div>
  );
}
