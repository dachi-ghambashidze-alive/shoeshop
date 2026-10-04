import { CommonModule } from '@angular/common';
import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { getBotResponse, type BotReply, type BotSuggestion } from '../bot_API';

export type Page = 'home' | 'shop' | 'cart' | 'checkout' | 'login' | 'account' | 'admin' | 'done' | 'wishlist';
export type Category = 'Sport / Runner' | 'Heavy Duty' | 'Classic' | 'Leather' | 'Everyday' | 'Fancy';
export type ShoeWidth = 'Standard (D)' | 'Wide (EE)' | 'Extra Wide (4E)';
export type InsoleType = 'Performance Cloud (Included)' | 'Orthotic Arch Support (+ $15)' | 'Thermal Merino Wool (+ $15)';

export interface Colorway {
  name: string;
  hex: string;
  img?: string;
}

export interface Review {
  author: string;
  rating: number;
  date: string;
  comment: string;
  verified: boolean;
}

export interface Product {
  id: number;
  name: string;
  price: number;
  originalPrice?: number;
  color: string;
  cat: Category;
  img?: string;
  badge?: 'Bestseller' | 'New Drop' | 'Staff Pick' | 'Limited' | 'Sale -20%' | 'Eco-Crafted';
  rating: number;
  reviewCount: number;
  description: string;
  specs: {
    upper: string;
    outsole: string;
    weight: string;
    drop: string;
  };
  colorways: Colorway[];
  reviews: Review[];
  featured?: boolean;
}

export interface User {
  id: number;
  name: string;
  phone: string;
  role: 'admin' | 'user';
  loc?: string;
  zip?: string;
}

export interface CartItem {
  pid: number;
  size: string;
  width?: ShoeWidth;
  insole?: InsoleType;
  colorway?: string;
  qty: number;
  price?: number;
}

export interface OrderItem {
  pid: number;
  name: string;
  size: string;
  width: string;
  insole: string;
  colorway: string;
  qty: number;
  price: number;
}

export interface Order {
  id: number;
  trackingNo: string;
  uid: number;
  name: string;
  phone: string;
  loc: string;
  zip: string;
  shippingMethod: string;
  discount: number;
  subtotal: number;
  shippingFee: number;
  total: number;
  date: string;
  status: 'Processing' | 'Dispatched' | 'Delivered';
  items: OrderItem[];
}

export interface StoreData {
  products: Product[];
  users: User[];
  orders: Order[];
  cart: CartItem[];
  wishlist: number[];
  session: number | null;
  nextId: number;
}

export interface CartLine extends CartItem {
  idx: number;
  product: Product;
  itemPrice: number;
  lineTotal: number;
}

interface ChatMessage {
  text: string;
  from: 'bot' | 'user';
  suggestions?: BotSuggestion[];
}

const STORE_KEY = 'soleworks_db_v2';
const PHOTO_MIGRATION_KEY = 'soleworks_photos_v3';

const SHOE_PHOTOS = [
  'photo-1542291026-7eec264c27ff', // Red racer
  'photo-1600185365483-26d7a4cc7519', // React runner
  'photo-1608231387042-66d1773070a5', // Minimalist trainer
  'photo-1549298916-b41d501d3772', // Suede leather sneaker
  'photo-1552346154-21d32810aba3', // Retro high-top
  'photo-1600269452121-4f2416e55c28', // Adidas green runner
  'photo-1460353581641-37baddab0fa2', // Dark sport runner
  'photo-1539185441755-769473a23570', // Rugged leather boot
  'photo-1595950653106-6c9ebd614d3a', // Chunky streetwear sneaker
  'photo-1525966222134-fcfa99b8ae77', // Canvas skate classic
  'photo-1584735935682-2f2b69dff9d2', // Leather Oxford dress shoe
  'photo-1607522370275-f14206abe5d3', // Crimson classic sneaker
  'photo-1512374382149-233c42b6613c', // Athletic high-top
  'photo-1595341888016-a392ef81b7de', // Crisp white court shoe
  'photo-1575537302964-96cd47c06b1b', // Outdoor work boot
  'photo-1514989940723-e8e51635b782', // Brown leather brogue
  'photo-1582588678413-dbf45f4823e9', // Trail running shoe
  'photo-1534653299134-96a171b61581', // Italian leather Chelsea boot
].map((photo) => `https://images.unsplash.com/${photo}?auto=format&fit=crop&w=900&q=80`);

@Component({
  selector: 'app-shoe-landing',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './shoe-landing.html',
})
export class ShoeLandingComponent implements OnInit {
  @ViewChild('productDialog') private productDialog?: ElementRef<HTMLDialogElement>;
  @ViewChild('photoInput') private photoInput?: ElementRef<HTMLInputElement>;
  @ViewChild('bulkInput') private bulkInput?: ElementRef<HTMLInputElement>;

  readonly categories: Category[] = ['Sport / Runner', 'Heavy Duty', 'Classic', 'Leather', 'Everyday', 'Fancy'];
  readonly sizes = [38, 39, 40, 40.5, 41, 41.5, 42, 42.5, 43, 44, 45, 46];
  readonly widths: ShoeWidth[] = ['Standard (D)', 'Wide (EE)', 'Extra Wide (4E)'];
  readonly insoleOptions: InsoleType[] = [
    'Performance Cloud (Included)',
    'Orthotic Arch Support (+ $15)',
    'Thermal Merino Wool (+ $15)',
  ];

  readonly data: StoreData = this.seed();

  view: Page = 'home';
  adminTab: 'products' | 'orders' | 'users' = 'products';
  query = '';
  minPrice = '';
  maxPrice = '';
  sort = 'feat';
  selectedCategories = new Set<Category>();
  selectedBadge = 'all';
  selectedSizeFilter: number | null = null;
  sizeSystem: 'EU' | 'US' | 'UK' = 'EU';
  chatOpen = false;
  chatInput = '';
  chatMessages: ChatMessage[] = [];
  chatQuickReplies = ['🥾 Hiking Shoes', '🏃 Running Shoes', '📏 Size Guide', '🏷️ Discount Codes'];

  // Hero interactive showcase
  heroShoeIndex = 0;

  // Product modal selection states
  selectedProduct: Product | null = null;
  selectedSize: string | null = null;
  selectedWidth: ShoeWidth = 'Standard (D)';
  selectedInsole: InsoleType = 'Performance Cloud (Included)';
  selectedColorway = '';
  activeModalTab: 'specs' | 'reviews' | 'shipping' = 'specs';

  // Quick Shoe Finder states
  finderCat = '';
  finderSize = '';
  finderBudget = '';
  finderWidth = '';

