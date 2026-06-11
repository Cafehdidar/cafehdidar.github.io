/* eslint-disable @next/next/no-img-element */
'use client';

import React, { useState, useEffect } from 'react';
import { 
  Coffee, 
  MessageCircle, 
  Image as ImageIcon, 
  ShoppingCart, 
  CheckCircle2, 
  Plus, 
  Minus, 
  Trash2, 
  LogIn, 
  ChevronLeft
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { cn } from '@/lib/utils';

type View = 'MENU' | 'CART' | 'FEEDBACK' | 'GALLERY' | 'ADMIN_LOGIN' | 'ADMIN_DASHBOARD';
type Category = 'HOT' | 'COLD' | 'DESSERT';

interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: Category;
  emoji?: string;
  description?: string;
  image?: string;
}

interface OrderItem extends MenuItem {
  quantity: number;
}

interface OrderFromSheet {
  rowIndex: number;
  tableNumber: string;
  items: string;
  totalPrice: string;
  status: string;
  timestamp: string;
}

interface Feedback {
  name: string;
  rating: number;
  comment: string;
  timestamp: string;
}

interface GalleryImage {
  id: string;
  url: string;
  timestamp?: string;
}

const DEFAULT_MENU: MenuItem[] = [
  { id: 'h1', name: 'اسپرسو سینگل', price: 55000, category: 'HOT', emoji: '☕', description: '۱۰۰٪ عربیکا، طعم اصیل و غلیظ' },
  { id: 'h2', name: 'لته آرت', price: 75000, category: 'HOT', emoji: '🥛', description: 'ترکیب متناسب اسپرسو و شیر مخملی' },
  { id: 'c1', name: 'آیس لته', price: 80000, category: 'COLD', emoji: '🧊', description: 'اسپرسو، شیر سرد و تکه‌های یخ' },
  { id: 'c2', name: 'موهیتو فرِش', price: 85000, category: 'COLD', emoji: '🌱', description: 'نعناع تازه، لیمو، سودا و یخ فراوان' },
  { id: 'd1', name: 'کیک شکلاتی بی‌بی', price: 90000, category: 'DESSERT', emoji: '🍰', description: 'کیک شکلاتی مرطوب با سس شکلات داغ' }
];

const API_URL = 'https://script.google.com/macros/s/AKfycbwXtxDevYbYmtE6b1WZOheLDeJoSbLwW_DNm8iVNcBoTyMhlL9ol_KlkOpIoZryn9INQA/exec';

