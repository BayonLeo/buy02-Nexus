import { Component, OnInit } from '@angular/core';
import { forkJoin } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { OrderService } from '../../services/order.service';

interface ProductSummary {
  key: string;
  name: string;
  quantity: number;
  revenue: number;
  appearances: number;
}

@Component({
  selector: 'app-profile',
  template: `
    <div class="profile-page" *ngIf="!loading; else loadingTpl">
      <div class="hero card border-0 shadow-sm">
        <div class="card-body d-flex flex-column flex-md-row justify-content-between gap-3 align-items-md-center">
          <div>
            <div class="eyebrow">Account profile</div>
            <h2 class="mb-1">{{ displayName }}</h2>
            <div class="text-muted">{{ roleLabel }} - User ID: {{ currentUserId }}</div>
          </div>
          <div class="text-md-end">
            <div class="hero-total">{{ (role === 'SELLER' ? totalEarned : totalSpent) | currency }}</div>
            <div class="text-muted">{{ role === 'SELLER' ? 'Total earned' : 'Total spent' }}</div>
          </div>
        </div>
      </div>

      <div class="row g-3 mt-1">
        <div class="col-md-3">
          <div class="metric card h-100 border-0 shadow-sm">
            <div class="card-body">
              <div class="metric-label">Orders</div>
              <div class="metric-value">{{ userOrders.length }}</div>
              <div class="text-muted small">Orders linked to your account</div>
            </div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="metric card h-100 border-0 shadow-sm">
            <div class="card-body">
              <div class="metric-label">Products tracked</div>
              <div class="metric-value">{{ buyerTopProducts.length }}</div>
              <div class="text-muted small">Unique products in your orders</div>
            </div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="metric card h-100 border-0 shadow-sm">
            <div class="card-body">
              <div class="metric-label">Favorite product</div>
              <div class="metric-value small-text">{{ buyerTopProducts[0]?.name || 'No purchases yet' }}</div>
              <div class="text-muted small">Most purchased item by quantity</div>
            </div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="metric card h-100 border-0 shadow-sm">
            <div class="card-body">
              <div class="metric-label">Primary total</div>
              <div class="metric-value">{{ (role === 'SELLER' ? totalEarned : totalSpent) | currency }}</div>
              <div class="text-muted small">{{ role === 'SELLER' ? 'Revenue from your products' : 'Money spent on orders' }}</div>
            </div>
          </div>
        </div>
      </div>

      <div class="card border-0 shadow-sm mt-4">
        <div class="card-body">
          <div class="section-head d-flex flex-column flex-md-row justify-content-between gap-2 align-items-md-end">
            <div>
              <div class="eyebrow">Buyer summary</div>
              <h4 class="mb-1">Best products and most bought products</h4>
              <p class="text-muted mb-0">Products are calculated from your order history.</p>
            </div>
            <div class="text-muted small">Total spent: {{ totalSpent | currency }}</div>
          </div>

          <div class="row g-3 mt-2">
            <div class="col-lg-6">
              <div class="summary-panel">
                <h5 class="mb-3">Most bought products</h5>
                <ng-container *ngIf="buyerTopProducts.length; else emptyBuyerProducts">
                  <div class="summary-row" *ngFor="let product of buyerTopProducts">
                    <div>
                      <div class="summary-title">{{ product.name }}</div>
                      <div class="summary-subtitle">Purchased {{ product.appearances }} times</div>
                    </div>
                    <div class="summary-metric">{{ product.quantity }} units</div>
                  </div>
                </ng-container>
              </div>
            </div>

            <div class="col-lg-6">
              <div class="summary-panel">
                <h5 class="mb-3">Best products by spend</h5>
                <ng-container *ngIf="buyerBestProducts.length; else emptyBuyerProducts">
                  <div class="summary-row" *ngFor="let product of buyerBestProducts">
                    <div>
                      <div class="summary-title">{{ product.name }}</div>
                      <div class="summary-subtitle">Spent across orders</div>
                    </div>
                    <div class="summary-metric">{{ product.revenue | currency }}</div>
                  </div>
                </ng-container>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="card border-0 shadow-sm mt-4" *ngIf="role === 'SELLER'">
        <div class="card-body">
          <div class="section-head d-flex flex-column flex-md-row justify-content-between gap-2 align-items-md-end">
            <div>
              <div class="eyebrow">Seller summary</div>
              <h4 class="mb-1">Best-selling products and earnings</h4>
              <p class="text-muted mb-0">Seller metrics are calculated from the products inside matching orders.</p>
            </div>
            <div class="text-muted small">Total earned: {{ totalEarned | currency }}</div>
          </div>

          <div class="row g-3 mt-2">
            <div class="col-lg-6">
              <div class="summary-panel">
                <h5 class="mb-3">Best-selling products</h5>
                <ng-container *ngIf="sellerTopProducts.length; else emptySellerProducts">
                  <div class="summary-row" *ngFor="let product of sellerTopProducts">
                    <div>
                      <div class="summary-title">{{ product.name }}</div>
                      <div class="summary-subtitle">{{ product.appearances }} order items</div>
                    </div>
                    <div class="summary-metric">{{ product.quantity }} units</div>
                  </div>
                </ng-container>
              </div>
            </div>

            <div class="col-lg-6">
              <div class="summary-panel">
                <h5 class="mb-3">Best products by earnings</h5>
                <ng-container *ngIf="sellerBestProducts.length; else emptySellerProducts">
                  <div class="summary-row" *ngFor="let product of sellerBestProducts">
                    <div>
                      <div class="summary-title">{{ product.name }}</div>
                      <div class="summary-subtitle">Revenue from your product sales</div>
                    </div>
                    <div class="summary-metric">{{ product.revenue | currency }}</div>
                  </div>
                </ng-container>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <ng-template #loadingTpl>
      <div class="text-center py-5 text-muted">Loading profile...</div>
    </ng-template>

    <ng-template #emptyBuyerProducts>
      <div class="empty-state text-muted">No orders found yet.</div>
    </ng-template>

    <ng-template #emptySellerProducts>
      <div class="empty-state text-muted">No matching sales found yet.</div>
    </ng-template>
  `,
  styles: [`
    .profile-page { padding: 0.5rem 0 2rem; }
    .hero {
      background: linear-gradient(135deg, #0f172a 0%, #1e293b 55%, #334155 100%);
      color: #fff;
      border-radius: 1rem;
    }
    .eyebrow {
      text-transform: uppercase;
      letter-spacing: 0.12em;
      font-size: 0.75rem;
      color: #cbd5e1;
      margin-bottom: 0.35rem;
    }
    .hero-total {
      font-size: 2rem;
      font-weight: 700;
      line-height: 1;
    }
    .metric-label {
      font-size: 0.78rem;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: #64748b;
      margin-bottom: 0.35rem;
    }
    .metric-value {
      font-size: 1.55rem;
      font-weight: 700;
      line-height: 1.1;
      margin-bottom: 0.3rem;
    }
    .small-text { font-size: 1rem; }
    .summary-panel {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 0.9rem;
      padding: 1rem;
      min-height: 100%;
    }
    .summary-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 1rem;
      padding: 0.9rem 0;
      border-top: 1px solid #e2e8f0;
    }
    .summary-row:first-of-type { border-top: 0; padding-top: 0; }
    .summary-title { font-weight: 600; color: #0f172a; }
    .summary-subtitle { color: #64748b; font-size: 0.9rem; }
    .summary-metric { font-weight: 700; color: #0f172a; white-space: nowrap; }
    .empty-state {
      padding: 0.5rem 0 0;
      font-style: italic;
    }
  `]
})
export class ProfileComponent implements OnInit {
  loading = true;
  currentUserId = '';
  displayName = 'Profile';
  role = 'CLIENT';
  roleLabel = 'Client';
  userOrders: any[] = [];
  buyerTopProducts: ProductSummary[] = [];
  buyerBestProducts: ProductSummary[] = [];
  sellerTopProducts: ProductSummary[] = [];
  sellerBestProducts: ProductSummary[] = [];
  totalSpent = 0;
  totalEarned = 0;