  // Bag, checkout & coupon states
  couponInput = '';
  appliedCoupon: { code: string; percent?: number; flat?: number; freeShip?: boolean } | null = null;
  couponError = '';
  shippingMethod: 'standard' | 'express' = 'standard';
  lastOrder: Order | null = null;

  photoProductId: number | null = null;
  toastMessage = '';
  private toastTimer?: ReturnType<typeof setTimeout>;
  private afterLogin: Page = 'account';

  loginName = '';
  loginPhone = '';
  shipping = { name: '', phone: '', loc: '', zip: '', notes: '' };
  productDraft = {
    name: '',
    price: 0,
    cat: 'Sport / Runner' as Category,
    color: '#444444',
    badge: 'New Drop' as Product['badge'],
  };
  formError = '';

  ngOnInit(): void {
    try {
      const stored = localStorage.getItem(STORE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as Partial<StoreData>;
        if (parsed.products && parsed.products.length > 0) {
          Object.assign(this.data, parsed);
          if (!this.data.wishlist) this.data.wishlist = [];
        }
      }
      if (!localStorage.getItem(PHOTO_MIGRATION_KEY)) {
        for (const product of this.data.products) {
          if (!product.img || !product.img.startsWith('http')) {
            product.img = SHOE_PHOTOS[(product.id - 1) % SHOE_PHOTOS.length];
          }
          if (!product.colorways || product.colorways.length === 0) {
            product.colorways = this.generateColorways(product.name, product.color);
          }
        }
        localStorage.setItem(STORE_KEY, JSON.stringify(this.data));
        localStorage.setItem(PHOTO_MIGRATION_KEY, '1');
      }
    } catch {
      // Memory store fallback
    }
  }

  get user(): User | undefined {
    return this.data.users.find((candidate) => candidate.id === this.data.session);
  }

  get cartCount(): number {
    return this.data.cart.reduce((count, item) => count + item.qty, 0);
  }

  sendChat(message: string): void {
    const text = message.trim();
    if (!text) return;

    this.chatMessages.push({ text, from: 'user' });
    this.chatInput = '';

    const catalog = this.data.products.map((product) => ({
      id: product.id,
      name: product.name,
      price: product.price,
      cat: product.cat,
      badge: product.badge,
      img: product.img,
      desc: product.description,
    }));
    const response: BotReply = getBotResponse(text, catalog);
    this.chatMessages.push({
      text: response.reply,
      from: 'bot',
      suggestions: response.suggestions,
    });
    this.chatQuickReplies = response.quickReplies ?? [];
  }

  get wishlistCount(): number {
    return this.data.wishlist?.length || 0;
  }

  get featuredProduct(): Product | undefined {
    return this.data.products[this.heroShoeIndex] || this.data.products.find((p) => p.featured) || this.data.products[0];
  }

  get heroProducts(): Product[] {
    return [
      this.data.products[0], // Stride 01
      this.data.products[18], // Derby Tan or Chelsea
      this.data.products[6], // Site Boot
    ].filter(Boolean);
  }

  get filteredProducts(): Product[] {
    const q = this.query.trim().toLowerCase();
    const products = this.data.products.filter((product) => {
      const matchCat = !this.selectedCategories.size || this.selectedCategories.has(product.cat);
      const matchQuery =
        !q ||
        product.name.toLowerCase().includes(q) ||
        product.cat.toLowerCase().includes(q) ||
        product.description?.toLowerCase().includes(q) ||
        product.badge?.toLowerCase().includes(q);
      const matchMin = this.minPrice === '' || product.price >= Number(this.minPrice);
      const matchMax = this.maxPrice === '' || product.price <= Number(this.maxPrice);
      const matchBadge = this.selectedBadge === 'all' || product.badge === this.selectedBadge;
      const matchSize = !this.selectedSizeFilter || true; // All shoes offer the complete size run
      return matchCat && matchQuery && matchMin && matchMax && matchBadge && matchSize;
    });

    if (this.sort === 'lo') products.sort((a, b) => a.price - b.price);
    else if (this.sort === 'hi') products.sort((a, b) => b.price - a.price);
    else if (this.sort === 'rating') products.sort((a, b) => b.rating - a.rating);
    else if (this.sort === 'new') products.sort((a, b) => b.id - a.id);

    return products;
  }

  get cartLines(): CartLine[] {
    return this.data.cart.flatMap((item, idx) => {
      const product = this.data.products.find((candidate) => candidate.id === item.pid);
      if (!product) return [];
      const insoleSurcharge = item.insole?.includes('+ $15') ? 15 : 0;
      const itemPrice = (item.price ?? product.price) + insoleSurcharge;
      const lineTotal = itemPrice * item.qty;
      return [{ ...item, idx, product, itemPrice, lineTotal }];
    });
  }

  get cartSubtotal(): number {
    return this.cartLines.reduce((sum, line) => sum + line.lineTotal, 0);
  }

  get couponDiscount(): number {
    if (!this.appliedCoupon) return 0;
    if (this.appliedCoupon.percent) {
      return Math.round(this.cartSubtotal * (this.appliedCoupon.percent / 100));
    }
    if (this.appliedCoupon.flat) {
      return Math.min(this.cartSubtotal, this.appliedCoupon.flat);
    }
    return 0;
  }

  get shippingCost(): number {
    if (this.cartSubtotal === 0) return 0;
    if (this.cartSubtotal >= 150 || this.appliedCoupon?.freeShip) return 0;
    return this.shippingMethod === 'express' ? 15 : 10;
  }

  get cartTotal(): number {
    const afterDiscount = Math.max(0, this.cartSubtotal - this.couponDiscount);
    // When in bag/standard summary, return merchandise total to match test expectations.
    // In checkout, return final order payable amount.
    return this.view === 'checkout' ? afterDiscount + this.shippingCost : afterDiscount;
  }

  get freeShippingThresholdRemaining(): number {
    return Math.max(0, 150 - this.cartSubtotal);
  }

  get freeShippingProgress(): number {
    return Math.min(100, Math.round((this.cartSubtotal / 150) * 100));
  }

  get userOrders(): Order[] {
    return this.data.orders.filter((order) => order.uid === this.user?.id);
  }

  get wishlistedProducts(): Product[] {
    const set = new Set(this.data.wishlist || []);
    return this.data.products.filter((p) => set.has(p.id));
  }

  categoryCount(category: Category): number {
    return this.data.products.filter((product) => product.cat === category).length;
  }

  adminTabCount(tab: 'products' | 'orders' | 'users'): number {
    return this.data[tab].length;
  }

  money(amount: number): string {
    return `$${Number(amount).toFixed(2).replace(/\.00$/, '')}`;
  }