const callScript = async (params: string) => {
  if (typeof window === 'undefined') return null;
  try {
    const res = await fetch(`${API_URL}?${params}`, { method: 'GET' });
    if (!res.ok) throw new Error('Network response was not ok');
    const text = await res.text();
    if (!text) return null;
    try {
      return JSON.parse(text);
    } catch {
      return { success: true };
    }
  } catch (error) {
    console.error("خطا در ارتباط با سرور:", error);
    return null;
  }
};export default function CafeDidarApp() {
  const [currentView, setCurrentView] = useState<View>('MENU');
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [tableNumber, setTableNumber] = useState<string | null>(null);
  const [isLogoTapped, setIsLogoTapped] = useState(0);
  const [isSuccess, setIsSuccess] = useState(false);
  
  const [menu, setMenu] = useState<MenuItem[]>(DEFAULT_MENU);
  const [rawOrders, setRawOrders] = useState<OrderFromSheet[]>([]);
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [gallery, setGallery] = useState<GalleryImage[]>([]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const table = params.get('table');
      if (table) setTableNumber(table);
    }
    fetchMenuOnline();
    fetchFeedbackOnline();
    fetchGalleryOnline();
  }, []);

  const fetchMenuOnline = async () => {
    const data = await callScript('sheet=menu');
    if (Array.isArray(data) && data.length > 0) setMenu(data);
  };

  const fetchFeedbackOnline = async () => {
    const data = await callScript('sheet=feedback');
    if (Array.isArray(data)) setFeedback(data);
  };

  const fetchGalleryOnline = async () => {
    const data = await callScript('sheet=gallery');
    if (Array.isArray(data)) setGallery(data);
  };

  const fetchOrdersOnline = async () => {
    const data = await callScript('sheet=orders');
    if (Array.isArray(data)) {
      setRawOrders(data.filter((o: any) => o.status !== 'انجام شده'));
    }
  };

  const addToCart = (item: MenuItem) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const updateQuantity = (itemId: string, delta: number) => {
    setCart(prev => prev.map(i => {
      if (i.id === itemId) {
        const newQty = i.quantity + delta;
        if (newQty <= 0) return null;
        return { ...i, quantity: newQty };
      }
      return i;
    }).filter(Boolean) as OrderItem[]);
  };

  const removeFromCart = (itemId: string) => {
    setCart(prev => prev.filter(i => i.id !== itemId));
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handlePlaceOrder = async () => {
    if (cart.length === 0) return;
    const itemsStr = cart.map(i => `${i.name} (${i.quantity}عدد)`).join('، ');
    const table = tableNumber || 'بیرون‌بر';
    
    const params = `sheet=orders&action=add&tableNumber=${encodeURIComponent(table)}&items=${encodeURIComponent(itemsStr)}&totalPrice=${cartTotal}`;
    
    const result = await callScript(params);
    if (result) {
      setIsSuccess(true);
      setCart([]);
      setTimeout(() => {
        setIsSuccess(false);
        setCurrentView('MENU');
      }, 3500);
    } else {
      alert("خطایی رخ داد. لطفا دوباره تلاش کنید.");
    }
  };

  const handleLogoClick = () => {
    setIsLogoTapped(prev => prev + 1);
    if (isLogoTapped + 1 >= 5) {
      setCurrentView('ADMIN_LOGIN');
      setIsLogoTapped(0);
    }
  };

  return (
    <div className="flex flex-col min-h-screen max-w-[500px] mx-auto relative overflow-x-hidden bg-[#1C0F0A] text-[#F5E6D3]">
      <header className="h-[75px] flex items-center justify-between px-4 bg-black/70 backdrop-blur-xl border-b border-[#D4A853]/20 fixed top-0 w-full max-w-[500px] z-[100]">
        <div className="flex items-center gap-2">
          {currentView === 'MENU' && (
            <button onClick={() => setCurrentView('CART')} className="relative flex items-center gap-2 bg-gradient-to-r from-[#2A1810] to-[#1C0F0A] px-3 py-2 rounded-xl border border-[#D4A853]/30">
              <ShoppingCart size={18} className="text-[#D4A853]" />
              <span className="text-xs text-[#F5E6D3] font-bold">سبد</span>
              {cartItemCount > 0 && <span className="absolute -top-2 -right-2 bg-[#D4A853] text-[#1C0F0A] text-[11px] w-6 h-6 flex items-center justify-center rounded-full font-black">{cartItemCount}</span>}
            </button>
          )}
          {['CART', 'FEEDBACK', 'GALLERY', 'ADMIN_LOGIN'].includes(currentView) && (
            <button onClick={() => setCurrentView('MENU')} className="text-[#D4A853] text-sm font-bold flex items-center gap-1"><ChevronLeft size={20} /> بازگشت</button>
          )}
          {currentView === 'ADMIN_DASHBOARD' && (
            <button onClick={() => setCurrentView('MENU')} className="text-red-400 text-xs font-bold bg-red-500/10 px-3 py-1.5 rounded-lg border border-red-500/20">خروج</button>
          )}
        </div>
        <div className="flex flex-col items-center">
          <h1 onClick={handleLogoClick} className="text-[#D4A853] font-black text-2xl cursor-pointer leading-tight tracking-wide select-none">دیدار</h1>
          <span className="text-[#D4A853] text-[10px] -mt-1 opacity-60 uppercase tracking-widest font-light">Cafe Didar</span>
        </div>
        <div className="w-[80px] flex justify-end">
          {tableNumber && <span className="text-[10px] bg-[#D4A853]/20 text-[#D4A853] px-2 py-0.5 rounded-full font-bold border border-[#D4A853]/30">میز {tableNumber}</span>}
        </div>
      </header>

      <main className="mt-[75px] mb-[75px] flex-1 overflow-y-auto p-4">
        {currentView === 'MENU' && <MenuView menu={menu} cart={cart} addToCart={addToCart} updateQuantity={updateQuantity} />}
        {currentView === 'CART' && <CartView cart={cart} updateQuantity={updateQuantity} removeFromCart={removeFromCart} total={cartTotal} tableNumber={tableNumber} onPlaceOrder={handlePlaceOrder} isSuccess={isSuccess} />}
        {currentView === 'FEEDBACK' && <FeedbackView feedbackList={feedback} onFeedbackSubmit={fetchFeedbackOnline} />}
        {currentView === 'GALLERY' && <GalleryView galleryList={gallery} />}
        {currentView === 'ADMIN_LOGIN' && <AdminLogin onLoginSuccess={() => { setCurrentView('ADMIN_DASHBOARD'); fetchOrdersOnline(); }} />}
        {currentView === 'ADMIN_DASHBOARD' && <AdminDashboard rawOrders={rawOrders} refreshOrders={fetchOrdersOnline} />}
      </main>

      <nav className="h-[75px] bg-black/80 backdrop-blur-2xl border-t border-[#D4A853]/10 fixed bottom-0 w-full max-w-[500px] z-50 flex items-center justify-around px-4">
        <NavButton active={currentView === 'MENU'} icon={<Coffee size={22} />} label="منو" onClick={() => setCurrentView('MENU')} />
        <NavButton active={currentView === 'FEEDBACK'} icon={<MessageCircle size={22} />} label="نظرات" onClick={() => setCurrentView('FEEDBACK')} />
        <NavButton active={currentView === 'GALLERY'} icon={<ImageIcon size={22} />} label="گالری" onClick={() => setCurrentView('GALLERY')} />
      </nav>
    </div>
  );
}

