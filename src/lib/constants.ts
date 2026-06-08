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
  { id: 'c1', name: 'موهیتو نعناع', description: 'تازه و خنک', price: 180000, category: 'COLD', emoji: '🍹' },
  { id: 'c2', name: 'لیموناد زنجبیل', description: 'تند و ترش', price: 150000, category: 'COLD', emoji: '🍋' },
  { id: 'c3', name: 'فراپوچینو', description: 'خامه و قهوه سرد', price: 190000, category: 'COLD', emoji: '🧋' },
  { id: 'c4', name: 'آیس لته', description: 'لاته روی یخ', price: 160000, category: 'COLD', emoji: '☕' },
  { id: 'c5', name: 'اسموتی توت‌فرنگی', description: 'میوه تازه', price: 170000, category: 'COLD', emoji: '🍓' },
  { id: 'c6', name: 'شیک شکلاتی', description: 'غنی و خامه‌ای', price: 200000, category: 'COLD', emoji: '🍫' },
  { id: 'c7', name: 'آیس آمریکانو', description: 'سبک روی یخ', price: 140000, category: 'COLD', emoji: '☕' },
  
  // DESSERT
  { id: 'd1', name: 'براونی شکلاتی', description: 'گرم با بستنی وانیل', price: 180000, category: 'DESSERT', emoji: '🍫' },
  { id: 'd2', name: 'چیزکیک توت‌فرنگی', description: 'خامه‌ای و ترش', price: 200000, category: 'DESSERT', emoji: '🍰' },
  { id: 'd3', name: 'تیرامیسو', description: 'دسر ایتالیایی', price: 220000, category: 'DESSERT', emoji: '🍮' },
  { id: 'd4', name: 'پاناکوتا وانیل', description: 'نرم و لطیف', price: 190000, category: 'DESSERT', emoji: '🍮' },
  { id: 'd5', name: 'مافین بلوبری', description: 'تازه از فر', price: 130000, category: 'DESSERT', emoji: '🧁' },
  { id: 'd6', name: 'وافل عسل', description: 'ترد با عسل طبیعی', price: 170000, category: 'DESSERT', emoji: ' waffle' },
];

export const STORAGE_KEYS = {
  MENU: 'cafe_menu',
  ORDERS: 'cafe_orders',
  FEEDBACK: 'cafe_feedback',
  LOYALTY: 'cafe_loyalty',
  GALLERY: 'cafe_gallery',
};

export const ADMIN_PASSWORD = 'didar1234';
export const BASE_URL = 'https://rezaxm80-max.github.io/cafe-didar';