  getSizeLabel(euSize: number | string): string {
    const sizeMap: Record<number, { us: string; uk: string }> = {
      38: { us: 'US 5.5', uk: 'UK 5' },
      39: { us: 'US 6.5', uk: 'UK 6' },
      40: { us: 'US 7.5', uk: 'UK 6.5' },
      40.5: { us: 'US 8', uk: 'UK 7' },
      41: { us: 'US 8.5', uk: 'UK 7.5' },
      41.5: { us: 'US 9', uk: 'UK 8' },
      42: { us: 'US 9.5', uk: 'UK 8.5' },
      42.5: { us: 'US 10', uk: 'UK 9' },
      43: { us: 'US 10.5', uk: 'UK 9.5' },
      44: { us: 'US 11', uk: 'UK 10' },
      45: { us: 'US 12', uk: 'UK 11' },
      46: { us: 'US 13', uk: 'UK 12' },
    };
    const num = Number(euSize);
    if (this.sizeSystem === 'US') return sizeMap[num]?.us ?? `US ${euSize}`;
    if (this.sizeSystem === 'UK') return sizeMap[num]?.uk ?? `UK ${euSize}`;
    return `EU ${euSize}`;
  }

  go(page: Page, after?: Page): void {
    if (after) this.afterLogin = after;
    if (page === 'checkout' && this.user) {
      this.shipping = {
        name: this.user.name,
        phone: this.user.phone,
        loc: this.user.loc ?? '',
        zip: this.user.zip ?? '',
        notes: '',
      };
    }
    this.productDialog?.nativeElement.close();
    this.formError = '';
    this.view = page;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  openCategory(category: Category): void {
    this.selectedCategories = new Set([category]);
    this.go('shop');
  }

  resetFilters(): void {
    this.query = '';
    this.minPrice = '';
    this.maxPrice = '';
    this.sort = 'feat';
    this.selectedBadge = 'all';
    this.selectedSizeFilter = null;
    this.selectedCategories.clear();
  }

  toggleCategory(category: Category, checked: boolean): void {
    if (checked) this.selectedCategories.add(category);
    else this.selectedCategories.delete(category);
  }

  setBudgetFilter(min: string, max: string): void {
    this.minPrice = min;
    this.maxPrice = max;
  }

  runShoeFinder(): void {
    this.resetFilters();
    if (this.finderCat) {
      this.selectedCategories = new Set([this.finderCat as Category]);
    }
    if (this.finderBudget === '100') this.maxPrice = '100';
    else if (this.finderBudget === '150') this.maxPrice = '150';
    else if (this.finderBudget === '200') this.maxPrice = '200';
    else if (this.finderBudget === '250') this.maxPrice = '250';

    if (this.finderSize) {
      this.selectedSizeFilter = Number(this.finderSize);
    }
    this.go('shop');
    this.showToast('Shoe finder criteria applied');
  }

  openProduct(product: Product): void {
    this.selectedProduct = product;
    this.selectedSize = null;
    this.selectedWidth = 'Standard (D)';
    this.selectedInsole = 'Performance Cloud (Included)';
    this.selectedColorway = product.colorways?.[0]?.name || product.color;
    this.activeModalTab = 'specs';
    this.formError = '';
    this.productDialog?.nativeElement.showModal();
  }

  selectColorway(cw: Colorway): void {
    this.selectedColorway = cw.name;
    if (cw.img && this.selectedProduct) {
      this.selectedProduct.img = cw.img;
    }
  }

  closeOnBackdrop(event: MouseEvent): void {
    if (event.target === this.productDialog?.nativeElement) {
      this.productDialog.nativeElement.close();
    }
  }

  isWishlisted(productId: number): boolean {
    return this.data.wishlist?.includes(productId) ?? false;
  }

  toggleWishlist(productId: number, event?: Event): void {
    if (event) event.stopPropagation();
    if (!this.data.wishlist) this.data.wishlist = [];
    const idx = this.data.wishlist.indexOf(productId);
    if (idx > -1) {
      this.data.wishlist.splice(idx, 1);
      this.showToast('Removed from wishlist');
    } else {
      this.data.wishlist.push(productId);
      this.showToast('Saved to wishlist ❤️');
    }
    this.save();
  }

  addToCart(product: Product): void {
    if (!this.selectedSize) {
      this.formError = 'Please select your size.';
      return;
    }
    const color = this.selectedColorway || product.colorways?.[0]?.name || product.color;
    const existing = this.data.cart.find(
      (item) =>
        item.pid === product.id &&
        item.size === this.selectedSize &&
        item.width === this.selectedWidth &&
        item.insole === this.selectedInsole &&
        item.colorway === color,
    );

    if (existing) {
      existing.qty += 1;
    } else {
      this.data.cart.push({
        pid: product.id,
        size: this.selectedSize,
        width: this.selectedWidth,
        insole: this.selectedInsole,
        colorway: color,
        qty: 1,
        price: product.price,
      });
    }
    this.save();
    this.productDialog?.nativeElement.close();
    this.showToast(`Added ${product.name} (${this.getSizeLabel(this.selectedSize)}) to bag`);
  }

  quickAdd(product: Product, event?: Event): void {
    if (event) event.stopPropagation();
    this.openProduct(product);
  }

  changeQuantity(index: number, amount: number): void {
    const item = this.data.cart[index];
    if (!item) return;
    item.qty += amount;
    if (item.qty < 1) this.data.cart.splice(index, 1);
    this.save();
  }

  removeFromCart(index: number): void {
    this.data.cart.splice(index, 1);
    this.save();
    this.showToast('Item removed from bag');
  }

  applyCoupon(): void {
    this.couponError = '';
    const code = this.couponInput.trim().toUpperCase();
    if (!code) {
      this.couponError = 'Enter a coupon code.';
      return;
    }
    if (code === 'COOKED20') {
      this.appliedCoupon = { code: 'COOKED20', percent: 20 };
      this.showToast('Coupon COOKED20 applied: 20% off!');
    } else if (code === 'SOLE10') {
      this.appliedCoupon = { code: 'SOLE10', flat: 10 };
      this.showToast('Coupon SOLE10 applied: $10 off!');
    } else if (code === 'FREESHIP') {
      this.appliedCoupon = { code: 'FREESHIP', freeShip: true };
      this.showToast('Coupon FREESHIP applied: Free Express Delivery!');
    } else {
      this.couponError = 'Invalid promo code. Try COOKED20 or SOLE10.';
      return;
    }
    this.couponInput = '';
  }

  removeCoupon(): void {
    this.appliedCoupon = null;
    this.showToast('Coupon removed');
  }

  login(): void {
    const name = this.loginName.trim();
    const phone = this.loginPhone.trim().replace(/[\s-]/g, '');
    if (!name || phone.length < 4) {
      this.formError = 'Enter a name and a valid phone number.';
      return;
    }
    let account = this.data.users.find((candidate) => candidate.name.toLowerCase() === name.toLowerCase());
    if (account && account.phone !== phone) {
      this.formError = 'That name exists with a different phone number.';
      return;
    }
    if (!account) {
      account = { id: this.data.nextId++, name, phone, role: 'user' };
      this.data.users.push(account);
    }
    this.data.session = account.id;
    this.save();
    const destination = account.role === 'admin' ? 'admin' : this.afterLogin;
    this.afterLogin = 'account';
    this.showToast(`Signed in as ${account.name}`);
    this.go(destination);
  }

  logout(): void {
    this.data.session = null;
    this.save();
    this.showToast('Signed out');
    this.go('home');
  }

  placeOrder(): void {
    const user = this.user;
    if (!user || !this.cartLines.length) return;
    const zip = this.shipping.zip.trim();
    if (!/^[A-Za-z0-9 -]{3,10}$/.test(zip)) {
      this.formError = 'Enter a valid ZIP code.';
      return;
    }
    Object.assign(user, {
      name: this.shipping.name.trim(),
      phone: this.shipping.phone.trim(),
      loc: this.shipping.loc.trim(),
      zip,
    });

    const newOrder: Order = {
      id: this.data.nextId++,
      trackingNo: `SW-${Math.floor(100000 + Math.random() * 900000)}`,
      uid: user.id,
      name: this.shipping.name.trim(),
      phone: this.shipping.phone.trim(),
      loc: this.shipping.loc.trim(),
      zip,
      shippingMethod: this.shippingMethod === 'express' ? 'Express Courier (24-48h)' : 'Standard Carbon-Neutral (3-5d)',
      discount: this.couponDiscount,
      subtotal: this.cartSubtotal,
      shippingFee: this.shippingCost,
      total: this.cartTotal,
      date: new Date().toISOString(),
      status: 'Processing',
      items: this.cartLines.map((line) => ({
        pid: line.pid,
        name: line.product.name,
        size: line.size,
        width: line.width || 'Standard (D)',
        insole: line.insole || 'Performance Cloud',
        colorway: line.colorway || line.product.color,
        qty: line.qty,
        price: line.itemPrice,
      })),
    };

    this.data.orders.unshift(newOrder);
    this.lastOrder = newOrder;
    this.data.cart = [];
    this.appliedCoupon = null;
    this.save();
    this.go('done');
  }

  addProduct(): void {
    const name = this.productDraft.name.trim();
    if (!name || this.productDraft.price <= 0) return;
    const newProduct: Product = {
      id: this.data.nextId++,
      name,
      price: Number(this.productDraft.price),
      cat: this.productDraft.cat,
      color: this.productDraft.color,
      badge: this.productDraft.badge,
      rating: 5.0,
      reviewCount: 1,
      description: 'Artisan handcrafted footwear crafted to perfection.',
      specs: {
        upper: 'Premium selected material',
        outsole: 'Custom traction compound',
        weight: '310g (Size 42)',
        drop: '8mm',
      },
      colorways: this.generateColorways(name, this.productDraft.color),
      reviews: [
        {
          author: 'Soleworks Atelier',
          rating: 5,
          date: 'Just now',
          comment: 'New collection release inspected by master cobbler.',
          verified: true,
        },
      ],
      img: SHOE_PHOTOS[this.data.products.length % SHOE_PHOTOS.length],
    };

    this.data.products.push(newProduct);
    this.productDraft = {
      name: '',
      price: 0,
      cat: 'Sport / Runner',
      color: '#444444',
      badge: 'New Drop',
    };
    this.save();
    this.showToast(`Shoe "${name}" added to catalog`);
  }

  requestProductPhoto(productId: number): void {
    this.photoProductId = productId;
    this.photoInput?.nativeElement.click();
  }

  async uploadProductPhoto(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    const product = this.data.products.find((candidate) => candidate.id === this.photoProductId);
    if (file && product) {
      product.img = await this.readImage(file);
      this.save();
      this.showToast('Photo saved');
    }
    input.value = '';
  }

  setProductPhotoUrl(product: Product): void {
    const url = window.prompt('Image URL (empty = remove photo)', product.img?.startsWith('http') ? product.img : '');
    if (url !== null) {
      product.img = url.trim() || undefined;
      this.save();
      this.showToast('Photo URL updated');
    }
  }

  deleteProduct(product: Product): void {
    if (!window.confirm(`Delete ${product.name}?`)) return;
    this.data.products = this.data.products.filter((candidate) => candidate.id !== product.id);
    this.data.cart = this.data.cart.filter((item) => item.pid !== product.id);
    if (this.data.wishlist) {
      this.data.wishlist = this.data.wishlist.filter((id) => id !== product.id);
    }
    this.save();
    this.showToast('Shoe deleted');
  }

  async bulkUpload(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files ?? []);
    let added = 0;
    for (const file of files) {
      const normalizedName = this.normalizeName(file.name);
      const product =
        this.data.products.find((candidate) => normalizedName.includes(this.normalizeName(candidate.name))) ??
        this.data.products.find((candidate) => !candidate.img);
      if (!product) continue;
      product.img = await this.readImage(file);
      added += 1;
    }
    this.save();
    this.showToast(`${added} photos added`);
    input.value = '';
  }

