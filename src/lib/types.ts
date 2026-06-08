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
  items: string; // items as comma separated string
  totalPrice: string;
  timestamp: string;
  status: 'new' | 'preparing' | 'done';
  rowIndex?: number;
}

export interface Feedback {
  id: string;
  rating: number;
  comment: string;
  timestamp: string;
}

export type View = 'MENU' | 'CART' | 'FEEDBACK' | 'GALLERY' | 'ADMIN_LOGIN' | 'ADMIN_DASHBOARD';
