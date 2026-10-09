/** Small colour toolkit: mixing, luminance and a human-friendly colour family classifier. */

interface Rgb {
  r: number;
  g: number;
  b: number;
}

export function hexToRgb(hex: string): Rgb {
  let value = hex.replace('#', '');
  if (value.length === 3) value = value.replace(/./g, '$&$&');
  const n = parseInt(value, 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

const channel = (value: number): string =>
  Math.round(Math.min(255, Math.max(0, value)))
    .toString(16)
    .padStart(2, '0');

export const rgbToHex = ({ r, g, b }: Rgb): string => `#${channel(r)}${channel(g)}${channel(b)}`;

export function mix(a: string, b: string, t: number): string {
  const x = hexToRgb(a);
  const y = hexToRgb(b);
  return rgbToHex({ r: x.r + (y.r - x.r) * t, g: x.g + (y.g - x.g) * t, b: x.b + (y.b - x.b) * t });
}

export const lighten = (hex: string, t: number): string => mix(hex, '#ffffff', t);
export const darken = (hex: string, t: number): string => mix(hex, '#000000', t);

/** Perceived brightness 0..1. */
export function luminance(hex: string): number {
  const { r, g, b } = hexToRgb(hex);
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
}

function hsl(hex: string): { h: number; s: number; l: number } {
  const { r, g, b } = hexToRgb(hex);
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  const d = max - min;
  if (d === 0) return { h: 0, s: 0, l };
  const s = d / (1 - Math.abs(2 * l - 1));
  let h: number;
  if (max === rn) h = ((gn - bn) / d) % 6;
  else if (max === gn) h = (bn - rn) / d + 2;
  else h = (rn - gn) / d + 4;
  return { h: (h * 60 + 360) % 360, s, l };
}

export const COLOR_FAMILIES = [
  'Black',
  'White',
  'Grey',
  'Brown',
  'Tan',
  'Blue',
  'Green',
  'Red',
  'Orange',
  'Yellow',
  'Pink',
  'Purple',
] as const;
export type ColorFamily = (typeof COLOR_FAMILIES)[number];

/** A representative swatch for each family (used by the colour filter). */
export const FAMILY_SWATCH: Record<ColorFamily, string> = {
  Black: '#1b1b1d',
  White: '#f4f2ec',
  Grey: '#8d9094',
  Brown: '#6b4a2a',
  Tan: '#c8a97a',
  Blue: '#2a4f86',
  Green: '#3f6b49',
  Red: '#b3262e',
  Orange: '#e0642a',
  Yellow: '#e2b93b',
  Pink: '#d9899f',
  Purple: '#5d4a8a',
};

export function colorFamily(hex: string): ColorFamily {
  const { h, s, l } = hsl(hex);
  if (l < 0.13) return 'Black';
  if (l > 0.9) return 'White';
  if (s < 0.1) return l > 0.82 ? 'White' : 'Grey';
  if (h >= 15 && h < 50) {
    if (s >= 0.6 && l >= 0.4) return h < 35 ? 'Orange' : 'Yellow';
    return l > 0.58 ? 'Tan' : 'Brown';
  }
  if (h >= 50 && h < 70) return s > 0.5 && l > 0.45 ? 'Yellow' : 'Green';
  if (h >= 70 && h < 170) return 'Green';
  if (h >= 170 && h < 260) return 'Blue';
  if (h >= 260 && h < 300) return 'Purple';
  if (h >= 300 && h < 345) return l < 0.4 ? 'Red' : 'Pink';
  return 'Red';
}
