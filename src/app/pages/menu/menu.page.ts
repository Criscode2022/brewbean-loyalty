import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonList,
  IonItem,
  IonLabel,
  IonButton,
  IonBadge,
  IonIcon,
  IonSegment,
  IonSegmentButton,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonFab,
  IonFabButton,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { cart, cafe, leaf, gift, person, time } from 'ionicons/icons';
import { DatabaseService } from '../../services/database.service';
import { MenuItem, CartItem } from '../../models';

@Component({
  selector: 'app-menu',
  template: `
    <ion-header>
      <ion-toolbar color="coffee">
        <ion-title>☕ Brew & Bean</ion-title>
        <ion-button slot="end" routerLink="/cart">
          <ion-icon name="cart" slot="start"></ion-icon>
          <ion-badge *ngIf="cartCount > 0">{{ cartCount }}</ion-badge>
        </ion-button>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <!-- Category Filter -->
      <ion-segment [(ngModel)]="selectedCategory" (ionChange)="filterItems()">
        <ion-segment-button value="all">
          <ion-label>All</ion-label>
        </ion-segment-button>
        <ion-segment-button value="coffee">
          <ion-icon name="cafe"></ion-icon>
          <ion-label>Coffee</ion-label>
        </ion-segment-button>
        <ion-segment-button value="tea">
          <ion-icon name="leaf"></ion-icon>
          <ion-label>Tea</ion-label>
        </ion-segment-button>
        <ion-segment-button value="pastry">
          <ion-label>Pastries</ion-label>
        </ion-segment-button>
      </ion-segment>

      <!-- Menu Items -->
      <ion-list>
        <ion-card *ngFor="let item of filteredItems">
          <ion-card-header>
            <ion-card-title>{{ item.name }}</ion-card-title>
            <ion-badge color="success">${{ item.price }}</ion-badge>
          </ion-card-header>
          <ion-card-content>
            <p>{{ item.description }}</p>
            <ion-button expand="block" (click)="addToCart(item)">
              Add to Cart
            </ion-button>
          </ion-card-content>
        </ion-card>
      </ion-list>
    </ion-content>

    <!-- Bottom Nav -->
    <ion-fab vertical="bottom" horizontal="end" slot="fixed">
      <ion-fab-button routerLink="/rewards" color="secondary">
        <ion-icon name="gift"></ion-icon>
      </ion-fab-button>
    </ion-fab>
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
    IonBadge,
    IonIcon,
    IonSegment,
    IonSegmentButton,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonFab,
    IonFabButton,
  ],
})
export class MenuPage implements OnInit {
  private db = inject(DatabaseService);

  menuItems: MenuItem[] = [];
  filteredItems: MenuItem[] = [];
  selectedCategory = 'all';
  cart: CartItem[] = [];

  constructor() {
    addIcons({ cart, cafe, leaf, gift, person, time });
    this.loadMockData();
  }

  ngOnInit() {
    this.loadCart();
  }

  get cartCount(): number {
    return this.cart.reduce((sum, item) => sum + item.quantity, 0);
  }

  filterItems() {
    if (this.selectedCategory === 'all') {
      this.filteredItems = this.menuItems;
    } else {
      this.filteredItems = this.menuItems.filter(
        (item) => item.category === this.selectedCategory
      );
    }
  }

  addToCart(item: MenuItem) {
    const existing = this.cart.find(
      (ci) => ci.menuItem.id === item.id && Object.keys(ci.customizations).length === 0
    );

    if (existing) {
      existing.quantity++;
    } else {
      this.cart.push({
        menuItem: item,
        quantity: 1,
        customizations: {},
      });
    }

    localStorage.setItem('brewbean-cart', JSON.stringify(this.cart));
  }

  private loadCart() {
    const saved = localStorage.getItem('brewbean-cart');
    if (saved) {
      this.cart = JSON.parse(saved);
    }
  }

  private loadMockData() {
    this.menuItems = [
      {
        id: '1',
        name: 'Signature Latte',
        description: 'Espresso with steamed milk and vanilla',
        price: 5.50,
        category: 'coffee',
        customizations: [
          { name: 'Milk', options: ['Whole', 'Oat', 'Almond', 'Soy'] },
          { name: 'Size', options: ['Small', 'Medium', 'Large'] },
        ],
      },
      {
        id: '2',
        name: 'Cold Brew',
        description: '24-hour steeped cold coffee',
        price: 4.50,
        category: 'coffee',
      },
      {
        id: '3',
        name: 'Matcha Latte',
        description: 'Premium Japanese matcha with milk',
        price: 6.00,
        category: 'tea',
      },
      {
        id: '4',
        name: 'Almond Croissant',
        description: 'Buttery croissant with almond filling',
        price: 4.25,
        category: 'pastry',
      },
      {
        id: '5',
        name: 'Cappuccino',
        description: 'Equal parts espresso, steamed milk, and foam',
        price: 4.75,
        category: 'coffee',
      },
      {
        id: '6',
        name: 'Earl Grey',
        description: 'Classic bergamot-infused black tea',
        price: 3.50,
        category: 'tea',
      },
    ];
    this.filteredItems = this.menuItems;
  }
}
