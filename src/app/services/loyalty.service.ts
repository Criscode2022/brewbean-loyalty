import { Injectable } from '@angular/core';
import { DatabaseService } from './database.service';
import { User, Reward } from '../models';

@Injectable({
  providedIn: 'root'
})
export class LoyaltyService {
  private readonly POINTS_PER_DOLLAR = 10;
  private readonly REWARD_TIERS = [
    { name: 'Bronze', minPoints: 0, discount: 0, perks: ['Earn points'] },
    { name: 'Silver', minPoints: 500, discount: 5, perks: ['5% off', 'Early access to new drinks'] },
    { name: 'Gold', minPoints: 1000, discount: 10, perks: ['10% off', 'Free birthday drink', 'Priority pickup'] },
    { name: 'Platinum', minPoints: 2500, discount: 15, perks: ['15% off', 'Free monthly drink', 'VIP events'] },
  ];

  constructor(private db: DatabaseService) {}

  // Calculate points earned for an order
  calculatePoints(orderTotal: number): number {
    return Math.floor(orderTotal * this.POINTS_PER_DOLLAR);
  }

  // Get user's current tier
  getUserTier(points: number) {
    for (let i = this.REWARD_TIERS.length - 1; i >= 0; i--) {
      if (points >= this.REWARD_TIERS[i].minPoints) {
        return this.REWARD_TIERS[i];
      }
    }
    return this.REWARD_TIERS[0];
  }

  // Get next tier info
  getNextTier(points: number) {
    const currentTier = this.getUserTier(points);
    const currentIndex = this.REWARD_TIERS.findIndex(t => t.name === currentTier.name);
    return currentIndex < this.REWARD_TIERS.length - 1 
      ? this.REWARD_TIERS[currentIndex + 1] 
      : null;
  }

  // Points needed for next tier
  getPointsToNextTier(points: number): number {
    const nextTier = this.getNextTier(points);
    return nextTier ? nextTier.minPoints - points : 0;
  }

  // Add points to user
  async addPoints(userId: string, points: number): Promise<User> {
    const user = await this.db.selectOne<User>('users', {
      filters: { id: `eq.${userId}` }
    });
    
    if (!user) throw new Error('User not found');
    
    return this.db.update<User>('users', userId, {
      points: user.points + points
    });
  }

  // Redeem points for reward
  async redeemReward(userId: string, rewardId: string): Promise<void> {
    const [user, reward] = await Promise.all([
      this.db.selectOne<User>('users', { filters: { id: `eq.${userId}` } }),
      this.db.selectOne<Reward>('rewards', { filters: { id: `eq.${rewardId}` } })
    ]);

    if (!user) throw new Error('User not found');
    if (!reward) throw new Error('Reward not found');
    if (user.points < reward.pointsCost) {
      throw new Error('Insufficient points');
    }

    // Deduct points and create redemption record
    await Promise.all([
      this.db.update<User>('users', userId, {
        points: user.points - reward.pointsCost
      }),
      this.db.insert('user_rewards', {
        user_id: userId,
        reward_id: rewardId,
        redeemed_at: new Date().toISOString()
      })
    ]);
  }

  // Get available rewards for user
  async getAvailableRewards(userPoints: number): Promise<Reward[]> {
    const rewards = await this.db.select<Reward>('rewards', {
      filters: { points_cost: `lte.${userPoints}` },
      order: 'points_cost.desc'
    });
    return rewards;
  }

  getRewardTiers() {
    return this.REWARD_TIERS;
  }
}