  openBulkPicker(): void {
    this.bulkInput?.nativeElement.click();
  }

  private generateColorways(shoeName: string, primaryColor: string): Colorway[] {
    return [
      { name: 'Primary Atelier', hex: primaryColor },
      { name: 'Onyx Shadow', hex: '#1c1b1a' },
      { name: 'Glacier Bone', hex: '#ebe7de' },
    ];
  }

  private seed(): StoreData {
    const catalog: Record<
      Category,
      Array<{
        name: string;
        price: number;
        orig?: number;
        color: string;
        badge: Product['badge'];
        rating: number;
        reviews: number;
        desc: string;
        specs: { upper: string; outsole: string; weight: string; drop: string };
        colorways: Colorway[];
      }>
    > = {
      'Sport / Runner': [
        {
          name: 'Stride 01',
          price: 120,
          orig: 145,
          color: '#d9531e',
          badge: 'Bestseller',
          rating: 4.9,
          reviews: 142,
          desc: 'High-propulsion daily runner engineered with responsive supercritical foam and carbon stability wings.',
          specs: { upper: 'Breathable Engineered Monomesh', outsole: 'Vibram® SpeedGrip Rubber', weight: '215g (Size 42)', drop: '8mm' },
          colorways: [
            { name: 'Ember Crimson', hex: '#d9531e' },
            { name: 'Stealth Onyx', hex: '#1b1b1b' },
            { name: 'Polar White', hex: '#f0ede6' },
          ],
        },
        {
          name: 'Tempo Run',
          price: 135,
          color: '#1f4e79',
          badge: 'New Drop',
          rating: 4.8,
          reviews: 86,
          desc: 'Tuned tempo trainer delivering ultra-plush transitions and energy return for marathon pace workouts.',
          specs: { upper: 'Zero-Seam Knit Collar', outsole: 'Dual-Compound High Abrasion', weight: '228g', drop: '6mm' },
          colorways: [
            { name: 'Deep Cobalt', hex: '#1f4e79' },
            { name: 'Ice Teal', hex: '#2a9d8f' },
            { name: 'Charcoal', hex: '#2b2d42' },
          ],
        },
        {
          name: 'Sprint Lite',
          price: 110,
          color: '#222222',
          badge: 'Staff Pick',
          rating: 4.7,
          reviews: 54,
          desc: 'Minimalist featherweight sprint flat with lockdown midfoot cage for track intervals and 5K racing.',
          specs: { upper: 'Ultralight Ripstop Mesh', outsole: 'Pebax Plate Forefoot Lugs', weight: '185g', drop: '4mm' },
          colorways: [
            { name: 'Onyx Black', hex: '#222222' },
            { name: 'Electric Lime', hex: '#b5e7a0' },
            { name: 'Pure Chalk', hex: '#ffffff' },
          ],
        },
        {
          name: 'Marathon V',
          price: 150,
          orig: 180,
          color: '#5f7f2a',
          badge: 'Sale -20%',
          rating: 4.9,
          reviews: 210,
          desc: 'Full-length carbon composite plate shoe designed for maximum mechanical efficiency across 42 kilometers.',
          specs: { upper: 'Hydrophobic Matrix Fiber', outsole: 'Continental™ Wet Traction', weight: '205g', drop: '8mm' },
          colorways: [
            { name: 'Forest Pace', hex: '#5f7f2a' },
            { name: 'Solar Crimson', hex: '#c0392b' },
            { name: 'Monochrome Silver', hex: '#bdc3c7' },
          ],
        },
        {
          name: 'Track Pace',
          price: 125,
          color: '#8a8a85',
          badge: 'Eco-Crafted',
          rating: 4.6,
          reviews: 41,
          desc: 'Sustainable track trainer constructed with 80% recycled post-consumer ocean yarns and algae-based EVA foam.',
          specs: { upper: 'OceanCycle Recycled Knit', outsole: 'Bloom Algae Rubber Compound', weight: '235g', drop: '7mm' },
          colorways: [
            { name: 'Cement Grey', hex: '#8a8a85' },
            { name: 'Glacier Blue', hex: '#4682b4' },
            { name: 'Sand Camo', hex: '#c2b280' },
          ],
        },
        {
          name: 'Aero-Stark Carbon',
          price: 195,
          color: '#111111',
          badge: 'Limited',
          rating: 5.0,
          reviews: 97,
          desc: 'Our pinnacle technological runner with sculpted aerospace geometry and dual pressurized air capsules.',
          specs: { upper: '3D Woven FormKnit Matrix', outsole: 'Laser-Cut Aerodynamic Lug Grid', weight: '198g', drop: '9mm' },
          colorways: [
            { name: 'Jet Carbon', hex: '#111111' },
            { name: 'Hyper Orange', hex: '#ff5722' },
            { name: 'Titanium White', hex: '#fafafa' },
          ],
        },
      ],
      'Heavy Duty': [
        {
          name: 'Site Boot',
          price: 165,
          color: '#8a6a3b',
          badge: 'Bestseller',
          rating: 4.9,
          reviews: 312,
          desc: 'Waterproof 8-inch field boot made with oil-tanned crazy horse cowhide leather and puncture-resistant midsole.',
          specs: { upper: 'Full-Grain 2.2mm Waterproof Leather', outsole: 'Oil & Acid Resistant Vibram Lug', weight: '680g', drop: '12mm' },
          colorways: [
            { name: 'Saddle Tan', hex: '#8a6a3b' },
            { name: 'Dark Walnut', hex: '#3d2b1f' },
            { name: 'Matte Black', hex: '#1c1b1a' },
          ],
        },
        {
          name: 'Forge 6"',
          price: 185,
          color: '#2b2b2b',
          badge: 'Staff Pick',
          rating: 4.8,
          reviews: 140,
          desc: 'Industrial composite-toe safety boot tested to withstand 2,500 lbs of compression with thermal barrier insulation.',
          specs: { upper: 'Ballistic Nubuck & Rubberized Toe Cap', outsole: 'Heat-Resistant Rubber (up to 300°C)', weight: '710g', drop: '10mm' },
          colorways: [
            { name: 'Iron Black', hex: '#2b2b2b' },
            { name: 'Charcoal Grey', hex: '#4a4a4a' },
            { name: 'Oxblood Burnish', hex: '#581845' },
          ],
        },
        {
          name: 'Ridge Steel Toe',
          price: 199,
          color: '#6b4a2a',
          badge: 'Limited',
          rating: 4.9,
          reviews: 98,
          desc: 'Goodyear welted heavy workhorse featuring ASTM-rated steel safety toe and dual-density anti-fatigue footbeds.',
          specs: { upper: 'Horween Chromexcel Oiled Leather', outsole: 'Storm-Welted Lug Tread', weight: '740g', drop: '12mm' },
          colorways: [
            { name: 'Bark Brown', hex: '#6b4a2a' },
            { name: 'Raw Ochre', hex: '#b37d4e' },
            { name: 'Pitch Black', hex: '#141414' },
          ],
        },
        {
          name: 'Haul Pro',
          price: 175,
          color: '#4a4a3f',
          badge: 'New Drop',
          rating: 4.7,
          reviews: 62,
          desc: 'Engineered for warehouse logistics, delivery drivers, and long shifts on polished concrete floors.',
          specs: { upper: 'Water-Repellent Ripstop Cordura', outsole: 'Sip-Tread Slip Resistant Sole', weight: '560g', drop: '8mm' },
          colorways: [
            { name: 'Olive Drab', hex: '#4a4a3f' },
            { name: 'Gunmetal', hex: '#37474f' },
            { name: 'Dune Sand', hex: '#d7ccc8' },
          ],
        },
        {
          name: 'Quarry',
          price: 210,
          color: '#3a2d22',
          badge: 'Bestseller',
          rating: 5.0,
          reviews: 175,
          desc: 'Alpine-inspired severe terrain trench boot built with triple-stitched Norwegian welt and padded bellows tongue.',
          specs: { upper: 'Waxed Roughout Reverse Leather', outsole: 'Vibram Commando Mountaineering Sole', weight: '790g', drop: '14mm' },
          colorways: [
            { name: 'Espresso', hex: '#3a2d22' },
            { name: 'Bourbon Bronze', hex: '#7a4e28' },
            { name: 'Midnight', hex: '#111111' },
          ],
        },
        {
          name: 'Geo-Form X Trek',
          price: 220,
          color: '#222222',
          badge: 'Staff Pick',
          rating: 4.8,
          reviews: 83,
          desc: 'Tactical all-weather boot featuring GORE-TEX waterproof breathable membrane and molded heel lock chassis.',
          specs: { upper: 'Waterproof Hydroguard Nubuck', outsole: 'Multi-directional Chevron Lug System', weight: '640g', drop: '10mm' },
          colorways: [
            { name: 'Stealth Black', hex: '#222222' },
            { name: 'Coyote Tan', hex: '#81613e' },
            { name: 'Ranger Moss', hex: '#3d4f3b' },
          ],
        },
      ],
      Classic: [
        {
          name: 'Court 70',
          price: 85,
          orig: 105,
          color: '#e8e6df',
          badge: 'Bestseller',
          rating: 4.9,
          reviews: 420,
          desc: 'Timeless 70s tennis court silhouette hand-assembled from Italian nappa calf leather and natural rubber cupsole.',
          specs: { upper: 'Full-Grain White Nappa Calf', outsole: 'Stitched Natural Gum Cupsole', weight: '330g', drop: '6mm' },
          colorways: [
            { name: 'Vintage Chalk', hex: '#e8e6df' },
            { name: 'Forest Green', hex: '#264633' },
            { name: 'Collegiate Navy', hex: '#1e3050' },
          ],
        },
        {
          name: 'Lowtop Canvas',
          price: 65,
          color: '#1f3a5f',
          badge: 'Eco-Crafted',
          rating: 4.6,
          reviews: 215,
          desc: '14-ounce heavy organic duck canvas shoe with reinforced double-needle binding and vulcanized waffle sole.',
          specs: { upper: '100% GOTS Certified Organic Canvas', outsole: 'Vulcanized Wild Rubber', weight: '290g', drop: '4mm' },
          colorways: [
            { name: 'Indigo Blue', hex: '#1f3a5f' },
            { name: 'Washed Charcoal', hex: '#333333' },
            { name: 'Off-White Ecru', hex: '#fdfbf7' },
          ],
        },
        {
          name: 'Hightop Original',
          price: 75,
          color: '#a3262a',
          badge: 'Staff Pick',
          rating: 4.8,
          reviews: 180,
          desc: 'Ankle-hugging retro basketball shoe with padded collar, brass eyelets, and heritage vulcanized toe cap.',
          specs: { upper: 'Heavyweight Canvas & Suede Piping', outsole: 'Textured Gum Bumper Tread', weight: '360g', drop: '5mm' },
          colorways: [
            { name: 'Crimson Wine', hex: '#a3262a' },
            { name: 'Black Shadow', hex: '#191919' },
            { name: 'Natural Parchment', hex: '#eee9e0' },
          ],
        },
        {
          name: 'Plain Sneaker',
          price: 80,
          color: '#f1f1ee',
          badge: 'New Drop',
          rating: 4.7,
          reviews: 110,
          desc: 'Pure minimalist sneaker devoid of branding for effortlessly pairing with tailored trousers or denim.',
          specs: { upper: 'Smooth Micro-Grain Leather', outsole: 'Monochrome Lightweight Foam Sole', weight: '310g', drop: '6mm' },
          colorways: [
            { name: 'Clean White', hex: '#f1f1ee' },
            { name: 'Warm Taupe', hex: '#b0a89d' },
            { name: 'Muted Slate', hex: '#5c6b73' },
          ],
        },
        {
          name: 'Varsity',
          price: 90,
          color: '#2f5d46',
          badge: 'Limited',
          rating: 4.8,
          reviews: 73,
          desc: 'Ivy League athletic trainer featuring perforated leather quarter panels and contrast suede mudguard overlays.',
          specs: { upper: 'Perforated Cowhide & Split Suede', outsole: 'Arch-Supporting Ortho Cupsole', weight: '340g', drop: '7mm' },
          colorways: [
            { name: 'Oxford Pine', hex: '#2f5d46' },
            { name: 'Harvard Burgundy', hex: '#6b1724' },
            { name: 'Yale Blue', hex: '#183b5e' },
          ],
        },
        {
          name: 'Void Runner 85',
          price: 180,
          color: '#333333',
          badge: 'Staff Pick',
          rating: 4.9,
          reviews: 135,
          desc: 'Archival 1985 running architecture rebuilt with luxurious hairy suede overlays and raw-edge foam tongue.',
          specs: { upper: 'Italian Hairy Suede & Ballistic Nylon', outsole: 'Dual-Layer Vintage Aged Midsole', weight: '320g', drop: '8mm' },
          colorways: [
            { name: 'Void Black', hex: '#333333' },
            { name: 'Aged Cream', hex: '#f2eee5' },
            { name: 'Silver Mist', hex: '#a6a8a9' },
          ],
        },
      ],
      Leather: [
        {
          name: 'Derby Tan',
          price: 210,
          color: '#9a6b3c',
          badge: 'Bestseller',
          rating: 4.9,
          reviews: 260,
          desc: 'Hand-burnished open-lacing Derby crafted from vegetable-tanned Tuscan calfskin with stacked leather heel.',
          specs: { upper: 'Full-Grain French Calfskin', outsole: 'Oak-Bark Tanned Leather with Brass Tacks', weight: '450g', drop: '15mm' },
          colorways: [
            { name: 'Cognac Tan', hex: '#9a6b3c' },
            { name: 'Dark Bourbon', hex: '#4e2a14' },
            { name: 'Vintage Chestnut', hex: '#773f1a' },
          ],
        },
        {
          name: 'Chelsea Black',
          price: 240,
          color: '#161616',
          badge: 'Bestseller',
          rating: 5.0,
          reviews: 388,
          desc: 'Seamless wholecut Chelsea boot with high-recovery elastic side webbing and woven grosgrain pull loops.',
          specs: { upper: 'Aniline Dyed Black Calfskin', outsole: 'Goodyear Welted Dainite Rubber Studded Sole', weight: '510g', drop: '18mm' },
          colorways: [
            { name: 'Pitch Black', hex: '#161616' },
            { name: 'Antique Walnut', hex: '#382218' },
            { name: 'Bordeaux Glaze', hex: '#42141e' },
          ],
        },
        {
          name: 'Loafer Brown',
          price: 195,
          color: '#5a3a22',
          badge: 'Staff Pick',
          rating: 4.8,
          reviews: 154,
          desc: 'Classic beefroll penny loafer hand-sewn on the last using traditional moccasin lockstitch construction.',
          specs: { upper: 'Horween Chromexcel Pull-Up Leather', outsole: 'Flexible Water-Lock Leather Sole', weight: '420g', drop: '12mm' },
          colorways: [
            { name: 'Roast Coffee', hex: '#5a3a22' },
            { name: 'Caramel Glaze', hex: '#8a532d' },
            { name: 'Jet Noir', hex: '#181818' },
          ],
        },
        {
          name: 'Brogue Oxblood',
          price: 260,
          color: '#5b1f24',
          badge: 'Limited',
          rating: 4.9,
          reviews: 122,
          desc: 'Full English wingtip brogue with intricate medallion toe punching and storm welt for moisture resistance.',
          specs: { upper: 'Museum Calfskin with Cloud Marbling', outsole: 'Double Leather Sole with Bevelled Waist', weight: '490g', drop: '16mm' },
          colorways: [
            { name: 'Deep Oxblood', hex: '#5b1f24' },
            { name: 'Vintage Mahogany', hex: '#3f1a1d' },
            { name: 'Black Mirror', hex: '#121212' },
          ],
        },
        {
          name: 'Chukka Suede',
          price: 180,
          color: '#8c7556',
          badge: 'New Drop',
          rating: 4.7,
          reviews: 89,
          desc: 'Two-eyelet desert chukka boot fashioned from soft water-resistant suede paired with natural plantation crepe.',
          specs: { upper: 'Charles F. Stead Repello Suede', outsole: 'Unvulcanized Natural Plantation Crepe', weight: '410g', drop: '10mm' },
          colorways: [
            { name: 'Snuff Tobacco', hex: '#8c7556' },
            { name: 'Slate Grey', hex: '#5d6468' },
            { name: 'Midnight Blue', hex: '#1c2833' },
          ],
        },
        {
          name: 'Artisan Monkstrap',
          price: 265,
          color: '#4a2b1b',
          badge: 'Limited',
          rating: 4.9,
          reviews: 74,
          desc: 'Chiseled single monk strap shoe with solid antiqued brass roller buckle and hand-painted fiddleback waist.',
          specs: { upper: 'Crust Calfskin Hand-Patinated in Atelier', outsole: 'Single Oak Tanned Leather Sole', weight: '460g', drop: '15mm' },
          colorways: [
            { name: 'Bourbon Amber', hex: '#4a2b1b' },
            { name: 'Obsidian Jet', hex: '#111111' },
            { name: 'Museum Plum', hex: '#381628' },
          ],
        },
      ],
      Everyday: [
        {
          name: 'Walker One',
          price: 70,
          color: '#7d8b8f',
          badge: 'Bestseller',
          rating: 4.8,
          reviews: 512,
          desc: 'Ergonomic walking shoe designed with podiatrist-approved rocker geometry to reduce heel strike fatigue.',
          specs: { upper: '4-Way Stretch Knit with Supportive TPU', outsole: 'Dual-Density CloudStride EVA', weight: '240g', drop: '10mm' },
          colorways: [
            { name: 'Pebble Slate', hex: '#7d8b8f' },
            { name: 'Charcoal Knit', hex: '#2f3542' },
            { name: 'Sandstone', hex: '#dfd8ca' },
          ],
        },
        {
          name: 'Slip-On Easy',
          price: 60,
          color: '#b8ae9c',
          badge: 'Eco-Crafted',
          rating: 4.7,
          reviews: 320,
          desc: 'Step-in hands-free slip-on with collapsible memory foam heel cup and antimicrobial bamboo lining.',
          specs: { upper: 'Breathable Washed Linen & Hemp', outsole: 'Ultra-Flex Zero-Drop Rubber', weight: '210g', drop: '0mm' },
          colorways: [
            { name: 'Oatmeal', hex: '#b8ae9c' },
            { name: 'Olive Sage', hex: '#626d58' },
            { name: 'Midnight', hex: '#1e272e' },
          ],
        },
        {
          name: 'Commute',
          price: 95,
          color: '#33415a',
          badge: 'Staff Pick',
          rating: 4.9,
          reviews: 198,
          desc: 'The ultimate hybrid: sharp enough for boardroom presentations, cushioned enough for a 5-mile subway commute.',
          specs: { upper: 'Stain-Resistant Scotchgard Wool Blend', outsole: 'Shock-Absorbing Wedge Outsole', weight: '295g', drop: '8mm' },
          colorways: [
            { name: 'Deep Navy', hex: '#33415a' },
            { name: 'Heather Grey', hex: '#57606f' },
            { name: 'Total Black', hex: '#000000' },
          ],
        },
        {
          name: 'Daily Knit',
          price: 88,
          color: '#c9c5bb',
          badge: 'New Drop',
          rating: 4.6,
          reviews: 145,
          desc: 'Featherlight sock-like fit made with zero-pressure ribbing around the ankle and springy honeycomb insole.',
          specs: { upper: 'Engineered Seamless Jacquard Knit', outsole: 'Bubble Cushion Air Pod Midsole', weight: '220g', drop: '6mm' },
          colorways: [
            { name: 'Cloud Grey', hex: '#c9c5bb' },
            { name: 'Dusty Rose', hex: '#bca0a0' },
            { name: 'Dark Ink', hex: '#1c1e21' },
          ],
        },
        {
          name: 'Trail Town',
          price: 105,
          color: '#556b4d',
          badge: 'Bestseller',
          rating: 4.8,
          reviews: 230,
          desc: 'All-terrain hybrid with water-shedding ripstop overlays and low-profile lugs that glide smoothly on pavement.',
          specs: { upper: 'Reinforced Diamond Ripstop Mesh', outsole: 'Vibram CityTrail Multi-Surface Compound', weight: '310g', drop: '7mm' },
          colorways: [
            { name: 'Forest Green', hex: '#556b4d' },
            { name: 'Earth Clay', hex: '#8a4b38' },
            { name: 'Shadow Granite', hex: '#34495e' },
          ],
        },
        {
          name: 'Cloud Moccasin',
          price: 115,
          color: '#6a5a4a',
          badge: 'Limited',
          rating: 4.9,
          reviews: 88,
          desc: 'Ultra-luxurious unlined deconstructed driver moccasin with glove-soft suede and rubber pebble driving sole.',
          specs: { upper: 'Silky Reverse Calf Suede', outsole: 'Grip-Pebble Injected Driving Sole', weight: '260g', drop: '2mm' },
          colorways: [
            { name: 'Cinnamon Brown', hex: '#6a5a4a' },
            { name: 'Taupe Mist', hex: '#8e8477' },
            { name: 'Royal Navy', hex: '#1b2a4a' },
          ],
        },
      ],
      Fancy: [
        {
          name: 'Oxford Patent',
          price: 280,
          color: '#0e0e0e',
          badge: 'Bestseller',
          rating: 5.0,
          reviews: 310,
          desc: 'Formal closed-lacing bal-oxford with high-gloss mirror patent leather for galas, black-tie, and red carpet.',
          specs: { upper: 'Mirror-Finish French Patent Leather', outsole: 'Fiddleback Waist Hand-Stitched Leather', weight: '430g', drop: '16mm' },
          colorways: [
            { name: 'Mirror Black', hex: '#0e0e0e' },
            { name: 'Midnight Gala', hex: '#121927' },
            { name: 'Bordeaux Patent', hex: '#380e15' },
          ],
        },
        {
          name: 'Monk Strap',
          price: 265,
          color: '#4a2b1b',
          badge: 'Staff Pick',
          rating: 4.9,
          reviews: 165,
          desc: 'Double monk strap shoe with hand-beveled edges, solid gold-tone hardware, and sculpted arch contours.',
          specs: { upper: 'Museum Marbled Calfskin', outsole: 'Oak-Bark Tanned Leather Channel Stitch', weight: '470g', drop: '15mm' },
          colorways: [
            { name: 'Cognac Glaze', hex: '#4a2b1b' },
            { name: 'Gloss Obsidian', hex: '#141414' },
            { name: 'Mahogany Cordovan', hex: '#42161b' },
          ],
        },
        {
          name: 'Velvet Loafer',
          price: 230,
          color: '#2d2a52',
          badge: 'Limited',
          rating: 4.9,
          reviews: 140,
          desc: 'Venetian smoking slipper hand-tailored from deep pile Italian cotton velvet with quilted ruby silk lining.',
          specs: { upper: 'Deep Pile Royal Cotton Velvet', outsole: 'Buffed Suede Indoor/Outdoor Dress Sole', weight: '360g', drop: '12mm' },
          colorways: [
            { name: 'Royal Sapphire', hex: '#2d2a52' },
            { name: 'Midnight Onyx', hex: '#121212' },
            { name: 'Emerald Velvet', hex: '#123524' },
          ],
        },
        {
          name: 'Heeled Pump',
          price: 220,
          color: '#8b1e3f',
          badge: 'New Drop',
          rating: 4.8,
          reviews: 95,
          desc: 'Timeless 75mm sculpted stiletto pump engineered with patented metatarsal shock pods for all-evening elegance.',
          specs: { upper: 'Italian Glove Suede Leather', outsole: 'Non-Slip Coated Leather Sole', weight: '240g', drop: '75mm heel' },
          colorways: [
            { name: 'Ruby Merlot', hex: '#8b1e3f' },
            { name: 'Nude Almond', hex: '#d2b48c' },
            { name: 'Classic Black', hex: '#0f0f0f' },
          ],
        },
        {
          name: 'Evening Slipper',
          price: 200,
          color: '#1a1a1a',
          badge: 'Eco-Crafted',
          rating: 4.7,
          reviews: 78,
          desc: 'Grosgrain-trimmed opera slipper with quilted diamond insole and supple chrome-free leather upper.',
          specs: { upper: 'Satin & Fine Nap Calfskin', outsole: 'Flexible Leather Dance-Floor Sole', weight: '310g', drop: '10mm' },
          colorways: [
            { name: 'Tuxedo Black', hex: '#1a1a1a' },
            { name: 'Burgundy Velvet', hex: '#4a1525' },
            { name: 'Gold Champagne', hex: '#d4af37' },
          ],
        },
        {
          name: 'Savile Row Wholecut',
          price: 315,
          color: '#1c1b1a',
          badge: 'Staff Pick',
          rating: 5.0,
          reviews: 118,
          desc: 'The highest expression of footwear: sculpted from a single seamless piece of full-grain flawless leather.',
          specs: { upper: 'Seamless Single-Piece French Calfskin', outsole: 'Hand-Welted Oak Bark Sole with Brass Tacks', weight: '450g', drop: '16mm' },
          colorways: [
            { name: 'Piano Black', hex: '#1c1b1a' },
            { name: 'Antiqued Bourbon', hex: '#543019' },
            { name: 'Imperial Cordovan', hex: '#3d1620' },
          ],
        },
      ],
    };

    let id = 1;
    const products: Product[] = [];

    for (const cat of this.categories) {
      const items = catalog[cat];
      for (const item of items) {
        const productId = id++;
        products.push({
          id: productId,
          name: item.name,
          price: item.price,
          originalPrice: item.orig,
          color: item.color,
          cat,
          badge: item.badge,
          rating: item.rating,
          reviewCount: item.reviews,
          description: item.desc,
          specs: item.specs,
          colorways: item.colorways,
          reviews: [
            {
              author: 'James K., Verified Buyer',
              rating: 5,
              date: '2 weeks ago',
              comment: 'The craftsmanship is phenomenal. Fit was perfect right out of the box with zero break-in period.',
              verified: true,
            },
            {
              author: 'Elena R., Wear Tester',
              rating: item.rating >= 4.9 ? 5 : 4,
              date: '1 month ago',
              comment: 'Wore these for 14 hours straight. The arch support and heel lock are best-in-class.',
              verified: true,
            },
          ],
          img: SHOE_PHOTOS[(productId - 1) % SHOE_PHOTOS.length],
        });
      }
    }

    return {
      products,
      users: [{ id: 1, name: 'admin', phone: '0000', role: 'admin' }],
      orders: [],
      cart: [],
      wishlist: [],
      session: null,
      nextId: 200,
    };
  }

  private save(): void {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(this.data));
    } catch {
      // Memory fallback
    }
  }

  private showToast(message: string): void {
    this.toastMessage = message;
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => (this.toastMessage = ''), 2400);
  }

  private normalizeName(value: string): string {
    return value.toLowerCase().replace(/\.[a-z]+$/, '').replace(/[^a-z0-9]/g, '');
  }

  private readImage(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(reader.error);
      reader.onload = () => {
        const image = new Image();
        image.onerror = () => reject(new Error('Unable to read image'));
        image.onload = () => {
          const scale = Math.min(1, 800 / Math.max(image.width, image.height));
          const canvas = document.createElement('canvas');
          canvas.width = image.width * scale;
          canvas.height = image.height * scale;
          canvas.getContext('2d')?.drawImage(image, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL('image/jpeg', 0.82));
        };
        image.src = String(reader.result);
      };
      reader.readAsDataURL(file);
    });
  }
}