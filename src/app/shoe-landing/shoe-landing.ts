import { CommonModule } from '@angular/common';
import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';

type Page = 'home' | 'shop' | 'cart' | 'checkout' | 'login' | 'account' | 'admin' | 'done';
type Category = 'Sport / Runner' | 'Heavy Duty' | 'Classic' | 'Leather' | 'Everyday' | 'Fancy';

interface Product {
  id: number;
  name: string;
  price: number;
  color: string;
  cat: Category;
  img?: string;
}

interface User {
  id: number;
  name: string;
  phone: string;
  role: 'admin' | 'user';
  loc?: string;
  zip?: string;
}

interface CartItem {
  pid: number;
  size: string;
  qty: number;
}

interface OrderItem extends CartItem {
  name: string;
  price: number;
}

interface Order {
  id: number;
  uid: number;
  name: string;
  phone: string;
  loc: string;
  zip: string;
  total: number;
  date: string;
  items: OrderItem[];
}

interface StoreData {
  products: Product[];
  users: User[];
  orders: Order[];
  cart: CartItem[];
  session: number | null;
  nextId: number;
}

interface CartLine extends CartItem {
  idx: number;
  product: Product;
}

const STORE_KEY = 'soleworks_db_v1';
const PHOTO_MIGRATION_KEY = 'soleworks_unsplash_photos_v2';
const BROKEN_SHOE_PHOTOS = ['photo-1560769629-975ec94e6a6f', 'photo-1495555967617-5546e0f79994'];
const SHOE_PHOTOS = [
  'photo-1542291026-7eec264c27ff',
  'photo-1600185365483-26d7a4cc7519',
  'photo-1608231387042-66d1773070a5',
  'photo-1549298916-b41d501d3772',
  'photo-1552346154-21d32810aba3',
  'photo-1600269452121-4f2416e55c28',
  'photo-1460353581641-37baddab0fa2',
  'photo-1539185441755-769473a23570',
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
  readonly sizes = [38, 39, 40, 41, 42, 43, 44, 45];
  readonly data: StoreData = this.seed();

  view: Page = 'home';
  adminTab: 'products' | 'orders' | 'users' = 'products';
  query = '';
  minPrice = '';
  maxPrice = '';
  sort = 'feat';
  selectedCategories = new Set<Category>();
  selectedSize: string | null = null;
  selectedProduct: Product | null = null;
  photoProductId: number | null = null;
  toastMessage = '';
  private toastTimer?: ReturnType<typeof setTimeout>;
  private afterLogin: Page = 'account';

  loginName = '';
  loginPhone = '';
  shipping = { name: '', phone: '', loc: '', zip: '' };
  productDraft = { name: '', price: 0, cat: 'Sport / Runner' as Category, color: '#444444' };
  formError = '';

  ngOnInit(): void {
    try {
      const stored = localStorage.getItem(STORE_KEY);
      if (stored) Object.assign(this.data, JSON.parse(stored) as StoreData);
      if (!localStorage.getItem(PHOTO_MIGRATION_KEY)) {
        for (const product of this.data.products) {
          if (product.id >= 1 && product.id <= 30 && (!product.img || BROKEN_SHOE_PHOTOS.some((photo) => product.img?.includes(photo)))) {
            product.img = SHOE_PHOTOS[(product.id - 1) % SHOE_PHOTOS.length];
          }
        }
        localStorage.setItem(STORE_KEY, JSON.stringify(this.data));
        localStorage.setItem(PHOTO_MIGRATION_KEY, '1');
      }
    } catch {
      // Keep the seeded in-memory store when browser storage is unavailable.
    }
  }

  get user(): User | undefined {
    return this.data.users.find((candidate) => candidate.id === this.data.session);
  }

  get cartCount(): number {
    return this.data.cart.reduce((count, item) => count + item.qty, 0);
  }

  get featuredProduct(): Product | undefined {
    return this.data.products.find((product) => product.img);
  }

  get filteredProducts(): Product[] {
    const query = this.query.trim().toLowerCase();
    const products = this.data.products.filter((product) =>
      (!this.selectedCategories.size || this.selectedCategories.has(product.cat)) &&
      (!query || product.name.toLowerCase().includes(query)) &&
      (this.minPrice === '' || product.price >= Number(this.minPrice)) &&
      (this.maxPrice === '' || product.price <= Number(this.maxPrice)),
    );
    if (this.sort === 'lo') products.sort((a, b) => a.price - b.price);
    if (this.sort === 'hi') products.sort((a, b) => b.price - a.price);
    return products;
  }

  get cartLines(): CartLine[] {
    return this.data.cart.flatMap((item, idx) => {
      const product = this.data.products.find((candidate) => candidate.id === item.pid);
      return product ? [{ ...item, idx, product }] : [];
    });
  }

  get cartTotal(): number {
    return this.cartLines.reduce((sum, line) => sum + line.product.price * line.qty, 0);
  }

  get userOrders(): Order[] {
    return this.data.orders.filter((order) => order.uid === this.user?.id);
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

  go(page: Page, after?: Page): void {
    if (after) this.afterLogin = after;
    if (page === 'checkout' && this.user) {
      this.shipping = {
        name: this.user.name,
        phone: this.user.phone,
        loc: this.user.loc ?? '',
        zip: this.user.zip ?? '',
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
    this.selectedCategories.clear();
  }

  toggleCategory(category: Category, checked: boolean): void {
    if (checked) this.selectedCategories.add(category);
    else this.selectedCategories.delete(category);
  }

  openProduct(product: Product): void {
    this.selectedProduct = product;
    this.selectedSize = null;
    this.formError = '';
    this.productDialog?.nativeElement.showModal();
  }

  closeOnBackdrop(event: MouseEvent): void {
    if (event.target === this.productDialog?.nativeElement) this.productDialog.nativeElement.close();
  }

  addToCart(product: Product): void {
    if (!this.selectedSize) {
      this.formError = 'Please choose a size.';
      return;
    }
    const existing = this.data.cart.find((item) => item.pid === product.id && item.size === this.selectedSize);
    if (existing) existing.qty += 1;
    else this.data.cart.push({ pid: product.id, size: this.selectedSize, qty: 1 });
    this.save();
    this.productDialog?.nativeElement.close();
    this.showToast('Added to bag');
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
    this.go(destination);
  }

  logout(): void {
    this.data.session = null;
    this.save();
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
    this.data.orders.push({
      id: this.data.nextId++,
      uid: user.id,
      name: this.shipping.name.trim(),
      phone: this.shipping.phone.trim(),
      loc: this.shipping.loc.trim(),
      zip,
      total: this.cartTotal,
      date: new Date().toISOString(),
      items: this.cartLines.map((line) => ({ pid: line.pid, name: line.product.name, size: line.size, qty: line.qty, price: line.product.price })),
    });
    this.data.cart = [];
    this.save();
    this.go('done');
  }

  addProduct(): void {
    const name = this.productDraft.name.trim();
    if (!name || this.productDraft.price <= 0) return;
    this.data.products.push({
      id: this.data.nextId++,
      name,
      price: Number(this.productDraft.price),
      cat: this.productDraft.cat,
      color: this.productDraft.color,
    });
    this.productDraft = { name: '', price: 0, cat: 'Sport / Runner', color: '#444444' };
    this.save();
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
    }
  }

  deleteProduct(product: Product): void {
    if (!window.confirm('Delete this shoe?')) return;
    this.data.products = this.data.products.filter((candidate) => candidate.id !== product.id);
    this.data.cart = this.data.cart.filter((item) => item.pid !== product.id);
    this.save();
  }

  async bulkUpload(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files ?? []);
    let added = 0;
    for (const file of files) {
      const normalizedName = this.normalizeName(file.name);
      const product = this.data.products.find((candidate) => normalizedName.includes(this.normalizeName(candidate.name)))
        ?? this.data.products.find((candidate) => !candidate.img);
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

  private seed(): StoreData {
    const catalog: Record<Category, Array<[string, number, string]>> = {
      'Sport / Runner': [['Stride 01', 120, '#d9531e'], ['Tempo Run', 135, '#1f4e79'], ['Sprint Lite', 110, '#222222'], ['Marathon V', 150, '#5f7f2a'], ['Track Pace', 125, '#8a8a85']],
      'Heavy Duty': [['Site Boot', 165, '#8a6a3b'], ['Forge 6"', 185, '#2b2b2b'], ['Ridge Steel Toe', 199, '#6b4a2a'], ['Haul Pro', 175, '#4a4a3f'], ['Quarry', 210, '#3a2d22']],
      Classic: [['Court 70', 85, '#e8e6df'], ['Lowtop Canvas', 65, '#1f3a5f'], ['Hightop Original', 75, '#a3262a'], ['Plain Sneaker', 80, '#f1f1ee'], ['Varsity', 90, '#2f5d46']],
      Leather: [['Derby Tan', 210, '#9a6b3c'], ['Chelsea Black', 240, '#161616'], ['Loafer Brown', 195, '#5a3a22'], ['Brogue Oxblood', 260, '#5b1f24'], ['Chukka Suede', 180, '#8c7556']],
      Everyday: [['Walker One', 70, '#7d8b8f'], ['Slip-On Easy', 60, '#b8ae9c'], ['Commute', 95, '#33415a'], ['Daily Knit', 88, '#c9c5bb'], ['Trail Town', 105, '#556b4d']],
      Fancy: [['Oxford Patent', 280, '#0e0e0e'], ['Monk Strap', 265, '#4a2b1b'], ['Velvet Loafer', 230, '#2d2a52'], ['Heeled Pump', 220, '#8b1e3f'], ['Evening Slipper', 200, '#1a1a1a']],
    };
    let id = 1;
    return {
      products: this.categories.flatMap((cat) => catalog[cat].map(([name, price, color]) => {
        const productId = id++;
        return { id: productId, name, price, color, cat, img: SHOE_PHOTOS[(productId - 1) % SHOE_PHOTOS.length] };
      })),
      users: [{ id: 1, name: 'admin', phone: '0000', role: 'admin' }],
      orders: [],
      cart: [],
      session: null,
      nextId: 100,
    };
  }

  private save(): void {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(this.data));
    } catch {
      // The store remains usable in memory when storage is full or disabled.
    }
  }

  private showToast(message: string): void {
    this.toastMessage = message;
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => this.toastMessage = '', 1800);
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
          const scale = Math.min(1, 700 / Math.max(image.width, image.height));
          const canvas = document.createElement('canvas');
          canvas.width = image.width * scale;
          canvas.height = image.height * scale;
          canvas.getContext('2d')?.drawImage(image, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL('image/jpeg', 0.75));
        };
        image.src = String(reader.result);
      };
      reader.readAsDataURL(file);
    });
  }
}