function NavButton({ active, icon, label, onClick }: any) {
  return (
    <button onClick={onClick} className={cn("flex flex-col items-center gap-1.5 transition-all duration-300", active ? 'text-[#D4A853] scale-110' : 'text-[#A89B95] opacity-70')}>
      {icon}
      <span className="text-[10px] font-bold">{label}</span>
    </button>
  );
    }

function CategoryTab({ active, label, onClick }: any) {
  return (
    <button onClick={onClick} className={cn("flex-1 py-3 text-xs font-black rounded-xl m-1 transition-all", active ? 'bg-[#D4A853] text-[#1C0F0A]' : 'text-[#A89B95]')}>
      {label}
    </button>
  );
}

function MenuView({ menu, cart, addToCart, updateQuantity }: any) {
  const [activeCategory, setActiveCategory] = useState<Category>('HOT');
  const filteredItems = menu.filter((i: any) => i.category === activeCategory);

  return (
    <div className="space-y-4">
      <div className="flex w-full bg-[#1C0F0A]/90 backdrop-blur-md sticky top-0 z-40 border border-[#3D2B24] p-1 rounded-2xl mb-2">
        <CategoryTab active={activeCategory === 'HOT'} label="☕ بار گرم" onClick={() => setActiveCategory('HOT')} />
        <CategoryTab active={activeCategory === 'COLD'} label="🍹 بار سرد" onClick={() => setActiveCategory('COLD')} />
        <CategoryTab active={activeCategory === 'DESSERT'} label="🍰 دسر" onClick={() => setActiveCategory('DESSERT')} />
      </div>
      <div className="space-y-3.5">
        {filteredItems.map((item: any) => {
          const cartItem = cart.find((i: any) => i.id === item.id);
          return (
            <div key={item.id} className="bg-[#2A1810] border border-[#3D2B24] rounded-2xl p-3 flex items-center gap-3">
              <div className="w-[85px] h-[85px] bg-[#3D2B24] rounded-2xl flex items-center justify-center text-3xl overflow-hidden shrink-0 border">
                {item.image ? <img src={item.image} alt="" className="w-full h-full object-cover" /> : <span>{item.emoji || '🍽️'}</span>}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-[#F5E6D3] font-black text-sm">{item.name}</h3>
                <p className="text-[#A89B95] text-[11px] font-light mt-0.5 line-clamp-2 min-h-[32px]">{item.description}</p>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-[#D4A853] font-black text-sm">{(item.price / 1000).toLocaleString()} <span className="text-[9px] font-normal opacity-70">تومان</span></span>
                  {cartItem ? (
                    <div className="flex items-center gap-3 bg-black/60 rounded-full p-1 px-2.5 border border-[#D4A853]/30">
                      <button onClick={() => updateQuantity(item.id, -1)} className="text-[#D4A853]"><Minus size={14} /></button>
                      <span className="text-xs font-black text-[#F5E6D3] w-4 text-center">{cartItem.quantity}</span>
                      <button onClick={() => updateQuantity(item.id, 1)} className="text-[#D4A853]"><Plus size={14} /></button>
                    </div>
                  ) : (
                    <button onClick={() => addToCart(item)} className="bg-[#D4A853] text-[#1C0F0A] px-4 py-1.5 rounded-xl text-[11px] font-black">افزودن +</button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function FeedbackView({ feedbackList, onFeedbackSubmit }: any) {
  const [rating, setRating] = useState(0);
  const [name, setName] = useState('');
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0 || !name.trim() || !comment.trim()) return;
    setLoading(true);
    const params = `sheet=feedback&action=add&name=${encodeURIComponent(name.trim())}&rating=${rating}&comment=${encodeURIComponent(comment.trim())}`;
    const res = await callScript(params);
    setLoading(false);
    if (res) {
      setSubmitted(true);
      onFeedbackSubmit();
      setName(''); setComment(''); setRating(0);
    }
  };

  if (submitted) return (
    <div className="flex flex-col items-center justify-center h-[60vh] text-center">
      <CheckCircle2 size={54} className="text-[#D4A853] mb-4" />
      <h2 className="text-xl font-black text-[#D4A853]">سپاس از شما</h2>
      <p className="text-xs text-[#A89B95] mt-2">بازخورد با موفقیت ثبت شد.</p>
      <Button onClick={() => setSubmitted(false)} variant="ghost" className="mt-6 text-[#D4A853]">ارسال نظر دیگر</Button>
    </div>
  );

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-black text-[#D4A853] border-r-2 border-[#D4A853] pr-2">نظرات و پیشنهادات</h2>
      <div className="bg-[#2A1810] p-4 rounded-2xl border border-[#3D2B24] space-y-4">
        <Input value={name} onChange={e => setName(e.target.value)} placeholder="نام شما" className="bg-[#1C0F0A] border-[#3D2B24] h-11 text-sm text-[#F5E6D3]" />
        <div className="flex justify-center gap-3 py-2">
          {[1, 2, 3, 4, 5].map(s => (
            <button key={s} onClick={() => setRating(s)}>
              <CheckCircle2 size={28} fill={s <= rating ? '#D4A853' : 'transparent'} color={s <= rating ? '#D4A853' : '#3D2B24'} />
            </button>
          ))}
        </div>
        <Textarea value={comment} onChange={e => setComment(e.target.value)} placeholder="تجربه شما از کافه دیدار..." className="bg-[#1C0F0A] border-[#3D2B24] min-h-[90px] text-sm text-[#F5E6D3]" />
        <Button onClick={handleSubmit} disabled={rating === 0 || !name.trim() || !comment.trim() || loading} className="w-full bg-[#D4A853] text-[#1C0F0A] font-black h-12 rounded-xl text-xs">
          {loading ? 'در حال ثبت...' : 'ثبت بازخورد نهایی'}
        </Button>
      </div>
      <div className="space-y-3 pt-2">
        {feedbackList.map((f: any, idx: number) => (
          <div key={idx} className="bg-[#1C0F0A] border border-[#3D2B24] p-3 rounded-xl space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs font-black text-[#D4A853]">{f.name}</span>
              <div className="flex gap-0.5">
                {Array.from({ length: Number(f.rating || 5) }).map((_, i) => <span key={i} className="text-[#D4A853] text-xs">★</span>)}
              </div>
            </div>
            <p className="text-xs font-light text-[#A89B95] leading-relaxed">{f.comment}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function GalleryView({ galleryList }: any) {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-black text-[#D4A853] border-r-2 border-[#D4A853] pr-2">گالری دیدار</h2>
      <div className="grid grid-cols-2 gap-3">
        {galleryList.map((img: any) => (
          <div key={img.id} className="aspect-square bg-[#2A1810] rounded-2xl overflow-hidden border border-[#3D2B24]">
            <img src={img.url} className="w-full h-full object-cover" alt="کافه دیدار" />
          </div>
        ))}
      </div>
    </div>
  );
}

function CartView({ cart, updateQuantity, removeFromCart, total, tableNumber, onPlaceOrder, isSuccess }: any) {
  if (isSuccess) return (
    <div className="flex flex-col items-center justify-center h-[65vh] text-center">
      <div className="w-24 h-24 bg-[#D4A853] rounded-full flex items-center justify-center mb-6">
        <CheckCircle2 size={54} className="text-[#1C0F0A]" />
      </div>
      <h2 className="text-xl font-black text-[#D4A853]">سفارش با موفقیت ارسال شد</h2>
      <p className="text-xs text-[#A89B95] mt-2">جهت آماده‌سازی به باریستا ارجاع شد ({tableNumber ? `میز ${tableNumber}` : 'بیرون‌بر'}).</p>
    </div>
  );

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-black text-[#D4A853] border-r-2 border-[#D4A853] pr-2">سبد سفارش شما</h2>
      {cart.length === 0 ? (
        <p className="text-center text-xs text-[#A89B95] py-24 opacity-40">سبد خرید شما در حال حاضر خالی است.</p>
      ) : (
        <div className="space-y-3">
          {cart.map((item: any) => (
            <div key={item.id} className="bg-[#2A1810] p-3 rounded-2xl flex items-center gap-3 border border-[#3D2B24]">
              <div className="w-12 h-12 rounded-xl overflow-hidden bg-[#1C0F0A] flex items-center justify-center text-xl shrink-0 border">
                {item.image ? <img src={item.image} className="w-full h-full object-cover" alt="" /> : <span>{item.emoji}</span>}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-xs text-[#F5E6D3] truncate">{item.name}</h4>
                <p className="text-[#D4A853] text-[11px] font-black mt-1">{(item.price * item.quantity / 1000).toLocaleString()} تومان</p>
              </div>
              <div className="flex items-center gap-2.5 bg-black/40 rounded-full px-2.5 py-1 border border-[#3D2B24]">
                <button onClick={() => updateQuantity(item.id, -1)} className="text-[#D4A853]"><Minus size={12} /></button>
                <span className="text-xs font-black w-4 text-center">{item.quantity}</span>
                <button onClick={() => updateQuantity(item.id, 1)} className="text-[#D4A853]"><Plus size={12} /></button>
              </div>
              <button onClick={() => removeFromCart(item.id)} className="text-red-400/40 hover:text-red-400 px-1"><Trash2 size={16} /></button>
            </div>
          ))}
          <div className="mt-8 bg-[#2A1810] p-4 rounded-2xl border border-[#D4A853]/20 space-y-4">
            <div className="flex justify-between items-center text-sm">
              <span className="text-[#A89B95]">مجموع کل صورتحساب:</span>
              <span className="text-xl font-black text-[#D4A853]">{(total / 1000).toLocaleString()} <span className="text-xs font-light">تومان</span></span>
            </div>
            <Button onClick={onPlaceOrder} className="w-full h-12 bg-[#D4A853] text-[#1C0F0A] font-black rounded-xl text-xs">تایید نهایی و ثبت سفارش</Button>
          </div>
        </div>
      )}
    </div>
  );
}

function AdminLogin({ onLoginSuccess }: any) {
  const [password, setPassword] = useState('');
  const handleLogin = () => {
    if (password === 'didar1234') { onLoginSuccess(); } else { alert('رمز عبور پنل اشتباه است.'); }
  };
  return (
    <div className="flex flex-col items-center justify-center h-[60vh] max-w-[320px] mx-auto space-y-5">
      <LogIn size={40} className="text-[#D4A853]" />
      <h2 className="text-base font-black">ورود به پنل مدیریت کافه</h2>
      <Input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="رمز عبور مدیریت" className="bg-[#2A1810] border-[#3D2B24] h-12 text-center text-sm" />
      <Button onClick={handleLogin} className="w-full bg-[#D4A853] text-[#1C0F0A] h-11 font-black rounded-xl text-xs">ورود</Button>
    </div>
  );
}

function AdminDashboard({ rawOrders, refreshOrders }: any) {
  const [loadingRow, setLoadingRow] = useState<number | null>(null);

  const handleCompleteOrder = async (rowIndex: number) => {
    setLoadingRow(rowIndex);
    const res = await callScript(`sheet=orders&action=updateStatus&rowIndex=${rowIndex}&status=${encodeURIComponent('انجام شده')}`);
    setLoadingRow(null);
    if (res) refreshOrders();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center border-r-2 border-[#D4A853] pr-2">
        <h2 className="text-base font-black text-[#D4A853]">مدیریت سفارشات فعال</h2>
        <Button onClick={refreshOrders} className="h-8 text-[11px] bg-[#2A1810] text-[#D4A853] border border-[#3D2B24] px-3 rounded-lg">به‌روزرسانی ↻</Button>
      </div>
      <div className="space-y-3">
        {rawOrders.map((order: OrderFromSheet) => (
          <Card key={order.rowIndex} className="bg-[#2A1810] border-[#3D2B24] text-[#F5E6D3] rounded-2xl overflow-hidden">
            <CardHeader className="p-3 bg-black/30 flex flex-row items-center justify-between border-b border-[#3D2B24]">
              <span className="text-xs font-black text-[#D4A853]">
                {order.tableNumber === 'Takeout' || order.tableNumber === 'بیرون‌بر' ? '📦 سفارش بیرون‌بر' : `📌 میز ${order.tableNumber}`}
              </span>
              <span className="text-[10px] text-[#A89B95] font-light">{order.timestamp}</span>
            </CardHeader>
            <CardContent className="p-3.5 space-y-3">
              <p className="text-xs text-[#F5E6D3] leading-relaxed font-medium bg-black/20 p-2.5 rounded-xl border border-[#3D2B24]">{order.items}</p>
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#A89B95]">مبلغ پرداختی:</span>
                <span className="text-sm font-black text-[#D4A853]">{(Number(order.totalPrice) / 1000).toLocaleString()} تومان</span>
              </div>
              <Button onClick={() => handleCompleteOrder(order.rowIndex)} disabled={loadingRow === order.rowIndex} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-10 rounded-xl mt-1">
                {loadingRow === order.rowIndex ? 'در حال ثبت نهایی...' : '✓ سفارش تحویل داده شد'}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
              }
        
