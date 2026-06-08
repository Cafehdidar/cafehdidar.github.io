export type Category = 'HOT' | 'COLD' | 'DESSERT';

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: Category;
  emoji: string;
  image?: string; // base64
}

export interface OrderItem extends MenuItem {
  quantity: number;
}

export interface Order {
  id: string;
  tableNumber: string;
  items: OrderItem[];
  totalPrice: number;
  timestamp: string;
  status: 'NEW' | 'PREPARING' | 'DELIVERED';
}

export interface Feedback {
  id: string;
  rating: number;
  comment: string;
  timestamp: string;
}

export interface LoyaltyAccount {
  phoneNumber: string;
  points: number;
}

export type View = 'MENU' | 'CART' | 'FEEDBACK' | 'LOYALTY' | 'GALLERY' | 'ADMIN_LOGIN' | 'ADMIN_DASHBOARD';
