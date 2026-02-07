-- BrewBean Loyalty App - Database Schema
-- Run this in your Neon SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Menu items table
CREATE TABLE menu_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    category TEXT CHECK (category IN ('coffee', 'tea', 'pastry', 'merchandise')),
    image_url TEXT,
    available BOOLEAN DEFAULT true,
    customizations JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User profiles (extends neon_auth.user)
CREATE TABLE user_profiles (
    id UUID PRIMARY KEY REFERENCES neon_auth.user(id),
    phone TEXT,
    points INTEGER DEFAULT 0,
    tier TEXT DEFAULT 'Bronze' CHECK (tier IN ('Bronze', 'Silver', 'Gold', 'Platinum')),
    favorite_location TEXT,
    notification_preferences JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Orders table
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES neon_auth.user(id),
    items JSONB NOT NULL,
    total DECIMAL(10,2) NOT NULL,
    points_earned INTEGER DEFAULT 0,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'preparing', 'ready', 'completed', 'cancelled')),
    pickup_time TIMESTAMP,
    location TEXT,
    qr_code TEXT,
    payment_intent_id TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Rewards catalog
CREATE TABLE rewards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    points_cost INTEGER NOT NULL,
    discount_value DECIMAL(10,2),
    valid_from TIMESTAMP,
    valid_until TIMESTAMP,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User reward redemptions
CREATE TABLE user_rewards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES neon_auth.user(id),
    reward_id UUID REFERENCES rewards(id),
    redeemed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    used_at TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_menu_items_category ON menu_items(category);
CREATE INDEX idx_menu_items_available ON menu_items(available);
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX idx_user_profiles_points ON user_profiles(points);

-- Sample menu data
INSERT INTO menu_items (name, description, price, category, available, customizations) VALUES
('Signature Latte', 'Espresso with steamed milk and vanilla', 5.50, 'coffee', true, '[{"name": "Milk", "options": ["Whole", "Oat", "Almond", "Soy"]}, {"name": "Size", "options": ["Small", "Medium", "Large"]}]'),
('Cold Brew', '24-hour steeped cold coffee', 4.50, 'coffee', true, '[{"name": "Size", "options": ["Regular", "Large"]}]'),
('Matcha Latte', 'Premium Japanese matcha with milk', 6.00, 'tea', true, '[{"name": "Milk", "options": ["Whole", "Oat", "Almond"]}]'),
('Earl Grey', 'Classic bergamot-infused black tea', 3.50, 'tea', true, '[]'),
('Almond Croissant', 'Buttery croissant with almond filling', 4.25, 'pastry', true, '[]'),
('Blueberry Muffin', 'Fresh-baked with local blueberries', 3.75, 'pastry', true, '[]'),
('Espresso', 'Double shot of our house blend', 3.00, 'coffee', true, '[]'),
('Cappuccino', 'Equal parts espresso, steamed milk, and foam', 4.75, 'coffee', true, '[{"name": "Size", "options": ["Small", "Medium", "Large"]}]');

-- Sample rewards
INSERT INTO rewards (name, description, points_cost, discount_value, active) VALUES
('$5 Off', 'Get $5 off your next order', 500, 5.00, true),
('Free Drink', 'Any drink, any size', 1000, 0.00, true),
('Free Pastry', 'With any drink purchase', 750, 0.00, true),
('20% Off', 'One-time discount', 1500, 0.00, true);

-- Enable Row Level Security (RLS)
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_rewards ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Menu items are viewable by everyone" ON menu_items
    FOR SELECT USING (true);

CREATE POLICY "Users can view own profile" ON user_profiles
    FOR SELECT USING (id = auth.uid());

CREATE POLICY "Users can update own profile" ON user_profiles
    FOR UPDATE USING (id = auth.uid());

CREATE POLICY "Users can view own orders" ON orders
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create own orders" ON orders
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Rewards are viewable by everyone" ON rewards
    FOR SELECT USING (true);

CREATE POLICY "Users can view own rewards" ON user_rewards
    FOR SELECT USING (user_id = auth.uid());

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_menu_items_updated_at BEFORE UPDATE ON menu_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