  constructor(private auth: AuthService, private orderService: OrderService) {}

  ngOnInit(): void {
    const user = this.auth.getUserData();
    this.currentUserId = this.auth.getUserId() || '';
    this.displayName = user?.name || 'Profile';
    this.role = user?.role || 'CLIENT';
    this.roleLabel = this.role === 'SELLER' ? 'Seller' : 'Client';

    forkJoin({ orders: this.orderService.getOrders() }).subscribe({
      next: ({ orders }) => {
        this.userOrders = (orders || []).filter((order: any) => order.userId === this.currentUserId);
        this.totalSpent = this.userOrders.reduce((sum, order: any) => sum + this.toNumber(order.amount), 0);
        this.buyerTopProducts = this.buildBuyerSummaries(this.userOrders)
          .sort((left, right) => right.quantity - left.quantity || right.revenue - left.revenue)
          .slice(0, 5);
        this.buyerBestProducts = [...this.buildBuyerSummaries(this.userOrders)]
          .sort((left, right) => right.revenue - left.revenue || right.quantity - left.quantity)
          .slice(0, 5);

        const sellerProducts = this.buildSellerSummaries(orders || []);
        this.sellerTopProducts = sellerProducts
          .sort((left, right) => right.quantity - left.quantity || right.revenue - left.revenue)
          .slice(0, 5);
        this.sellerBestProducts = [...sellerProducts]
          .sort((left, right) => right.revenue - left.revenue || right.quantity - left.quantity)
          .slice(0, 5);
        this.totalEarned = sellerProducts.reduce((sum, product) => sum + product.revenue, 0);
        this.loading = false;
      },
      error: () => {
        this.userOrders = [];
        this.buyerTopProducts = [];
        this.buyerBestProducts = [];
        this.sellerTopProducts = [];
        this.sellerBestProducts = [];
        this.totalSpent = 0;
        this.totalEarned = 0;
        this.loading = false;
      }
    });
  }

