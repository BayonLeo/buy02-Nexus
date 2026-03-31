import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ProductListComponent } from './product-list.component';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { FormsModule } from '@angular/forms';
import { ProductService } from '../../services/product.service';
import { MediaService } from '../../services/media.service';
import { Router } from '@angular/router';
import { of } from 'rxjs';

// Mock du Router
class MockRouter {
  navigate(path: string[]) {
    // Mock implementation
    return Promise.resolve(true);
  }
}

class MockProductService {
    listAll() {
        return of([
            { id: '1', name: 'Product 1', userId: 'user1' },
            { id: '2', name: 'Product 2', userId: 'user2' }
        ]);
    }
}

class MockMediaService {
  byProduct(pid: string) {
      if (pid === '1') {
        return of([{ imagePath: 'img1.jpg' }]); // s'aligner sur l'assertion du test
      }
      return of([]);
    }
}

describe('ProductListComponent', () => {
    let component: ProductListComponent;
    let fixture: ComponentFixture<ProductListComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [ProductListComponent],
            imports: [FormsModule, HttpClientTestingModule],
            providers: [
                { provide: ProductService, useClass: MockProductService },
                { provide: MediaService, useClass: MockMediaService },
            ]
    }).compileComponents();

        fixture = TestBed.createComponent(ProductListComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
      });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should load products and their media on init', () => {
        const p1 = component.products.find(p => p.id === '1');
       expect(component.products.length).toBe(2);
       expect(p1).toBeDefined();
       expect(p1.images).toEqual([{ imagePath:  'img1.jpg' }])
    });

    it('should filter products on search', () => {
        component.onSearch('product');
        expect(component.filteredProducts.length).toBe(2);
        component.onSearch('1');
        expect(component.filteredProducts.length).toBe(1);
        expect(component.filteredProducts[0].name).toBe('Product 1');
    });

    it ('should reset filter when search term is empty', () => {
        component.onSearch('1');
        expect(component.filteredProducts.length).toBe(1);
        component.onSearch('');
        expect(component.filteredProducts.length).toBe(2);
    });
});