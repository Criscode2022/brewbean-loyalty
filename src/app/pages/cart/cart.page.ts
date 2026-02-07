import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonList,
  IonItem,
  IonLabel,
  IonButton,
  IonIcon,
  IonBadge,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonInput,
  IonSelect,
  IonSelectOption,
  IonDatetime,
  IonToast,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { trash, add, remove, card, cafe } from 'ionicons/icons';
import { OrderService } from '../../services/order.service';
import { PaymentService } from '../../services/payment.service';
import { CartItem } from '../../models';

@Component({
  selector: 'app-cart',
  template: `
    <ion-header>
      <ion-toolbar color="coffee">
        <ion-title>Your Cart</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <!-- Empty Cart -->
      <div *ngIf="cart.length === 0" class="empty-cart">
        <ion-icon name="cafe" size="large"></ion-icon>
        <h2>Your cart is empty</h2>
        <p>Add some delicious coffee to get started</p>
        <ion-button routerLink="/menu" expand="block">Browse Menu</ion-button>
      </div>

      <!-- Cart Items -->
      <ion-list *ngIf="cart.length > 0">
        <ion-item *ngFor="let item of cart; let i = index">
          <ion-label>
            <h2>{{ item.menuItem.name }}</h2>
            <p>${{ item.menuItem.price }} x {{ item.quantity }}</p>
            <p *ngIf="item.specialInstructions" class="instructions">
              Note: {{ item.specialInstructions }}
            </p>
          </ion-label>
          <div slot="end" class="item-actions">
            <ion-button fill="clear" size="small" (click)="updateQuantity(i, -1)">
              <ion-icon name="remove"></ion-icon>
            </ion-button>
            <span class="quantity">{{ item.quantity }}</span>
            <ion-button fill="clear" size="small" (click)="updateQuantity(i, 1)">
              <ion-icon name="add"></ion-icon>
            </ion-button>
            <ion-button fill="clear" color="danger" (click)="removeItem(i)">
              <ion-icon name="trash"></ion-icon>
            </ion-button>
          </div>
        </ion-item>
      </ion-list>

      <!-- Order Summary -->
      <ion-card *ngIf="cart.length > 0">
        <ion-card-header>
          <ion-card-title>Order Summary</ion-card-title>
        </ion-card-header>
        <ion-card-content>
          <div class="summary-row">
            <span>Subtotal:</span>
            <span>${{ subtotal | number:'1.2-2' }}</span>
          </div>
          <div class="summary-row">
            <span>Tax (8%):</span>
            <span>${{ tax | number:'1.2-2' }}</span>
          </div>
          <div class="summary-row total">
            <span>Total:</span>
            <span>${{ total | number:'1.2-2' }}</span>
          </div>
          <div class="points-earned">
            <ion-badge color="success">+{{ pointsEarned }} points</ion-badge>
          </div>
        </ion-card-content>
      </ion-card>

      <!-- Pickup Details -->
      <ion-card *ngIf="cart.length > 0">
        <ion-card-header>
          <ion-card-title>Pickup Details</ion-card-title>
        </ion-card-header>
        <ion-card-content>
          <ion-item>
            <ion-label>Location</ion-label>
            <ion-select [(ngModel)]="selectedLocation">
              <ion-select-option value="downtown">Downtown</ion-select-option>
              <ion-select-option value="pearl">Pearl District</ion-select-option>
              <ion-select-option value="alberta">Alberta Arts</ion-select-option>
            </ion-select>
          </ion-item>

          <ion-item>
            <ion-label>Pickup Time</ion-label>
            <ion-datetime 
              [(ngModel)]="pickupTime"
              presentation="time"
              [min]="minPickupTime">
            </ion-datetime>
          </ion-item>
        </ion-card-content>
      </ion-card>

      <!-- Checkout Button -->
      <ion-button 
        *ngIf="cart.length > 0"
        expand="block" 
        size="large"
        (click)="checkout()"
        [disabled]="isProcessing"
      >
        <ion-icon name="card" slot="start"></ion-icon>
        {{ isProcessing ? 'Processing...' : 'Place Order' }}
      </ion-button>
    </ion-content>

    <ion-toast
      [isOpen]="showToast"
      [message]="toastMessage"
      duration="3000"
      (didDismiss)="showToast = false"
    ></ion-toast>
  `,
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonList,
    IonItem,
    IonLabel,
    IonButton,
    IonIcon,
    IonBadge,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonInput,
    IonSelect,
    IonSelectOption,
    IonDatetime,
    IonToast,
  ],
  styles: [`
    .empty-cart {
      text-align: center;
      padding: 40px 20px;
    }
    .empty-cart ion-icon {
      font-size: 64px;
      color: var(--ion-color-medium);
      margin-bottom: 16px;
    }
    .item-actions {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .quantity {
      min-width: 24px;
      text-align: center;
      font-weight: bold;
    }
    .instructions {
      font-size: 12px;
      color: var(--ion-color-medium);
      font-style: italic;
    }
    .summary-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px solid var(--ion-color-light);
    }
    .summary-row.total {
      font-weight: bold;
      font-size: 18px;
      border-bottom: none;
      margin-top: 8px;
    }
    .points-earned {
      margin-top: 16px;
      text-align: center;
    }
  `],
})
export class CartPage implements OnInit {
  private orderService = inject(OrderService);
  private paymentService = inject(PaymentService);
  private router = inject(Router);

