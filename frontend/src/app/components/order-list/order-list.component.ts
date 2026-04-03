import { OrderService } from './../../services/order.service';
import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-order-list',
  template: `
  <div class="container">
  <h2>Order List</h2>

  <table class="table">
    <thead>
      <tr>
        <th>Date</th>
        <th>Amount</th>
        <th>Status</th>
        <th>Actions</th>
      </tr>
    </thead>
    <tbody>
      <tr *ngFor="let order of orders">
        <td>{{ order.createdAt | date:'short' }}</td>
        <td>{{ order.amount | currency }}</td>
        <td>
          <span [ngClass]="{
            'badge-warning': order.orderStatus === 'PENDING',
            'badge-danger': order.orderStatus === 'CANCELED',
            'badge-success': order.orderStatus === 'COMPLETED'
          }" class="badge">
            {{ order.orderStatus }}
          </span>
        </td>
        <td>
          <button (click)="onRedo(order.id)" class="btn btn-sm btn-outline-primary">🔄 Refaire</button>

          <button *ngIf="order.orderStatus === 'PENDING'"
                  (click)="onCancel(order.id)"
                  class="btn btn-sm btn-outline-warning">❌ Cancel</button>

          <button (click)="onDelete(order.id)" class="btn btn-sm btn-link text-danger">Delete</button>
        </td>
      </tr>
    </tbody>
  </table>
</div>
  `
})
export class OrderListComponent implements OnInit {
  orders: any[] = [];

  constructor(private orderService: OrderService) {}

  ngOnInit() {
    if (localStorage.getItem('token')) { // check logged in
        this.loadOrders();
     }
  }

  loadOrders() {
    this.orderService.getOrders().subscribe({
      next: (data: any[]) => {
        this.orders = data;
      },
      error: (err) => {
        this.orders = [];
        this.errorMessage = err.error?.error || 'Failed to load orders';
      }
    });
  }

  onCancel(orderId: string) {
    this.orderService.cancelOrder(orderId).subscribe({
      next: () => {
        this.loadOrders();
      },
      error: (err) => {
        this.errorMessage = err.error?.error || 'Failed to cancel order';
      }
    });
  }

  onRedo(orderId: string) {
    this.orderService.redoOrder(orderId).subscribe({
      next: () => {
        this.loadOrders();
      },
      error: (err) => {
        this.errorMessage = err.error?.error || 'Failed to redo order';
      }
    });
  }

  onDelete(orderId: string) {
    this.orderService.deleteOrder(orderId).subscribe({
      next: () => {
        this.loadOrders();
      },
      error: (err) => {
        this.errorMessage = err.error?.error || 'Failed to delete order';
      }
    });
  }

   errorMessage = '';
}