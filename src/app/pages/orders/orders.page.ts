import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonList,
  IonItem,
  IonLabel,
  IonBadge,
  IonButton,
  IonIcon,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonFab,
  IonFabButton,
  IonToast,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { qrCode, refresh, checkmarkCircle, time, cafe } from 'ionicons/icons';
import { OrderService } from '../../services/order.service';
import { Order } from '../../models';

@Component({
  selector: 'app-orders',
  template: `
    <ion-header>
      <ion-toolbar color="coffee">
        <ion-title>My Orders</ion-title>
        <ion-button slot="end" fill="clear" (click)="loadOrders()">
          <ion-icon name="refresh"></ion-icon>
        </ion-button>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <!-- No Orders -->
      <div *ngIf="orders.length === 0" class="empty-orders">
        <ion-icon name="cafe" size="large"></ion-icon>
        <h2>No orders yet</h2>
        <p>Your order history will appear here</p>
        <ion-button routerLink="/menu" expand="block">Order Now</ion-button>
      </div>

      <!-- Orders List -->
      <ion-list *ngIf="orders.length > 0">
        <ion-card *ngFor="let order of orders" [class.ready]="order.status === 'ready'">
          <ion-card-header>
            <ion-card-title>
              Order #{{ order.id.slice(-6).toUpperCase() }}
              <ion-badge [color]="getStatusColor(order.status)">
                {{ order.status | titlecase }}
              </ion-badge>
            </ion-card-title>
          </ion-card-header>
          
          <ion-card-content>
            <div class="order-details">
              <p><strong>Total: ${{ order.total | number:'1.2-2' }}</strong></p>
              <p>Items: {{ getItemCount(order) }}</p>
              <p>Pickup: {{ order.location | titlecase }}</p>
              <p *ngIf="order.pickupTime">Time: {{ order.pickupTime | date:'shortTime' }}</p>
              <p class="points">+{{ order.pointsEarned }} points earned</p>
            </div>

            <!-- QR Code Display -->
            <div class="qr-section" *ngIf="order.status !== 'completed'">
              <div class="qr-code">
                <ion-icon name="qr-code" size="large"></ion-icon>
                <p class="qr-text">{{ order.qrCode || 'QR-' + order.id.slice(-8).toUpperCase() }}</p>
              </div>
              <p class="qr-hint">Show this QR code at pickup</p>
            </div>

            <ion-button 
              *ngIf="order.status === 'completed'"
              expand="block" 
              fill="clear"
              (click)="reorder(order)"
            >
              <ion-icon name="refresh" slot="start"></ion-icon>
              Reorder
            </ion-button>
          </ion-card-content>
        </ion-card>
      </ion-list>
    </ion-content>

    <!-- QR Scanner FAB -->
    <ion-fab vertical="bottom" horizontal="end" slot="fixed">
      <ion-fab-button routerLink="/scan" color="secondary">
        <ion-icon name="qr-code"></ion-icon>
      </ion-fab-button>
    </ion-fab>

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
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonList,
    IonItem,
    IonLabel,
    IonBadge,
    IonButton,
    IonIcon,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonFab,
    IonFabButton,
    IonToast,
  ],
  styles: [`
    .empty-orders {
      text-align: center;
      padding: 40px 20px;
    }
    .empty-orders ion-icon {
      font-size: 64px;
      color: var(--ion-color-medium);
      margin-bottom: 16px;
    }
    ion-card.ready {
      border: 2px solid var(--ion-color-success);
    }
    ion-card-title {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .order-details p {
      margin: 4px 0;
    }
    .points {
      color: var(--ion-color-success);
      font-weight: bold;
    }
    .qr-section {
      margin-top: 16px;
      padding: 16px;
      background: var(--ion-color-light);
      border-radius: 8px;
      text-align: center;
    }
    .qr-code {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
    }
    .qr-text {
      font-family: monospace;
      font-size: 14px;
      letter-spacing: 2px;
    }
    .qr-hint {
      margin-top: 8px;
      font-size: 12px;
      color: var(--ion-color-medium);
    }
  `],
})
export class OrdersPage implements OnInit {
  private orderService = inject(OrderService);
  private router = inject(Router);

  orders: Order[] = [];
  showToast = false;
  toastMessage = '';

  constructor() {
    addIcons({ qrCode, refresh, checkmarkCircle, time, cafe });
  }

  ngOnInit() {
    this.loadOrders();
  }

  async loadOrders() {
    // Mock orders for demo
    this.orders = [
      {
        id: 'order-1',
        userId: 'user-1',
        items: [],
        status: 'ready',
        total: 12.50,
        pointsEarned: 125,
        pickupTime: new Date(Date.now() + 30 * 60000),
        location: 'downtown',
        createdAt: new Date(),
        qrCode: 'BREW-ABC123',
      },
      {
        id: 'order-2',
        userId: 'user-1',
        items: [],
        status: 'completed',
        total: 8.75,
        pointsEarned: 88,
        pickupTime: new Date(Date.now() - 86400000),
        location: 'pearl',
        createdAt: new Date(Date.now() - 86400000),
      },
    ];
  }

  getStatusColor(status: string): string {
    const colors: Record<string, string> = {
      pending: 'warning',
      preparing: 'primary',
      ready: 'success',
      completed: 'medium',
      cancelled: 'danger',
    };
    return colors[status] || 'medium';
  }

  getItemCount(order: Order): number {
    return order.items.reduce((sum, item) => sum + item.quantity, 0);
  }

  reorder(order: Order) {
    // Add items back to cart
    localStorage.setItem('brewbean-cart', JSON.stringify(order.items));
    this.toastMessage = 'Items added to cart';
    this.showToast = true;
    
    setTimeout(() => {
      this.router.navigate(['/cart']);
    }, 1000);
  }
}
