// Coffee menu item
export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: 'coffee' | 'tea' | 'pastry' | 'merchandise';
  imageUrl?: string;
  customizations?: CustomizationOption[];
}

export interface CustomizationOption {
  name: string;
  options: string[];
  priceModifier?: number;
}

// Cart item
export interface CartItem {
  menuItem: MenuItem;
  quantity: number;
  customizations: Record<string, string>;
  specialInstructions?: string;
}

// Order
export interface Order {
  id: string;
  userId: string;
  items: CartItem[];
  status: 'pending' | 'preparing' | 'ready' | 'completed' | 'cancelled';
  total: number;
  pointsEarned: number;
  pickupTime: Date;
  location: string;
  createdAt: Date;
}

// User with loyalty points
export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  points: number;
  favoriteItems?: string[];
  createdAt: Date;
}

// Reward tier
export interface RewardTier {
  name: string;
  minPoints: number;
  discount: number;
  perks: string[];
}

// Reward redemption
export interface Reward {
  id: string;
  name: string;
  description: string;
  pointsCost: number;
  discountValue: number;
  validUntil: Date;
}
