import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
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
  IonProgressBar,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { gift, star, trophy } from 'ionicons/icons';
import { LoyaltyService } from '../../services/loyalty.service';

@Component({
  selector: 'app-rewards',
  template: `
    <ion-header>
      <ion-toolbar color="coffee">
        <ion-title>My Rewards</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <!-- Points Card -->
      <ion-card color="primary">
        <ion-card-header>
          <ion-card-title>
            <ion-icon name="star"></ion-icon>
            {{ userPoints }} Points
          </ion-card-title>
        </ion-card-header>
        <ion-card-content>
          <p>{{ currentTier.name }} Member</p>
          <ion-progress-bar [value]="tierProgress"></ion-progress-bar>
          <p *ngIf="nextTier">
            {{ pointsToNext }} points to {{ nextTier.name }}
          </p>
        </ion-card-content>
      </ion-card>

      <!-- Tier Benefits -->
      <ion-list>
        <ion-list-header>
          <ion-label>Tier Benefits</ion-label>
        </ion-list-header>

        <ion-item *ngFor="let tier of tiers">
          <ion-icon name="trophy" slot="start" [color]="tier.name === currentTier.name ? 'primary' : 'medium'"></ion-icon>
          <ion-label>
            <h2>{{ tier.name }}</h2>
            <p>{{ tier.minPoints }}+ points</p>
            <p>{{ tier.discount }}% off &bull; {{ tier.perks.join(', ') }}</p>
          </ion-label>
          <ion-badge slot="end" *ngIf="tier.name === currentTier.name" color="primary">Current</ion-badge>
        </ion-item>
      </ion-list>

      <!-- Available Rewards -->
      <ion-list *ngIf="availableRewards.length > 0">
        <ion-list-header>
          <ion-label>Redeem Rewards</ion-label>
        </ion-list-header>

        <ion-item *ngFor="let reward of availableRewards">
          <ion-icon name="gift" slot="start" color="secondary"></ion-icon>
          <ion-label>
            <h2>{{ reward.name }}</h2>
            <p>{{ reward.description }}</p>
          </ion-label>
          <ion-button slot="end" size="small" (click)="redeem(reward.id)">
            {{ reward.pointsCost }} pts
          </ion-button>
        </ion-item>
      </ion-list>
    </ion-content>
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
    IonButton,
    IonIcon,
    IonBadge,
    IonProgressBar,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
  ],
})
export class RewardsPage {
  userPoints = 750; // Mock data
  currentTier: any;
  nextTier: any | null = null;
  pointsToNext = 0;
  tierProgress = 0;
  tiers: any[] = [];
  availableRewards: any[] = [];

  constructor(private loyaltyService: LoyaltyService) {
    addIcons({ gift, star, trophy });
    this.loadRewards();
  }

  private loadRewards() {
    this.tiers = this.loyaltyService.getRewardTiers();
    this.currentTier = this.loyaltyService.getUserTier(this.userPoints);
    this.nextTier = this.loyaltyService.getNextTier(this.userPoints);
    this.pointsToNext = this.loyaltyService.getPointsToNextTier(this.userPoints);
    
    // Calculate progress to next tier
    if (this.nextTier) {
      const prevTierPoints = this.currentTier.minPoints;
      const nextTierPoints = this.nextTier.minPoints;
      this.tierProgress = (this.userPoints - prevTierPoints) / (nextTierPoints - prevTierPoints);
    } else {
      this.tierProgress = 1;
    }

    // Mock available rewards
    this.availableRewards = [
      { id: '1', name: '$5 Off', description: 'Get $5 off your next order', pointsCost: 500 },
      { id: '2', name: 'Free Drink', description: 'Any drink, any size', pointsCost: 1000 },
      { id: '3', name: 'Free Pastry', description: 'With any drink purchase', pointsCost: 750 },
    ].filter(r => r.pointsCost <= this.userPoints);
  }

  async redeem(rewardId: string) {
    // Implement redemption
    console.log('Redeeming reward:', rewardId);
  }
}