  cart: CartItem[] = [];
  selectedLocation = 'downtown';
  pickupTime = new Date(Date.now() + 15 * 60000).toISOString();
  minPickupTime = new Date(Date.now() + 10 * 60000).toISOString();
  isProcessing = false;
  showToast = false;
  toastMessage = '';

  constructor() {
    addIcons({ trash, add, remove, card, cafe });
  }

  ngOnInit() {
    this.loadCart();
  }

  get subtotal(): number {
    return this.cart.reduce((sum, item) => 
      sum + (item.menuItem.price * item.quantity), 0
    );
  }

  get tax(): number {
    return this.subtotal * 0.08;
  }

  get total(): number {
    return this.subtotal + this.tax;
  }

  get pointsEarned(): number {
    return Math.floor(this.total * 10);
  }

  loadCart() {
    const saved = localStorage.getItem('brewbean-cart');
    this.cart = saved ? JSON.parse(saved) : [];
  }

  saveCart() {
    localStorage.setItem('brewbean-cart', JSON.stringify(this.cart));
  }

  updateQuantity(index: number, delta: number) {
    this.cart[index].quantity += delta;
    if (this.cart[index].quantity <= 0) {
      this.cart.splice(index, 1);
    }
    this.saveCart();
  }

  removeItem(index: number) {
    this.cart.splice(index, 1);
    this.saveCart();
  }

  async checkout() {
    if (this.cart.length === 0) return;

    this.isProcessing = true;

    try {
      // Simulate user ID - in real app would come from auth
      const userId = 'demo-user';
      
      const result = await this.orderService.checkout(
        userId,
        this.cart,
        new Date(this.pickupTime),
        this.selectedLocation,
        'demo-payment-method'
      );

      if (result.success) {
        // Clear cart
        localStorage.removeItem('brewbean-cart');
        this.cart = [];
        
        this.toastMessage = 'Order placed successfully!';
        this.showToast = true;
        
        // Navigate to orders page
        setTimeout(() => {
          this.router.navigate(['/orders']);
        }, 1500);
      } else {
        this.toastMessage = result.error || 'Payment failed';
        this.showToast = true;
      }
    } catch (error: any) {
      this.toastMessage = error.message || 'An error occurred';
      this.showToast = true;
    } finally {
      this.isProcessing = false;
    }
  }
}
