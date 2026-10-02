import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ShoeLandingComponent } from './shoe-landing';

describe('ShoeLandingComponent', () => {
  let component: ShoeLandingComponent;
  let fixture: ComponentFixture<ShoeLandingComponent>;

  beforeEach(async () => {
    localStorage.removeItem('soleworks_db_v1');
    localStorage.removeItem('soleworks_db_v2');
    localStorage.removeItem('soleworks_photos_v3');
    await TestBed.configureTestingModule({
      imports: [ShoeLandingComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ShoeLandingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('renders the six catalog ranges and seeds thirty-six products', () => {
    const page = fixture.nativeElement as HTMLElement;
    expect(page.querySelectorAll('.category-card')).toHaveLength(6);
    expect(component.data.products).toHaveLength(36);
    expect(component.data.products.every((product) => product.img?.startsWith('https://images.unsplash.com/'))).toBe(true);
  });

  it('filters products by category, search, and price', () => {
    component.selectedCategories.add('Leather');
    component.query = 'derby';
    component.minPrice = '200';
    expect(component.filteredProducts.map((product) => product.name)).toEqual(['Derby Tan']);
  });

  it('calculates the bag count and subtotal', () => {
    component.data.cart.push({ pid: 1, size: '42', qty: 2 });
    expect(component.cartCount).toBe(2);
    expect(component.cartTotal).toBe(240);
  });

  it('applies promotional discount code COOKED20', () => {
    component.data.cart.push({ pid: 1, size: '42', qty: 2 }); // $240 subtotal
    component.couponInput = 'COOKED20';
    component.applyCoupon();
    expect(component.appliedCoupon?.code).toBe('COOKED20');
    expect(component.couponDiscount).toBe(48); // 20% of 240
    expect(component.cartTotal).toBe(192); // 240 - 48
  });

  it('toggles shoe in wishlist', () => {
    component.toggleWishlist(1);
    expect(component.isWishlisted(1)).toBe(true);
    expect(component.wishlistCount).toBe(1);
    component.toggleWishlist(1);
    expect(component.isWishlisted(1)).toBe(false);
  });
});
