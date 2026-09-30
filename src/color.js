export const clamp = (n, a, b) => Math.min(b, Math.max(a, n));

export function parseColor(str) {
  const m = /rgba?\(([^)]+)\)/.exec(str || '');
  if (!m) return [255, 255, 255];
  const [r, g, b, a = 1] = m[1].split(/[ ,/]+/).filter(Boolean).map(Number);
  if (a === 0) return [255, 255, 255]; // transparente → blanco como punto de partida
  return [r, g, b].map((v) => clamp(Math.round(v), 0, 255));
}

export function rgbToHsv([r, g, b]) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), d = max - Math.min(r, g, b);
  let h = 0;
  if (d) {
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h = (h * 60 + 360) % 360;
  }
  return { h, s: max ? d / max : 0, v: max };
}

export function hsvToRgb({ h, s, v }) {
  const f = (n) => {
    const k = (n + h / 60) % 6;
    return Math.round((v - v * s * Math.max(0, Math.min(k, 4 - k, 1))) * 255);
  };
  return [f(5), f(3), f(1)];
}

export const rgbToHex = (rgb) => '#' + rgb.map((n) => n.toString(16).padStart(2, '0')).join('');
export const hexToRgb = (hex) => {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return null;
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
