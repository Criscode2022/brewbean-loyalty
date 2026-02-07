import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonIcon,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonInput,
  IonToast,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { qrCode, camera, checkmarkCircle, closeCircle } from 'ionicons/icons';
import { OrderService } from '../../services/order.service';

@Component({
  selector: 'app-qr-scan',
  template: `
    <ion-header>
      <ion-toolbar color="coffee">
        <ion-title>QR Scanner</ion-title>
        <ion-button slot="start" routerLink="/orders" fill="clear">
          Back
        </ion-button>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <!-- Scanner View -->
      <div class="scanner-container">
        <div class="camera-preview">
          <ion-icon name="camera" size="large"></ion-icon>
          <p>Camera preview would appear here</p>
          <p class="hint">Align QR code within frame</p>
        </div>

        <!-- Manual Entry -->
        <ion-card>
          <ion-card-header>
            <ion-card-title>Or enter code manually</ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <ion-input
              [(ngModel)]="manualCode"
              placeholder="Enter QR code (e.g., BREW-ABC123)"
              fill="outline"
            ></ion-input>
            <ion-button expand="block" (click)="validateCode()" [disabled]="!manualCode">
              Validate Code
            </ion-button>
          </ion-card-content>
        </ion-card>
      </div>

      <!-- Validation Result -->
      <ion-card *ngIf="validationResult" [color]="validationResult.valid ? 'success' : 'danger'">
        <ion-card-header>
          <ion-card-title>
            <ion-icon [name]="validationResult.valid ? 'checkmark-circle' : 'close-circle'"></ion-icon>
            {{ validationResult.valid ? 'Valid Order!' : 'Invalid Code' }}
          </ion-card-title>
        </ion-card-header>
        <ion-card-content *ngIf="validationResult.valid">
          <p><strong>Order ID:</strong> #{{ validationResult.order?.id?.slice(-6)?.toUpperCase() }}</p>
          <p><strong>Total:</strong> ${{ validationResult.order?.total }}</p>
          <p><strong>Status:</strong> {{ validationResult.order?.status }}</p>
          <ion-button expand="block" (click)="markAsPickedUp()">
            Mark as Picked Up
          </ion-button>
        </ion-card-content>
      </ion-card>
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
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButton,
    IonIcon,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonInput,
    IonToast,
  ],
  styles: [`
    .scanner-container {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }
    .camera-preview {
      height: 300px;
      background: var(--ion-color-dark);
      border-radius: 12px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      color: white;
    }
    .camera-preview ion-icon {
      font-size: 64px;
      margin-bottom: 16px;
    }
    .hint {
      font-size: 14px;
      opacity: 0.8;
      margin-top: 8px;
    }
  `],
})
export class QRScanPage {
  manualCode = '';
  validationResult: { valid: boolean; order?: any } | null = null;
  showToast = false;
  toastMessage = '';

  constructor(
    private orderService: OrderService,
    private router: Router
  ) {
    addIcons({ qrCode, camera, checkmarkCircle, closeCircle });
  }

  async validateCode() {
    if (!this.manualCode) return;

    // Mock validation - in real app would check database
    if (this.manualCode.startsWith('BREW-') || this.manualCode.startsWith('QR-')) {
      this.validationResult = {
        valid: true,
        order: {
          id: 'order-' + this.manualCode.slice(-6),
          total: 12.50,
          status: 'ready',
        },
      };
    } else {
      this.validationResult = { valid: false };
    }
  }

  markAsPickedUp() {
    this.toastMessage = 'Order marked as picked up!';
    this.showToast = true;
    
    setTimeout(() => {
      this.router.navigate(['/orders']);
    }, 1500);
  }
}
