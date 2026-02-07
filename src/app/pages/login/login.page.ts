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
} from '@ionic/angular/standalone';

@Component({
  selector: 'app-login',
  template: `
    <ion-content class="ion-padding">
      <div class="login-container">
        <h1>☕ Brew & Bean</h1>
        <p>Your daily dose of happiness</p>

        <ion-list>
          <ion-item>
            <ion-label position="floating">Email</ion-label>
            <input type="email" />
          </ion-item>

          <ion-item>
            <ion-label position="floating">Password</ion-label>
            <input type="password" />
          </ion-item>
        </ion-list>

        <ion-button expand="block" routerLink="/menu">Sign In</ion-button>
        <ion-button expand="block" fill="clear">Create Account</ion-button>
      </div>
    </ion-content>
  `,
  standalone: true,
  imports: [CommonModule, IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem, IonLabel, IonButton],
})
export class LoginPage {}
