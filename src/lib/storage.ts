import { STORAGE_KEYS, DEFAULT_MENU } from './constants';
// @ts-ignore
import { MenuItem, Order, Feedback, LoyaltyAccount } from './types';

export const getStoredMenu = (): MenuItem[] => {
  if (typeof window === 'undefined') return DEFAULT_MENU;
  const stored = localStorage.getItem(STORAGE_KEYS.MENU);
  return stored ? JSON.parse(stored) : DEFAULT_MENU;
};

export const saveMenu = (menu: MenuItem[]) => {
  localStorage.setItem(STORAGE_KEYS.MENU, JSON.stringify(menu));
};

export const getStoredOrders = (): Order[] => {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(STORAGE_KEYS.ORDERS);
  return stored ? JSON.parse(stored) : [];
};

export const saveOrder = (order: Order) => {
  const orders = getStoredOrders();
  localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify([order, ...orders]));
};

export const updateOrderStatus = (orderId: string, status: Order['status']) => {
  const orders = getStoredOrders();
  const updated = orders.map(o => o.id === orderId ? { ...o, status } : o);
  localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(updated));
};

export const getStoredFeedback = (): Feedback[] => {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(STORAGE_KEYS.FEEDBACK);
  return stored ? JSON.parse(stored) : [];
};

export const saveFeedback = (feedback: Feedback) => {
  const feedbacks = getStoredFeedback();
  localStorage.setItem(STORAGE_KEYS.FEEDBACK, JSON.stringify([feedback, ...feedbacks]));
};

export const getStoredLoyalty = (): Record<string, number> => {
  if (typeof window === 'undefined') return {};
  const stored = localStorage.getItem(STORAGE_KEYS.LOYALTY);
  return stored ? JSON.parse(stored) : {};
};

export const updateLoyaltyPoints = (phoneNumber: string, pointsToAdd: number) => {
  const accounts = getStoredLoyalty();
  accounts[phoneNumber] = (accounts[phoneNumber] || 0) + pointsToAdd;
  localStorage.setItem(STORAGE_KEYS.LOYALTY, JSON.stringify(accounts));
};

export const getStoredGallery = (): string[] => {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(STORAGE_KEYS.GALLERY);
  return stored ? JSON.parse(stored) : [];
};

export const saveGalleryImage = (base64: string) => {
  const gallery = getStoredGallery();
  localStorage.setItem(STORAGE_KEYS.GALLERY, JSON.stringify([base64, ...gallery]));
};
