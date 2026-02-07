import { Injectable } from '@angular/core';
import { DatabaseService } from './database.service';
import { LoyaltyService } from './loyalty.service';
import { PaymentService } from './payment.service';
import { Order, CartItem } from '../models';

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  constructor(
    private db: DatabaseService,
    private loyaltyService: LoyaltyService,
    private paymentService: PaymentService
  ) {}

  // Calculate order total
  calculateTotal(cart: CartItem[]): number {
    return cart.reduce((sum, item) => {
      const itemTotal = item.menuItem.price * item.quantity;
      return sum + itemTotal;
    }, 0);
  }

  // Generate QR code for pickup
  generateQRCode(orderId: string): string {
    return `BREW-${orderId}-${Date.now().toString(36).toUpperCase()}`;
  }

  // Create new order
  async createOrder(
    userId: string, 
    cart: CartItem[], 
    pickupTime: Date,
    location: string
  ): Promise<Order> {
    const total = this.calculateTotal(cart);
    const pointsEarned = this.loyaltyService.calculatePoints(total);
    const qrCode = this.generateQRCode(userId);

    const order = await this.db.insert<any>('orders', {
      user_id: userId,
      items: JSON.stringify(cart),
      total,
      points_earned: pointsEarned,
      status: 'pending',
      pickup_time: pickupTime.toISOString(),
      location,
      qr_code: qrCode,
    });

    // Add points to user
    await this.loyaltyService.addPoints(userId, pointsEarned);

    return this.mapRowToOrder(order);
  }

  // Process payment and create order
  async checkout(
    userId: string,
    cart: CartItem[],
    pickupTime: Date,
    location: string,
    paymentMethodId: string
  ): Promise<{ order: Order; success: boolean; error?: string }> {
    try {
      // Create payment intent
      const paymentIntentId = await this.paymentService.createPaymentIntent(
        this.calculateTotal(cart)
      );

      if (!paymentIntentId) {
        return { order: null as any, success: false, error: 'Payment setup failed' };
      }

      // Process payment
      const paymentResult = await this.paymentService.processPayment(paymentIntentId);

      if (!paymentResult.success) {
        return { order: null as any, success: false, error: paymentResult.error };
      }

      // Create order after successful payment
      const order = await this.createOrder(userId, cart, pickupTime, location);

      return { order, success: true };
    } catch (error: any) {
      return { order: null as any, success: false, error: error.message };
    }
  }

  // Get user's orders
  async getUserOrders(userId: string): Promise<Order[]> {
    const rows = await this.db.select<any>('orders', {
      filters: { user_id: `eq.${userId}` },
      order: 'created_at.desc',
    });
    return rows.map(this.mapRowToOrder);
  }

  // Get order by ID
  async getOrderById(orderId: string): Promise<Order | undefined> {
    const rows = await this.db.select<any>('orders', {
      filters: { id: `eq.${orderId}` },
    });
    return rows.length > 0 ? this.mapRowToOrder(rows[0]) : undefined;
  }

  // Update order status (admin)
  async updateOrderStatus(orderId: string, status: Order['status']): Promise<void> {
    await this.db.update<any>('orders', orderId, { status });
  }

  // Validate QR code for pickup
  async validateQRCode(qrCode: string): Promise<Order | undefined> {
    const rows = await this.db.select<any>('orders', {
      filters: { qr_code: `eq.${qrCode}` },
    });
    
    if (rows.length === 0) return undefined;
    
    const order = this.mapRowToOrder(rows[0]);
    
    // Mark as completed if validated
    if (order.status === 'ready') {
      await this.updateOrderStatus(order.id, 'completed');
      order.status = 'completed';
    }
    
    return order;
  }

  private mapRowToOrder(row: any): Order {
    return {
      id: row.id,
      userId: row.user_id,
      items: JSON.parse(row.items),
      status: row.status,
      total: parseFloat(row.total),
      pointsEarned: row.points_earned,
      pickupTime: new Date(row.pickup_time),
      location: row.location,
      createdAt: new Date(row.created_at),
    };
  }
}
