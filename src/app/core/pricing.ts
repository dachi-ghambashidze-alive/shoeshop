import { ShippingMethod } from './models';

/** Single source of truth for promo codes, shipping and trial policy (used by the store, UI and chatbot). */
export interface Coupon {
  code: string;
  label: string;
  percent?: number;
  flat?: number;
  freeShip?: boolean;
}

export const COUPONS: readonly Coupon[] = [
  { code: 'COOKED20', label: '20% off your order', percent: 20 },
  { code: 'SOLE10', label: '$10 off your order', flat: 10 },
  { code: 'FREESHIP', label: 'Free express delivery', freeShip: true },
];

export const FREE_SHIPPING_FROM = 150;
export const SHIPPING_RATES: Record<ShippingMethod, number> = { standard: 10, express: 15 };
/** Business-day delivery windows. */
export const SHIPPING_DAYS: Record<ShippingMethod, readonly [number, number]> = {
  standard: [3, 5],
  express: [1, 2],
};
export const TRIAL_DAYS = 30;

export function findCoupon(code: string): Coupon | undefined {
  const wanted = code.trim().toUpperCase();
  return COUPONS.find((coupon) => coupon.code === wanted);
}

export const round2 = (value: number): number => Math.round(value * 100) / 100;

export function discountFor(subtotal: number, coupon?: Coupon | null): number {
  if (!coupon || subtotal <= 0) return 0;
  if (coupon.percent) return round2((subtotal * coupon.percent) / 100);
  if (coupon.flat) return Math.min(subtotal, coupon.flat);
  return 0;
}

export function shippingFor(subtotal: number, method: ShippingMethod, coupon?: Coupon | null): number {
  if (subtotal <= 0 || subtotal >= FREE_SHIPPING_FROM || coupon?.freeShip) return 0;
  return SHIPPING_RATES[method];
}

export interface Totals {
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
}

export function totalsFor(subtotal: number, method: ShippingMethod, coupon?: Coupon | null): Totals {
  const discount = discountFor(subtotal, coupon);
  const shipping = shippingFor(subtotal, method, coupon);
  return {
    subtotal: round2(subtotal),
    discount,
    shipping,
    total: round2(Math.max(0, subtotal - discount) + shipping),
  };
}

export function money(value: number): string {
  const rounded = round2(value);
  return Number.isInteger(rounded)
    ? `$${rounded.toLocaleString('en-US')}`
    : `$${rounded.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function addBusinessDays(from: Date, days: number): Date {
  const date = new Date(from);
  let remaining = days;
  while (remaining > 0) {
    date.setDate(date.getDate() + 1);
    const weekday = date.getDay();
    if (weekday !== 0 && weekday !== 6) remaining--;
  }
  return date;
}

export function formatDay(date: Date): string {
  return date.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
}

/** e.g. "Tue, 14 Oct – Thu, 16 Oct" */
export function deliveryWindow(from: Date, method: ShippingMethod): string {
  const [min, max] = SHIPPING_DAYS[method];
  return `${formatDay(addBusinessDays(from, min))} – ${formatDay(addBusinessDays(from, max))}`;
}
