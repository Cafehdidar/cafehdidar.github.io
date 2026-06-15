import { MenuItem } from './types';

export const DEFAULT_MENU: MenuItem[] = [
  // HOT BAR
  { id: 'h1', name: 'اسپرسو ویژه', description: 'دانه‌های خاص روست شده', price: 120000, category: 'HOT', emoji: '☕' },
  { id: 'h2', name: 'کاپوچینو خامه‌ای', description: 'کف لطیف کرمی', price: 140000, category: 'HOT', emoji: '☕' },
  { id: 'h3', name: 'لاته کارامل', description: 'شیر و کارامل طلایی', price: 150000, category: 'HOT', emoji: '☕' },
  { id: 'h4', name: 'موکا شکلاتی', description: 'قهوه با شکلات تلخ', price: 160000, category: 'HOT', emoji: '☕' },
  { id: 'h5', name: 'آمریکانو', description: 'سبک و خوش‌طعم', price: 110000, category: 'HOT', emoji: '☕' },
  { id: 'h6', name: 'ماکیاتو عسل', description: 'قهوه و عسل طبیعی', price: 170000, category: 'HOT', emoji: '☕' },
  { id: 'h7', name: 'چای ماسالا', description: 'ادویه هندی اصیل', price: 90000, category: 'HOT', emoji: '🍵' },
  { id: 'h8', name: 'شیر عسل دارچین', description: 'گرم و آرامش‌بخش', price: 100000, category: 'HOT', emoji: '🍵' },
  
  // COLD BAR
  
  // DESSERT
];

export const STORAGE_KEYS = {
  MENU: 'cafe_menu',
  ORDERS: 'cafe_orders',
  FEEDBACK: 'cafe_feedback',
  LOYALTY: 'cafe_loyalty',
  GALLERY: 'cafe_gallery',
};

export const ADMIN_PASSWORD = 'didar1234a';
export const BASE_URL = 'https://rezaxm80-max.github.io/cafe-didar';
