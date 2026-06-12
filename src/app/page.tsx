cat > /mnt/user-data/outputs/page.tsx << 'ENDOFFILE'
/* eslint-disable @next/next/no-img-element */
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { View, MenuItem, OrderItem, Category, Feedback } from '@/lib/types';
import {
  Coffee, MessageCircle, Image as ImageIcon, ShoppingCart, CheckCircle2,
  Plus, Minus, Trash2, LogIn, Upload, ChevronLeft, ListOrdered, Check,
  QrCode, Download, Star, Pencil
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { DEFAULT_MENU } from '@/lib/constants';

const GAS_URL = 'https://script.google.com/macros/s/AKfycby4q1X35kgm73DBJv-5Oku36ce18dk22xeGV7Jo8CeSmnJPJ0nByG4XMzWtDfva1B6Y6w/exec';

// ارسال بدون CORS با iframe
const callScript = (params: string) => {
  if (typeof window === 'undefined') return;
  const iframe = document.createElement('iframe');
  iframe.style.display = 'none';
  iframe.src = `${GAS_URL}?${params}`;
  document.body.appendChild(iframe);
  setTimeout(() => { if (document.body.contains(iframe)) document.body.removeChild(iframe); }, 4000);
};

// خواندن داده از Google Sheets
const fetchFromSheets = async (params: string) => {
  const res = await fetch(`${GAS_URL}?${params}&t=${Date.now()}`);
  return res.json();
};

// ============================================================
// APP ROOT
// ============================================================
export default function CafeDidarApp() {
  const [currentView, setCurrentView] = useState<View>('MENU');
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [tableNumber, setTableNumber] = useState<string | null>(null);
  const [logoTapCount, setLogoTapCount] = useState(0);
  const [isSuccess, setIsSuccess] = useState(false);
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [gallery, setGallery] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // بارگذاری اولیه از Google Sheets
  useEffect(() => {
    const loadData = async () => {
      try {
        const [menuData, feedbackData, galleryData] = await Promise.all([
          fetchFromSheets('action=getMenu'),
          fetchFromSheets('action=getFeedback'),
          fetchFromSheets('action=getGallery'),
        ]);
        setMenu(Array.isArray(menuData) && menuData.length > 0 ? menuData : DEFAULT_MENU);
        setFeedback(Array.isArray(feedbackData) ? feedbackData : []);
        setGallery(Array.isArray(galleryData) ? galleryData : []);
      } catch {
        setMenu(DEFAULT_MENU);
      } finally {
        setLoading(false);
      }
      const table = new URLSearchParams(window.location.search).get('table');
      if (table) setTableNumber(table);
    };
    loadData();
  }, []);

  const addToCart = (item: MenuItem) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const updateQuantity = (itemId: string, delta: number) => {
    setCart(prev => prev.map(i => {
      if (i.id !== itemId) return i;
      const newQty = i.quantity + delta;
      if (newQty <= 0) return null;
      return { ...i, quantity: newQty };
    }).filter(Boolean) as OrderItem[]);
  };

  const removeFromCart = (itemId: string) => setCart(prev => prev.filter(i => i.id !== itemId));
  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handlePlaceOrder = () => {
    if (cart.length === 0) return;
    const itemsStr = cart.map(i => `${i.name} (${i.quantity}عدد)`).join('، ');
    callScript(new URLSearchParams({
      tableNumber: tableNumber || 'Takeout',
      items: itemsStr,
      totalPrice: cartTotal.toString(),
      status: 'جدید'
    }).toString());
    setIsSuccess(true);
    setCart([]);
    setTimeout(() => { setIsSuccess(false); setCurrentView('MENU'); }, 3500);
  };

  const handleLogoClick = () => {
    const next = logoTapCount + 1;
    setLogoTapCount(next);
    if (next >= 5) { setCurrentView('ADMIN_LOGIN'); setLogoTapCount(0); }
  };

  // ذخیره منو در Sheets
  const handleSetMenu = (newMenu: MenuItem[]) => {
    setMenu(newMenu);
    callScript(`action=saveMenu&items=${encodeURIComponent(JSON.stringify(newMenu))}`);
  };

  // ذخیره نظر در Sheets
  const handleAddFeedback = (f: Feedback) => {
    setFeedback(prev => [f, ...prev]);
    callScript(new URLSearchParams({
      action: 'saveFeedback',
      id: f.id,
      name: f.name,
      rating: String(f.rating),
      comment: f.comment || '',
      timestamp: f.timestamp,
    }).toString());
  };

  // ذخیره گالری در Sheets
  const handleSetGallery = (newGallery: any[]) => {
    setGallery(newGallery);
    // اگه آیتم جدید اضافه شد ذخیره کن
    const latest = newGallery[0];
    if (latest && latest.isNew) {
      callScript(`action=saveGallery&id=${latest.id}&url=${encodeURIComponent(latest.url)}&timestamp=${encodeURIComponent(latest.timestamp)}`);
    }
  };

  const isAdmin = currentView === 'ADMIN_LOGIN' || currentView === 'ADMIN_DASHBOARD';
  const isBack = ['CART', 'FEEDBACK', 'GALLERY'].includes(currentView);

  return (
    <div className="flex flex-col min-h-screen max-w-[500px] mx-auto relative overflow-x-hidden bg-[#1C0F0A] font-body" dir="rtl">

      {/* HEADER */}
      <header className="h-[70px] flex items-center justify-between px-4 bg-black/80 backdrop-blur-xl border-b border-[#D4A853]/20 fixed top-0 w-full max-w-[500px] z-[100]">
        <div className="flex items-center gap-2 min-w-[100px]">
          {currentView === 'MENU' && (
            <button onClick={() => setCurrentView('CART')}
              className="relative flex items-center gap-1.5 bg-[#2A1810] px-3 py-2 rounded-xl border border-[#D4A853]/30 active:scale-95 transition-transform">
              <ShoppingCart size={16} className="text-[#D4A853]" />
              <span className="text-[11px] text-[#F5E6D3] font-bold">سبد</span>
              {cartItemCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-[#D4A853] text-[#1C0F0A] text-[10px] w-5 h-5 flex items-center justify-center rounded-full font-black">
                  {cartItemCount}
                </span>
              )}
            </button>
          )}
          {isBack && (
            <button onClick={() => setCurrentView('MENU')} className="text-[#D4A853] text-sm font-bold flex items-center gap-1 active:opacity-70">
              <ChevronLeft size={20} /> بازگشت
            </button>
          )}
          {isAdmin && (
            <button onClick={() => setCurrentView('MENU')} className="text-red-400 text-[11px] font-bold bg-red-500/10 px-3 py-1.5 rounded-lg border border-red-500/20 active:scale-95 transition-transform">
              خروج
            </button>
          )}
        </div>

        <div className="flex flex-col items-center cursor-pointer select-none" onClick={handleLogoClick}>
          <h1 className="text-[#D4A853] font-black text-2xl leading-tight tracking-tight">دیدار</h1>
          <span className="font-script text-[#D4A853]/70 text-xs tracking-widest uppercase -mt-0.5">Cafe Didar</span>
        </div>

        <div className="min-w-[100px] flex justify-end">
          {tableNumber && (
            <span className="text-[9px] bg-[#D4A853]/20 text-[#D4A853] px-2 py-1 rounded-full font-bold">
              میز {tableNumber}
            </span>
          )}
        </div>
      </header>

      {/* MAIN */}
      <main className="mt-[70px] mb-[70px] flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-[60vh]">
            <div className="w-8 h-8 border-2 border-[#D4A853] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="animate-fade-in">
            {currentView === 'MENU' && <MenuView menu={menu} cart={cart} addToCart={addToCart} updateQuantity={updateQuantity} />}
            {currentView === 'CART' && <CartView cart={cart} updateQuantity={updateQuantity} removeFromCart={removeFromCart} total={cartTotal} tableNumber={tableNumber} onPlaceOrder={handlePlaceOrder} isSuccess={isSuccess} />}
            {currentView === 'FEEDBACK' && <FeedbackView onFeedbackSubmit={handleAddFeedback} />}
            {currentView === 'GALLERY' && <GalleryView gallery={gallery} />}
            {currentView === 'ADMIN_LOGIN' && <AdminLogin onLoginSuccess={() => setCurrentView('ADMIN_DASHBOARD')} />}
            {currentView === 'ADMIN_DASHBOARD' && (
              <AdminDashboard
                menu={menu} setMenu={handleSetMenu}
                feedback={feedback}
                gallery={gallery} setGallery={handleSetGallery}
              />
            )}
          </div>
        )}
      </main>

      {/* BOTTOM NAV */}
      <nav className="h-[70px] bg-black/90 backdrop-blur-2xl border-t border-[#D4A853]/10 fixed bottom-0 w-full max-w-[500px] z-50 flex items-center justify-around px-6">
        <NavBtn active={currentView === 'MENU'} icon={<Coffee size={20} />} label="منو" onClick={() => setCurrentView('MENU')} />
        <NavBtn active={currentView === 'FEEDBACK'} icon={<MessageCircle size={20} />} label="نظرات" onClick={() => setCurrentView('FEEDBACK')} />
        <NavBtn active={currentView === 'GALLERY'} icon={<ImageIcon size={20} />} label="گالری" onClick={() => setCurrentView('GALLERY')} />
      </nav>
    </div>
  );
}

