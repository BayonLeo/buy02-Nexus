import { Component, OnInit } from '@angular/core';
import { ProductService } from '../../services/product.service';
import { MediaService } from '../../services/media.service';
import { CartService } from '../../services/cart.service';
import { AuthService } from '../../services/auth.service';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Component({
  selector: 'app-product-list',
  template: `
    <div class="d-flex justify-content-between align-items-center mb-3">
      <h3 class="mb-0">Products</h3>
      <input class="form-control search-input" type="search" placeholder="Search products..." (input)="onSearch($any($event.target).value)" />
    </div>
    <div class="row g-3">
      <div class="col-md-6" *ngFor="let p of filteredProducts">
        <div class="card product-card h-100">
          <div *ngIf="p.images && p.images.length" class="card-img-top text-center" style="padding:8px;">
            <img [src]="p.images[0].imagePath" alt="" style="max-width:100%;max-height:240px;object-fit:contain" />
          </div>
          <div class="card-body d-flex flex-column">
            <h5 class="card-title">{{p.name}} <span class="badge bg-primary">{{p.price | currency}}</span></h5>
            <div class="small-id">id: {{p.id || p._id}}</div>
            <p class="card-text product-description flex-grow-1">{{p.description}}</p>
            <div class="mt-auto pt-3">
              <button *ngIf="isLoggedIn$ | async" class="btn btn-outline-primary w-100" (click)="addToCart(p)">
                Add to Cart
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class ProductListComponent implements OnInit {
  products: any[] = [];
  filteredProducts: any[] = [];
  isLoggedIn$: Observable<boolean>;
  isClient$: Observable<boolean>;

  constructor(
    private productService: ProductService, 
    private media: MediaService,
    private cartService: CartService,
    private authService: AuthService
  ) {
    this.isLoggedIn$ = this.authService.isLoggedIn$;
    this.isClient$ = this.authService.currentUser$.pipe(
      map(u => u?.role === 'CLIENT')
    );
  }
  ngOnInit() {
    this.productService.listAll().subscribe({
      next: (data: any[]) => {
        this.products = data;
        this.filteredProducts = data;
        // Fetch media for each product (best-effort)
        for (const p of this.products) {
          const pid = p.id || p._id;
          this.media.byProduct(pid).subscribe({
            next: (meds: any[]) => { p.images = meds; },
            error: () => { p.images = []; }
          });
        }
      },
      error: () => {
        this.products = [];
        this.filteredProducts = [];
      }
    });
  }

  onSearch(term: string) {
    const t = (term || '').toLowerCase().trim();
    if (!t) { this.filteredProducts = this.products; return; }
    this.filteredProducts = this.products.filter(p => (p.name || '').toLowerCase().includes(t) || (p.description || '').toLowerCase().includes(t));
  }

  addToCart(product: any) {
    this.cartService.addToCart(product);
  }
}
