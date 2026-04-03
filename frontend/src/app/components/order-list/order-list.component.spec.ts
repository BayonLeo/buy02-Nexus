import { ComponentFixture, TestBed } from '@angular/core/testing';
import { OrderListComponent } from './order-list.component';
import { FormsModule } from '@angular/forms';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { OrderService } from '../../services/order.service';
import { AuthService } from '../../services/auth.service';
import { throwError } from 'rxjs';
import { of } from 'rxjs';

class MockOrderService {
    getOrders() {
        return of([
            { id: '1', product: 'Product A', status: 'PENDING' },
            { id: '2', product: 'Product B', status: 'PENDING' }
        ]);
    }
}

class MockAuthService {
    getUserId() {
        return 'user1';
    }
}

describe('OrderListComponent', () => {
    let component: OrderListComponent;
    let fixture: ComponentFixture<OrderListComponent>;
    let orderService: OrderService;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [OrderListComponent],
            imports: [HttpClientTestingModule],
            providers: [
                { provide: OrderService, useClass: MockOrderService },
                { provide: AuthService, useClass: MockAuthService }
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(OrderListComponent);
        component = fixture.componentInstance;
        orderService = TestBed.inject(OrderService);
      });

    afterEach(() => {
      localStorage.clear();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should load orders on init', () => {
        localStorage.setItem('token', 'fake-jwt-token');
        spyOn(orderService, 'getOrders').and.callThrough();
        component.ngOnInit();
        expect(orderService.getOrders).toHaveBeenCalled();
        expect(component.orders.length).toBe(2);
    });

    it('should not load orders if not logged in', () => {
        localStorage.removeItem('token');
        spyOn(orderService, 'getOrders').and.callThrough();
        component.ngOnInit();
        expect(orderService.getOrders).not.toHaveBeenCalled();
        expect(component.orders.length).toBe(0);
    });
});