// ============================================================
// SHARED
// ============================================================
function NavBtn({ active, icon, label, onClick }: { active: boolean; icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className={cn('flex flex-col items-center gap-1 transition-all duration-300 active:scale-90', active ? 'text-[#D4A853] scale-105' : 'text-[#5A4A44]')}>
      {icon}
      <span className="text-[9px] font-black tracking-wider">{label}</span>
    </button>
  );
}

function CategoryTab({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className={cn('flex-1 py-2.5 text-[11px] font-black rounded-xl mx-0.5 transition-all duration-200 active:scale-95', active ? 'bg-[#D4A853] text-[#1C0F0A] shadow-lg shadow-[#D4A853]/20' : 'text-[#5A4A44]')}>
      {label}
    </button>
  );
}

// ============================================================
// MENU VIEW
// ============================================================
function MenuView({ menu, cart, addToCart, updateQuantity }: any) {
  const [activeCategory, setActiveCategory] = useState<Category>('HOT');
  const filteredItems = menu.filter((i: any) => i.category === activeCategory);

  return (
    <div className="pb-4">
      <div className="flex w-full bg-[#1C0F0A]/98 backdrop-blur-md sticky top-0 z-40 border-b border-[#2A1810] p-1.5">
        <CategoryTab active={activeCategory === 'HOT'} label="☕ بار گرم" onClick={() => setActiveCategory('HOT')} />
        <CategoryTab active={activeCategory === 'COLD'} label="🍹 بار سرد" onClick={() => setActiveCategory('COLD')} />
        <CategoryTab active={activeCategory === 'DESSERT'} label="🍰 دسر" onClick={() => setActiveCategory('DESSERT')} />
      </div>

      <div className="p-3 space-y-3">
        {filteredItems.length === 0 && (
          <p className="text-center text-[#5A4A44] py-16 text-sm">آیتمی در این دسته وجود ندارد</p>
        )}
        {filteredItems.map((item: any) => {
          const cartItem = cart.find((i: any) => i.id === item.id);
          return (
            <div key={item.id} className="bg-[#2A1810] border border-[#3D2B24] rounded-2xl p-3 flex items-center gap-3 transition-all active:scale-[0.99]">
              <div className="w-[80px] h-[80px] bg-[#1C0F0A] rounded-xl flex items-center justify-center text-3xl overflow-hidden shrink-0 border border-[#3D2B24]">
                {item.image ? <img src={item.image} alt={item.name} className="w-full h-full object-cover" /> : <span>{item.emoji || '🍽️'}</span>}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-[#F5E6D3] font-black text-sm leading-snug">{item.name}</h3>
                <p className="text-[#5A4A44] text-[10px] italic line-clamp-2 mt-0.5">{item.description}</p>
                <div className="flex items-center justify-between mt-2.5">
                  <span className="text-[#D4A853] font-black text-sm">
                    {(item.price / 1000).toLocaleString()}
                    <span className="text-[8px] font-bold mr-0.5">تومان</span>
                  </span>
                  {cartItem ? (
                    <div className="flex items-center gap-2 bg-black/60 rounded-full py-1 px-2 border border-[#D4A853]/30">
                      <button onClick={() => updateQuantity(item.id, -1)} className="text-[#D4A853] active:scale-75 transition-transform"><Minus size={13} /></button>
                      <span className="text-xs font-black text-[#F5E6D3] w-4 text-center">{cartItem.quantity}</span>
                      <button onClick={() => updateQuantity(item.id, 1)} className="text-[#D4A853] active:scale-75 transition-transform"><Plus size={13} /></button>
                    </div>
                  ) : (
                    <button onClick={() => addToCart(item)} className="bg-[#D4A853] text-[#1C0F0A] px-3 py-1.5 rounded-lg text-[10px] font-black transition-transform active:scale-90 shadow-md shadow-[#D4A853]/20">
                      افزودن +
                    </button>
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

// ============================================================
// CART VIEW
// ============================================================
function CartView({ cart, updateQuantity, removeFromCart, total, tableNumber, onPlaceOrder, isSuccess }: any) {
  if (isSuccess) return (
    <div className="flex flex-col items-center justify-center h-[75vh] p-6 animate-fade-in">
      <div className="w-28 h-28 bg-[#D4A853] rounded-full flex items-center justify-center mb-6 shadow-2xl shadow-[#D4A853]/30 relative">
        <div className="absolute inset-0 rounded-full bg-[#D4A853]/30 animate-ping" />
        <CheckCircle2 size={70} className="text-[#1C0F0A] relative z-10" />
      </div>
      <h2 className="text-2xl font-black text-[#D4A853]">سفارش ثبت شد!</h2>
      <p className="text-[#A89B95] mt-2 text-center text-sm font-bold">
        {tableNumber ? `میز ${tableNumber}` : 'سفارش بیرون‌بر'} شما دریافت شد
      </p>
    </div>
  );

  return (
    <div className="p-4 pb-6">
      <h2 className="text-2xl font-black text-[#D4A853] mb-6">صورتحساب</h2>
      {cart.length === 0 ? (
        <div className="text-center text-[#5A4A44] py-20">
          <ShoppingCart size={56} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">سبد خرید خالی است</p>
        </div>
      ) : (
        <div className="space-y-3">
          {cart.map((item: any) => (
            <div key={item.id} className="bg-[#2A1810] p-3 rounded-xl flex items-center gap-3 border border-[#3D2B24]">
              <div className="w-10 h-10 rounded-lg overflow-hidden bg-[#1C0F0A] flex items-center justify-center shrink-0">
                {item.image ? <img src={item.image} className="w-full h-full object-cover" alt="" /> : <span>{item.emoji}</span>}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-xs text-[#F5E6D3] truncate">{item.name}</h4>
                <p className="text-[#D4A853] text-[10px] font-black mt-0.5">{(item.price * item.quantity / 1000).toLocaleString()} تومان</p>
              </div>
              <div className="flex items-center gap-2 bg-black/40 rounded-full px-2 py-1">
                <button onClick={() => updateQuantity(item.id, -1)} className="text-[#D4A853] active:scale-75"><Minus size={12} /></button>
                <span className="text-xs font-black w-4 text-center">{item.quantity}</span>
                <button onClick={() => updateQuantity(item.id, 1)} className="text-[#D4A853] active:scale-75"><Plus size={12} /></button>
              </div>
              <button onClick={() => removeFromCart(item.id)} className="text-red-500/40 active:text-red-500 transition-colors mr-1">
                <Trash2 size={16} />
              </button>
            </div>
          ))}
          <div className="mt-6 bg-[#2A1810] p-5 rounded-2xl border border-[#D4A853]/20">
            <div className="flex justify-between items-center mb-5">
              <span className="text-[#A89B95] text-sm font-bold">مجموع کل:</span>
              <span className="text-2xl font-black text-[#D4A853]">{(total / 1000).toLocaleString()} <span className="text-xs font-bold">تومان</span></span>
            </div>
            <Button onClick={onPlaceOrder} className="w-full h-14 bg-[#D4A853] text-[#1C0F0A] font-black rounded-xl text-base shadow-lg shadow-[#D4A853]/25 active:scale-95 transition-transform">
              ✅ ثبت و تایید نهایی
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// FEEDBACK VIEW
// ============================================================
function FeedbackView({ onFeedbackSubmit }: any) {
  const [rating, setRating] = useState(0);
  const [name, setName] = useState('');
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    if (rating === 0 || !name.trim()) return;
    onFeedbackSubmit({
      id: Date.now().toString(),
      name: name.trim(),
      rating,
      comment,
      timestamp: new Date().toLocaleString('fa-IR'),
    });
    setSubmitted(true);
  };

  if (submitted) return (
    <div className="flex flex-col items-center justify-center h-[70vh] p-10 text-center animate-fade-in">
      <CheckCircle2 size={60} className="text-[#D4A853] mb-4" />
      <h2 className="text-xl font-black text-[#D4A853]">سپاس از نظر شما</h2>
      <p className="text-[#A89B95] text-sm mt-2">نظر شما برای ما ارزشمند است</p>
      <Button onClick={() => { setSubmitted(false); setRating(0); setName(''); setComment(''); }} variant="ghost" className="mt-6 text-[#D4A853] text-sm">
        ارسال نظر دیگر
      </Button>
    </div>
  );

  return (
    <div className="p-5 space-y-5">
      <h2 className="text-2xl font-black text-[#D4A853]">نظرسنجی</h2>
      <div className="space-y-1.5">
        <label className="text-[11px] font-bold text-[#A89B95]">نام شما (الزامی)</label>
        <Input value={name} onChange={e => setName(e.target.value)} placeholder="مثلاً: علی رضایی" className="bg-[#2A1810] border-[#3D2B24] h-11 text-sm" />
      </div>
      <div className="space-y-1.5">
        <label className="text-[11px] font-bold text-[#A89B95]">امتیاز شما</label>
        <div className="flex gap-3 justify-center py-3">
          {[1, 2, 3, 4, 5].map(s => (
            <button key={s} onClick={() => setRating(s)} className="transition-transform active:scale-75">
              <Star size={30} fill={s <= rating ? '#D4A853' : 'transparent'} color={s <= rating ? '#D4A853' : '#3D2B24'} strokeWidth={1.5} />
            </button>
          ))}
        </div>
      </div>
      <div className="space-y-1.5">
        <label className="text-[11px] font-bold text-[#A89B95]">نظر شما</label>
        <Textarea value={comment} onChange={e => setComment(e.target.value)} placeholder="تجربه خود را بنویسید..." className="bg-[#2A1810] border-[#3D2B24] min-h-[100px] text-sm" />
      </div>
      <Button onClick={handleSubmit} disabled={rating === 0 || !name.trim()} className="w-full bg-[#D4A853] text-[#1C0F0A] font-black h-12 shadow-lg shadow-[#D4A853]/20 active:scale-95 transition-transform">
        ثبت بازخورد
      </Button>
    </div>
  );
}

// ============================================================
// GALLERY VIEW
// ============================================================
function GalleryView({ gallery }: any) {
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <div className="p-4">
      <h2 className="text-2xl font-black text-[#D4A853] mb-5 text-center">گالری دیدار</h2>
      {gallery.length === 0 && (
        <p className="text-center text-[#5A4A44] py-16 text-sm">هنوز تصویری آپلود نشده</p>
      )}
      <div className="grid grid-cols-2 gap-2.5">
        {gallery.map((img: any) => (
          <div key={img.id} onClick={() => setSelected(img.url)} className="aspect-square bg-[#2A1810] rounded-xl overflow-hidden border border-[#3D2B24] cursor-pointer active:scale-95 transition-transform">
            <img src={img.url} className="w-full h-full object-cover" alt="" />
          </div>
        ))}
      </div>
      {selected && (
        <div onClick={() => setSelected(null)} className="fixed inset-0 bg-black/90 z-[200] flex items-center justify-center p-4">
          <img src={selected} className="max-w-full max-h-full rounded-xl object-contain" alt="" />
        </div>
      )}
    </div>
  );
}

// ============================================================
// ADMIN LOGIN
// ============================================================
function AdminLogin({ onLoginSuccess }: any) {
  const [pass, setPass] = useState('');
  const [error, setError] = useState(false);

  const handleLogin = () => {
    if (pass === 'didar1234') { onLoginSuccess(); }
    else { setError(true); setTimeout(() => setError(false), 2000); }
  };

  return (
    <div className="p-8 flex flex-col items-center justify-center h-[70vh] gap-5">
      <div className="w-16 h-16 bg-[#D4A853]/10 rounded-2xl flex items-center justify-center border border-[#D4A853]/20">
        <LogIn size={32} className="text-[#D4A853]" />
      </div>
      <h2 className="text-xl font-black text-[#F5E6D3]">ورود به پنل مدیریت</h2>
      <Input
        type="password" value={pass}
        onChange={e => { setPass(e.target.value); setError(false); }}
        onKeyDown={(e: React.KeyboardEvent) => e.key === 'Enter' && handleLogin()}
        placeholder="رمز عبور"
        className={cn('bg-[#2A1810] border-[#3D2B24] h-12 text-center w-full max-w-xs', error && 'border-red-500')}
      />
      {error && <p className="text-red-400 text-xs -mt-2">رمز عبور اشتباه است</p>}
      <Button onClick={handleLogin} className="w-full max-w-xs bg-[#D4A853] text-[#1C0F0A] h-12 font-black active:scale-95 transition-transform">
        ورود
      </Button>
    </div>
  );
}

// ============================================================
// ADMIN DASHBOARD
// ============================================================
function AdminDashboard({ menu, setMenu, feedback, gallery, setGallery }: any) {
  const [rawOrders, setRawOrders] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('orders');
  const deletedRows = useRef(new Set<number>());

  const fetchOrders = async () => {
    try {
      const data = await fetchFromSheets('action=getOrders');
      if (!Array.isArray(data)) return;
      const mapped = data.map((o: any, idx: number) => ({ ...o, rowIndex: idx }));
      const filtered = mapped.filter((o: any) => {
        const empty = (!o.tableNumber || String(o.tableNumber).trim() === '' || o.tableNumber === '0') &&
          (!o.items || String(o.items).trim() === '') &&
          (!o.totalPrice || o.totalPrice === '0');
        return !empty && !deletedRows.current.has(o.rowIndex);
      });
      setRawOrders(filtered);
    } catch { /* silent */ }
  };

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleDeleteOrder = (order: any) => {
    deletedRows.current.add(order.rowIndex);
    setRawOrders(prev => prev.filter(o => o.rowIndex !== order.rowIndex));
    callScript(`action=deleteOrder&rowIndex=${order.rowIndex}`);
  };

  return (
    <div className="p-4 bg-[#1C0F0A] min-h-screen pb-20">
      <div className="bg-[#2A1810] p-4 rounded-2xl border border-[#3D2B24] mb-5">
        <p className="text-[10px] text-[#5A4A44] font-black uppercase tracking-widest">سفارشات در انتظار</p>
        <p className="text-3xl font-black text-[#D4A853] mt-1">{rawOrders.length}</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-[#2A1810] grid grid-cols-5 h-12 mb-5 rounded-xl">
          <TabsTrigger value="orders" className="rounded-lg"><ListOrdered size={16} /></TabsTrigger>
          <TabsTrigger value="menu" className="rounded-lg"><Coffee size={16} /></TabsTrigger>
          <TabsTrigger value="feedback" className="rounded-lg"><MessageCircle size={16} /></TabsTrigger>
          <TabsTrigger value="gallery" className="rounded-lg"><ImageIcon size={16} /></TabsTrigger>
          <TabsTrigger value="qrcodes" className="rounded-lg"><QrCode size={16} /></TabsTrigger>
        </TabsList>

        {/* ORDERS */}
        <TabsContent value="orders" className="space-y-3">
          {rawOrders.length === 0 && (
            <div className="text-center text-[#5A4A44] py-16">
              <CheckCircle2 size={40} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm">هیچ سفارشی در انتظار نیست</p>
            </div>
          )}
          {rawOrders.map(order => (
            <Card key={order.rowIndex} className="bg-[#2A1810] border-[#3D2B24] overflow-hidden">
              <CardHeader className="p-3 flex flex-row items-center justify-between border-b border-[#3D2B24]/50">
                <div>
                  <span className="text-sm font-black text-[#D4A853]">
                    {order.tableNumber === 'Takeout' ? '📦 بیرون‌بر' : `میز ${order.tableNumber}`}
                  </span>
                  <p className="text-[10px] text-[#5A4A44] mt-0.5">{order.timestamp}</p>
                </div>
                <span className="text-[10px] bg-[#D4A853]/10 text-[#D4A853] px-2 py-1 rounded-full font-bold border border-[#D4A853]/20">جدید</span>
              </CardHeader>
              <CardContent className="p-3 space-y-3">
                <p className="text-sm text-[#F5E6D3] leading-relaxed">{order.items}</p>
                <div className="flex items-center justify-between">
                  <span className="text-base font-black text-[#D4A853]">{(Number(order.totalPrice) / 1000).toLocaleString()} تومان</span>
                </div>
                <Button onClick={() => handleDeleteOrder(order)} className="w-full bg-green-700 hover:bg-green-600 text-white text-xs font-black h-10 active:scale-95 transition-transform gap-2">
                  <Check size={14} /> انجام شد
                </Button>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* MENU */}
        <TabsContent value="menu">
          <AdminMenuManager menu={menu} setMenu={setMenu} />
        </TabsContent>

        {/* FEEDBACK */}
        <TabsContent value="feedback" className="space-y-3">
          {feedback.length === 0 && <p className="text-center text-[#5A4A44] py-10 text-sm">هیچ نظری ثبت نشده</p>}
          {feedback.map((f: any) => (
            <div key={f.id} className="bg-[#2A1810] p-4 rounded-xl border border-[#3D2B24]">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-black text-[#F5E6D3]">{f.name}</p>
                  <div className="flex gap-0.5 mt-1">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={10} fill={f.rating > i ? '#D4A853' : 'transparent'} color={f.rating > i ? '#D4A853' : '#3D2B24'} />
                    ))}
                  </div>
                </div>
                <span className="text-[9px] text-[#5A4A44]">{f.timestamp}</span>
              </div>
              {f.comment && <p className="text-xs text-[#A89B95] mt-2 pt-2 border-t border-[#3D2B24]">{f.comment}</p>}
            </div>
          ))}
        </TabsContent>

        {/* GALLERY */}
        <TabsContent value="gallery">
          <AdminGalleryManager gallery={gallery} setGallery={setGallery} />
        </TabsContent>

        {/* QR */}
        <TabsContent value="qrcodes">
          <AdminQRCodeManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ============================================================
// ADMIN MENU MANAGER
// ============================================================
function AdminMenuManager({ menu, setMenu }: any) {
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const emptyForm = { name: '', price: 0, category: 'HOT' as Category, emoji: '☕', description: '', image: '' };
  const [form, setForm] = useState<Partial<MenuItem>>(emptyForm);

  const handleSave = () => {
    if (!form.name?.trim()) return;
    let newMenu: MenuItem[];
    if (editingId) {
      newMenu = menu.map((m: any) => m.id === editingId ? { ...m, ...form } : m);
    } else {
      newMenu = [{ ...form, id: Date.now().toString() } as MenuItem, ...menu];
    }
    setMenu(newMenu);
    setIsOpen(false);
    setEditingId(null);
    setForm(emptyForm);
  };

  const handleEdit = (item: any) => {
    setForm({ name: item.name, price: item.price, category: item.category, emoji: item.emoji, description: item.description, image: item.image || '' });
    setEditingId(item.id);
    setIsOpen(true);
  };

  const handleDelete = (id: string) => {
    const newMenu = menu.filter((m: any) => m.id !== id);
    setMenu(newMenu);
  };

  const handleImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setForm(f => ({ ...f, image: reader.result as string }));
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-3">
      <Button
        onClick={() => { setIsOpen(!isOpen); setEditingId(null); setForm(emptyForm); }}
        className="w-full bg-[#D4A853] text-[#1C0F0A] font-black h-11 active:scale-95 transition-transform">
        {isOpen && !editingId ? 'انصراف' : '+ افزودن آیتم جدید'}
      </Button>

      {isOpen && (
        <Card className="bg-[#2A1810] border-[#D4A853]/20 p-4 space-y-3">
          <p className="text-xs font-black text-[#D4A853]">{editingId ? 'ویرایش آیتم' : 'آیتم جدید'}</p>
          <Input placeholder="نام آیتم *" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="bg-[#1C0F0A] border-[#3D2B24] h-10 text-sm" />
          <div className="grid grid-cols-2 gap-2">
            <Input type="number" placeholder="قیمت (تومان)" value={form.price || ''} onChange={e => setForm(f => ({ ...f, price: Number(e.target.value) }))} className="bg-[#1C0F0A] border-[#3D2B24] h-10 text-sm" />
            <Input placeholder="ایموجی" value={form.emoji} onChange={e => setForm(f => ({ ...f, emoji: e.target.value }))} className="bg-[#1C0F0A] border-[#3D2B24] h-10 text-sm text-center" />
          </div>
          <Select value={form.category} onValueChange={(v: Category) => setForm(f => ({ ...f, category: v }))}>
            <SelectTrigger className="bg-[#1C0F0A] border-[#3D2B24] h-10 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent className="bg-[#2A1810] border-[#3D2B24]">
              <SelectItem value="HOT">☕ بار گرم</SelectItem>
              <SelectItem value="COLD">🍹 بار سرد</SelectItem>
              <SelectItem value="DESSERT">🍰 دسر</SelectItem>
            </SelectContent>
          </Select>
          <Textarea placeholder="توضیحات" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="bg-[#1C0F0A] border-[#3D2B24] text-sm min-h-[70px]" />
          <div className="flex items-center gap-2">
            {form.image && (
              <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0 border border-[#3D2B24]">
                <img src={form.image} className="w-full h-full object-cover" alt="" />
              </div>
            )}
            <label className="flex-1 bg-[#1C0F0A] h-10 rounded-lg border border-[#3D2B24] flex items-center justify-center cursor-pointer text-[10px] font-black text-[#A89B95] gap-2 active:opacity-70">
              <Upload size={14} /> آپلود تصویر
              <input type="file" className="hidden" accept="image/*" onChange={handleImage} />
            </label>
          </div>
          <Button onClick={handleSave} className="w-full bg-[#D4A853] text-[#1C0F0A] font-black h-10 active:scale-95 transition-transform">
            {editingId ? 'ذخیره تغییرات' : 'افزودن آیتم'}
          </Button>
          {editingId && (
            <Button onClick={() => { setIsOpen(false); setEditingId(null); setForm(emptyForm); }} variant="ghost" className="w-full text-[#5A4A44] h-8 text-xs">
              انصراف از ویرایش
            </Button>
          )}
        </Card>
      )}

      <div className="space-y-2">
        {menu.map((m: any) => (
          <div key={m.id} className="bg-[#2A1810] p-3 rounded-xl flex items-center gap-3 border border-[#3D2B24]">
            <div className="w-9 h-9 rounded-lg bg-[#1C0F0A] border border-[#3D2B24] flex items-center justify-center overflow-hidden shrink-0">
              {m.image ? <img src={m.image} className="w-full h-full object-cover" alt="" /> : <span className="text-sm">{m.emoji}</span>}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-[#F5E6D3] truncate">{m.name}</p>
              <p className="text-[10px] text-[#D4A853] font-black">{(m.price / 1000).toLocaleString()} تومان</p>
            </div>
            <button onClick={() => handleEdit(m)} className="text-[#D4A853]/40 hover:text-[#D4A853] transition-colors p-1">
              <Pencil size={14} />
            </button>
            <button onClick={() => handleDelete(m.id)} className="text-red-500/30 hover:text-red-500 transition-colors p-1">
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// ADMIN GALLERY MANAGER
// ============================================================
function AdminGalleryManager({ gallery, setGallery }: any) {
  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const newItem = {
        id: Date.now().toString(),
        url: reader.result as string,
        timestamp: new Date().toLocaleString('fa-IR'),
        isNew: true,
      };
      setGallery((prev: any[]) => [newItem, ...prev]);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-3">
      <label className="w-full bg-[#D4A853] text-[#1C0F0A] font-black h-11 rounded-xl flex items-center justify-center cursor-pointer gap-2 active:scale-95 transition-transform">
        <Upload size={16} /> افزودن تصویر
        <input type="file" className="hidden" accept="image/*" onChange={handleUpload} />
      </label>
      {gallery.length === 0 && <p className="text-center text-[#5A4A44] py-8 text-sm">هنوز تصویری آپلود نشده</p>}
      <div className="grid grid-cols-3 gap-2">
        {gallery.map((img: any) => (
          <div key={img.id} className="relative aspect-square rounded-lg overflow-hidden group">
            <img src={img.url} className="w-full h-full object-cover" alt="" />
            <button
              onClick={() => setGallery((prev: any[]) => prev.filter((x: any) => x.id !== img.id))}
              className="absolute inset-0 bg-red-500/50 flex items-center justify-center opacity-0 group-hover:opacity-100 active:opacity-100 transition-opacity">
              <Trash2 size={18} className="text-white" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// ADMIN QR CODE MANAGER
// ============================================================
function AdminQRCodeManager() {
  const [siteUrl, setSiteUrl] = useState('');
  useEffect(() => { setSiteUrl(window.location.origin + window.location.pathname.replace(/\/$/, '')); }, []);

  const downloadQR = async (num: number) => {
    const url = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(siteUrl + '?table=' + num)}`;
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `didar-table-${num}.png`;
      a.click();
    } catch { /* silent */ }
  };

  return (
    <div className="space-y-3">
      <p className="text-xs text-[#5A4A44] font-bold">کدهای QR برای ۱۵ میز</p>
      <div className="grid grid-cols-2 gap-3">
        {Array.from({ length: 15 }, (_, i) => i + 1).map(num => (
          <div key={num} className="bg-[#2A1810] p-3 rounded-xl border border-[#3D2B24] flex flex-col items-center gap-2">
            <span className="text-xs font-black text-[#F5E6D3]">میز {num}</span>
            <div className="bg-white p-1.5 rounded-lg">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(siteUrl + '?table=' + num)}`}
                alt={`QR میز ${num}`}
                className="w-28 h-28"
                loading="lazy"
              />
            </div>
            <Button onClick={() => downloadQR(num)} className="w-full bg-[#3D2B24] hover:bg-[#D4A853] hover:text-[#1C0F0A] text-[#A89B95] text-[10px] font-black h-8 transition-all gap-1 active:scale-95">
              <Download size={12} /> دانلود
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
ENDOFFILE
echo "Done"
