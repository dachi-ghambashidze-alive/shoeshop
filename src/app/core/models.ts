/** Shared domain types and constants. Pure data, no Angular imports. */

export const CATEGORIES = [
  'Sport / Runner',
  'Trail & Hike',
  'Heavy Duty',
  'Classic',
  'Leather',
  'Everyday',
  'Fancy',
  'Sandals & Slides',
] as const;
export type Category = (typeof CATEGORIES)[number];

export type Silhouette =
  | 'runner'
  | 'court'
  | 'hightop'
  | 'boot'
  | 'chelsea'
  | 'derby'
  | 'loafer'
  | 'pump'
  | 'sandal';

export const BADGES = ['Bestseller', 'New Drop', 'Staff Pick', 'Limited', 'Sale', 'Eco-Crafted'] as const;
export type Badge = (typeof BADGES)[number];

export interface Colorway {
  name: string;
  hex: string;
}

export interface Specs {
  upper: string;
  outsole: string;
  weight: string;
  drop: string;
}

export interface Product {
  id: number;
  name: string;
  cat: Category;
  sil: Silhouette;
  /** 0 = default look, 1 = alternate look (trail runner, hiker boot, strap sandal, brogue ...) */
  variant: 0 | 1;
  price: number;
  /** Original price when the product is on sale. */
  was?: number;
  badge?: Badge;
  rating: number;
  reviews: number;
  desc: string;
  specs: Specs;
  colorways: Colorway[];
  /** Colour families derived from the colorways, used by the colour filter. */
  families: string[];
  /** Searchable keywords derived from the copy (waterproof, steel toe ...). */
  tags: string[];
  /** Optional real photo (URL or data URI) uploaded by an admin; overrides the generated artwork. */
  img?: string;
}

export type WidthId = 'D' | 'EE' | '4E';
export type InsoleId = 'cloud' | 'orthotic' | 'merino';

export const WIDTHS: ReadonlyArray<{ id: WidthId; label: string }> = [
  { id: 'D', label: 'Standard (D)' },
  { id: 'EE', label: 'Wide (EE)' },
  { id: '4E', label: 'Extra wide (4E)' },
];

export const INSOLES: ReadonlyArray<{ id: InsoleId; label: string; price: number }> = [
  { id: 'cloud', label: 'Performance Cloud', price: 0 },
  { id: 'orthotic', label: 'Orthotic Arch Support', price: 15 },
  { id: 'merino', label: 'Thermal Merino Wool', price: 15 },
];

export type SizeSystem = 'EU' | 'US' | 'UK';

/** EU size -> [US, UK]. */
const SIZE_TABLE: ReadonlyArray<readonly [number, string, string]> = [
  [38, '5.5', '5'],
  [39, '6.5', '6'],
  [40, '7.5', '6.5'],
  [40.5, '8', '7'],
  [41, '8.5', '7.5'],
  [41.5, '9', '8'],
  [42, '9.5', '8.5'],
  [42.5, '10', '9'],
  [43, '10.5', '9.5'],
  [44, '11', '10'],
  [45, '12', '11'],
  [46, '13', '12'],
];

export const SIZES: readonly number[] = SIZE_TABLE.map(([eu]) => eu);

export function sizeLabel(eu: number, system: SizeSystem = 'EU'): string {
  const row = SIZE_TABLE.find(([size]) => size === eu);
  if (!row || system === 'EU') return `EU ${eu}`;
  return system === 'US' ? `US ${row[1]}` : `UK ${row[2]}`;
}

/** Convert a size in another system to EU; returns undefined when no such size exists. */
export function toEuSize(value: number, system: SizeSystem): number | undefined {
  if (system === 'EU') return SIZES.includes(value) ? value : undefined;
  const idx = system === 'US' ? 1 : 2;
  return SIZE_TABLE.find((row) => Number(row[idx]) === value)?.[0];
}

export interface CartItem {
  pid: number;
  size: number;
  width: WidthId;
  insole: InsoleId;
  color: string;
  qty: number;
}

export type ShippingMethod = 'standard' | 'express';
export type OrderStatus = 'Processing' | 'Dispatched' | 'Delivered';

export interface OrderLine {
  pid: number;
  name: string;
  size: number;
  width: string;
  insole: string;
  color: string;
  qty: number;
  unit: number;
}

export interface Order {
  id: number;
  tracking: string;
  uid: number;
  name: string;
  phone: string;
  address: string;
  zip: string;
  method: ShippingMethod;
  coupon?: string;
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  date: string;
  status: OrderStatus;
  lines: OrderLine[];
}

export interface User {
  id: number;
  name: string;
  phone: string;
  role: 'admin' | 'user';
  address?: string;
  zip?: string;
}

export interface Review {
  author: string;
  rating: number;
  title: string;
  body: string;
  date: string;
  fit: 'Runs small' | 'True to size' | 'Runs large';
}
