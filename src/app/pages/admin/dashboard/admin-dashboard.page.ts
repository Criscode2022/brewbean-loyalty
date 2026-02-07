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
  IonSegment,
  IonSegmentButton,
  IonGrid,
  IonRow,
  IonCol,
  IonModal,
  IonSelect,
  IonSelectOption,
  IonInput,
  IonToast,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { 
  statsChart, 
  cafe, 
  people, 
  cash, 
  time, 
  checkmarkCircle,
  refresh,
  add,
  create,
  trash
} from 'ionicons/icons';
import { OrderService } from '../../services/order.service';
import { DatabaseService } from '../../services/database.service';
import { Order } from '../../models';

@Component({
  selector: 'app-admin-dashboard',
  template: `
    <ion-header>
      <ion-toolbar color="coffee">
        <ion-title>Admin Dashboard</ion-title>
        <ion-button slot="end" fill="clear" (click)="logout()">Logout</ion-button>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <!-- Tab Navigation -->
      <ion-segment [(ngModel)]="activeTab" (ionChange)="onTabChange()">
        <ion-segment-button value="overview">
          <ion-icon name="stats-chart"></ion-icon>
          <ion-label>Overview</ion-label>
        </ion-segment-button>
        <ion-segment-button value="orders">
          <ion-icon name="cafe"></ion-icon>
          <ion-label>Orders</ion-label>
        </ion-segment-button>
        <ion-segment-button value="menu">
          <ion-icon name="create"></ion-icon>
          <ion-label>Menu</ion-label>
        </ion-segment-button>
      </ion-segment>

      <!-- OVERVIEW TAB -->
      <div *ngIf="activeTab === 'overview'">
        <ion-grid>
          <ion-row>
            <ion-col size="6" sizeMd="3">
              <ion-card color="primary">
                <ion-card-content class="stat-card">
                  <ion-icon name="cash" size="large"></ion-icon>
                  <h2>${{ todayRevenue | number:'1.0-0' }}</h2>
                  <p>Today's Revenue</p>
                </ion-card-content>
              </ion-card>
            </ion-col>
            
            <ion-col size="6" sizeMd="3">
              <ion-card color="success">
                <ion-card-content class="stat-card">
                  <ion-icon name="cafe" size="large"></ion-icon>
                  <h2>{{ todayOrders }}</h2>
                  <p>Today's Orders</p>
                </ion-card-content>
              </ion-card>
            </ion-col>

            <ion-col size="6" sizeMd="3">
              <ion-card color="tertiary">
                <ion-card-content class="stat-card">
                  <ion-icon name="people" size="large"></ion-icon>
                  <h2>{{ activeCustomers }}</h2>
                  <p>Active Customers</p>
                </ion-card-content>
              </ion-card>
            </ion-col>

            <ion-col size="6" sizeMd="3">
              <ion-card color="warning">
                <ion-card-content class="stat-card">
                  <ion-icon name="time" size="large"></ion-icon>
                  <h2>{{ avgPrepTime }}m</h2>
                  <p>Avg Prep Time</p>
                </ion-card-content>
              </ion-card>
            </ion-col>
          </ion-row>
        </ion-grid>

        <ion-card>
          <ion-card-header>
            <ion-card-title>Popular Items Today</ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <ion-list>
              <ion-item *ngFor="let item of popularItems">
                <ion-label>{{ item.name }}</ion-label>
                <ion-badge slot="end" color="success">{{ item.count }} sold</ion-badge>
              </ion-item>
            </ion-list>
          </ion-card-content>
        </ion-card>
      </div>

      <!-- ORDERS TAB -->
      <div *ngIf="activeTab === 'orders'">
        <ion-list>
          <ion-list-header>
            <ion-label>Active Orders</ion-label>
            <ion-button fill="clear" (click)="refreshOrders()">
              <ion-icon name="refresh"></ion-icon>
            </ion-button>
          </ion-list-header>

          <ion-item *ngFor="let order of activeOrders">
            <ion-label>
              <h2>Order #{{ order.id.slice(-6).toUpperCase() }}</h2>
              <p>${{ order.total }} &bull; {{ order.items?.length || 0 }} items</p>
              <p>Pickup: {{ order.pickupTime | date:'shortTime' }}</p>
            </ion-label>
            
            <ion-badge slot="end" [color]="getStatusColor(order.status)">
              {{ order.status | titlecase }}
            </ion-badge>
            
            <ion-button 
              slot="end" 
              fill="clear" 
              *ngIf="order.status === 'pending'"
              (click)="updateStatus(order.id, 'preparing')"
            >
              Start
            </ion-button>
            
            <ion-button 
              slot="end" 
              fill="clear"
              color="success"
              *ngIf="order.status === 'preparing'"
              (click)="updateStatus(order.id, 'ready')"
            >
              Ready
            </ion-button>
          </ion-item>
        </ion-list>
      </div>

      <!-- MENU TAB -->
      <div *ngIf="activeTab === 'menu'">
        <ion-button expand="block" (click)="openAddItemModal()">
          <ion-icon name="add" slot="start"></ion-icon>
          Add Menu Item
        </ion-button>

        <ion-list>
          <ion-item *ngFor="let item of menuItems">
            <ion-label>
              <h2>{{ item.name }}</h2>
              <p>${{ item.price }} &bull; {{ item.category }}</p>
            </ion-label>
            
            <ion-badge slot="end" [color]="item.available ? 'success' : 'danger'">
              {{ item.available ? 'Available' : 'Sold Out' }}
            </ion-badge>
            
            <ion-button slot="end" fill="clear" (click)="toggleAvailability(item)">
              <ion-icon name="create"></ion-icon>
            </ion-button>
          </ion-item>
        </ion-list>
      </div>

      <!-- Add Item Modal -->
      <ion-modal [isOpen]="showAddModal" (didDismiss)="showAddModal = false">
        <ng-template>
          <ion-header>
            <ion-toolbar>
              <ion-title>Add Menu Item</ion-title>
              <ion-button slot="end" fill="clear" (click)="showAddModal = false">Cancel</ion-button>
            </ion-toolbar>
          </ion-header>
          
          <ion-content class="ion-padding">
            <ion-item>
              <ion-label position="stacked">Name</ion-label>
              <ion-input [(ngModel)]="newItem.name" placeholder="Item name"></ion-input>
            </ion-item>
            
            <ion-item>
              <ion-label position="stacked">Description</ion-label>
              <ion-input [(ngModel)]="newItem.description" placeholder="Description"></ion-input>
            </ion-item>
            
            <ion-item>
              <ion-label position="stacked">Price</ion-label>
              <ion-input [(ngModel)]="newItem.price" type="number" placeholder="0.00"></ion-input>
            </ion-item>
            
            <ion-item>
              <ion-label>Category</ion-label>
              <ion-select [(ngModel)]="newItem.category">
                <ion-select-option value="coffee">Coffee</ion-select-option>
                <ion-select-option value="tea">Tea</ion-select-option>
                <ion-select-option value="pastry">Pastry</ion-select-option>
                <ion-select-option value="merchandise">Merchandise</ion-select-option>
              </ion-select>
            </ion-item>
            
            <ion-button expand="block" (click)="addMenuItem()" [disabled]="!newItem.name || !newItem.price">
              Add Item
            </ion-button>
          </ion-content>
        </ng-template>
      </ion-modal>
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
    IonSegment,
    IonSegmentButton,
    IonGrid,
    IonRow,
    IonCol,
    IonModal,
    IonSelect,
    IonSelectOption,
    IonInput,
    IonToast,
  ],
  styles: [`
    .stat-card {
      text-align: center;
      padding: 20px;
    }
    .stat-card h2 {
      font-size: 2rem;
      margin: 10px 0;
    }
    .stat-card p {
      margin: 0;
      opacity: 0.9;
    }
  `],
})
export class AdminDashboardPage implements OnInit {
  private orderService = inject(OrderService);
  private db = inject(DatabaseService);
  private router = inject(Router);

  activeTab = 'overview';
  
  // Stats
  todayRevenue = 1352.50;
  todayOrders = 156;
  activeCustomers = 89;
  avgPrepTime = 8;
  
  popularItems = [
    { name: 'Signature Latte', count: 47 },
    { name: 'Cold Brew', count: 38 },
    { name: 'Almond Croissant', count: 29 },
  ];

  // Orders
  activeOrders: any[] = [
    { id: 'order-1', total: 12.50, status: 'pending', items: [], pickupTime: new Date() },
    { id: 'order-2', total: 8.75, status: 'preparing', items: [], pickupTime: new Date() },
    { id: 'order-3', total: 15.00, status: 'ready', items: [], pickupTime: new Date() },
  ];

  // Menu
  menuItems: any[] = [
    { id: '1', name: 'Signature Latte', price: 5.50, category: 'coffee', available: true },
    { id: '2', name: 'Cold Brew', price: 4.50, category: 'coffee', available: true },
    { id: '3', name: 'Matcha Latte', price: 6.00, category: 'tea', available: false },
  ];

  // Modal
  showAddModal = false;
  newItem: any = { name: '', description: '', price: '', category: 'coffee' };
  
  showToast = false;
  toastMessage = '';

  constructor() {
    addIcons({ 
      statsChart, cafe, people, cash, time, checkmarkCircle,
      refresh, add, create, trash 
    });
  }

  ngOnInit() {}

  onTabChange() {}

  getStatusColor(status: string): string {
    const colors: Record<string, string> = {
      pending: 'warning',
      preparing: 'primary',
      ready: 'success',
      completed: 'medium',
    };
    return colors[status] || 'medium';
  }

  async updateStatus(orderId: string, status: string) {
    const order = this.activeOrders.find(o => o.id === orderId);
    if (order) {
      order.status = status;
      this.toastMessage = `Order #${orderId.slice(-6).toUpperCase()} marked as ${status}`;
      this.showToast = true;
    }
  }

  refreshOrders() {
    this.toastMessage = 'Orders refreshed';
    this.showToast = true;
  }

  openAddItemModal() {
    this.showAddModal = true;
  }

  addMenuItem() {
    this.menuItems.push({
      id: `new-${Date.now()}`,
      ...this.newItem,
      price: parseFloat(this.newItem.price),
      available: true,
    });
    this.newItem = { name: '', description: '', price: '', category: 'coffee' };
    this.showAddModal = false;
    this.toastMessage = 'Menu item added';
    this.showToast = true;
  }

  toggleAvailability(item: any) {
    item.available = !item.available;
    this.toastMessage = `${item.name} is now ${item.available ? 'available' : 'sold out'}`;
    this.showToast = true;
  }

  logout() {
    this.router.navigate(['/login']);
  }
}