  private buildBuyerSummaries(orders: any[]): ProductSummary[] {
    const summaries = new Map<string, ProductSummary>();

    for (const order of orders) {
      for (const item of order?.items || []) {
        const key = item.productId || item.productName;
        if (!key) continue;

        const quantity = this.toNumber(item.quantity);
        const revenue = this.toNumber(item.price) * quantity;
        const existing = summaries.get(key) || { key, name: item.productName || 'Unknown product', quantity: 0, revenue: 0, appearances: 0 };

        existing.name = item.productName || existing.name;
        existing.quantity += quantity;
        existing.revenue += revenue;
        existing.appearances += 1;
        summaries.set(key, existing);
      }
    }

    return Array.from(summaries.values());
  }

  private buildSellerSummaries(orders: any[]): ProductSummary[] {
    const summaries = new Map<string, ProductSummary>();

    for (const order of orders) {
      for (const item of order?.items || []) {
        if (item.sellerId !== this.currentUserId) continue;

        const key = item.productId || item.productName;
        if (!key) continue;

        const quantity = this.toNumber(item.quantity);
        const revenue = this.toNumber(item.price) * quantity;
        const existing = summaries.get(key) || { key, name: item.productName || 'Unknown product', quantity: 0, revenue: 0, appearances: 0 };

        existing.name = item.productName || existing.name;
        existing.quantity += quantity;
        existing.revenue += revenue;
        existing.appearances += 1;
        summaries.set(key, existing);
      }
    }

    return Array.from(summaries.values());
  }

  private toNumber(value: unknown): number {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
}