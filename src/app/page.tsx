/* eslint-disable @next/next/no-img-element */
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { View, MenuItem, OrderItem, Category, Order } from '@/lib/types';
import { 
  getStoredMenu, 
  getStoredOrders, 
  saveOrder, 
  saveMenu,
  getStoredGallery,
  saveGalleryImage,
  getStoredFeedback,
  saveFeedback
} from '@/lib/storage';
import { Coffee, MessageCircle, Star, Image as ImageIcon, ShoppingCart, CheckCircle2, Plus, Minus, Trash2, QrCode, LogIn, LayoutDashboard, PlusCircle, Pencil, Save, X, Settings2, BarChart3, ListOrdered } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { generateMenuItemDescription } from '@/ai/flows/generate-menu-item-description';
import { summarizeCustomerFeedback } from '@/ai/flows/summarize-customer-feedback-flow';

export default function CafeDidarApp() {
  const [currentView, setCurrentView] = useState<View>('MENU');
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [activeCategory, setActiveCategory] = useState<Category>('HOT');
  const [tableNumber, setTableNumber] = useState('');
  const [isLogoTapped, setIsLogoTapped] = useState(0);
  const [isSuccess, setIsSuccess] = useState(false);
  
  useEffect(() => {
    setMenu(getStoredMenu());
    const params = new URLSearchParams(window.location.search);
    const table = params.get('table');
    if (table) setTableNumber(table);
  }, []);

  const addToCart = (item: MenuItem) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const removeFromCart = (itemId: string) => {
    setCart(prev => prev.filter(i => i.id !== itemId));
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

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handlePlaceOrder = () => {
    if (!tableNumber) {
      alert('لطفاً شماره میز خود را وارد کنید.');
      return;
    }
    const newOrder: Order = {
      id: Math.random().toString(36).substr(2, 9),
      tableNumber,
      items: [...cart],
      totalPrice: cartTotal,
      timestamp: new Date().toISOString(),
      status: 'NEW'
    };
    saveOrder(newOrder);
    setIsSuccess(true);
    setTimeout(() => {
      setIsSuccess(false);
      setCart([]);
      setCurrentView('MENU');
    }, 2000);
  };

  const handleLogoClick = () => {
    setIsLogoTapped(prev => prev + 1);
    if (isLogoTapped + 1 >= 3) {
      setCurrentView('ADMIN_LOGIN');
      setIsLogoTapped(0);
    }
  };

  return (
    <div className="flex flex-col min-h-screen max-w-[500px] mx-auto relative overflow-x-hidden bg-[#1C0F0A]">
      <header className="h-[60px] flex items-center justify-between px-4 bg-black/40 backdrop-blur-lg border-b border-[#D4A853]/30 shadow-[0_0_15px_rgba(212,168,83,0.2)] fixed top-0 w-full max-w-[500px] z-[100]">
        <div className="flex items-center gap-2">
          {currentView === 'MENU' && (
            <button 
              onClick={() => setCurrentView('CART')}
              className="relative flex items-center gap-1 bg-[#2A1810]/60 backdrop-blur-sm px-2 py-1.5 rounded-lg border border-[#D4A853]/40 transition-all hover:bg-[#2A1810]"
            >
              <ShoppingCart size={16} className="text-[#D4A853]" />
              <span className="text-[10px] text-[#F5E6D3] font-bold">سبد خرید</span>
              {cartItemCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-[#D4A853] text-[#1C0F0A] text-[10px] w-5 h-5 flex items-center justify-center rounded-full font-bold shadow-[0_0_10px_rgba(212,168,83,0.5)]">
                  {cartItemCount}
                </span>
              )}
            </button>
          )}
          {currentView !== 'MENU' && currentView !== 'ADMIN_LOGIN' && currentView !== 'ADMIN_DASHBOARD' && (
            <button onClick={() => setCurrentView('MENU')} className="text-[#D4A853] text-sm font-bold flex items-center gap-1">
              <Plus size={16} className="rotate-45" /> بازگشت
            </button>
          )}
          {(currentView === 'ADMIN_LOGIN' || currentView === 'ADMIN_DASHBOARD') && (
            <button onClick={() => setCurrentView('MENU')} className="text-[#D4A853] text-sm font-bold flex items-center gap-1">
              <X size={16} /> خروج
            </button>
          )}
        </div>
        <h1 
          onClick={handleLogoClick}
          className="text-[#D4A853] font-bold text-xl cursor-pointer select-none tracking-wider drop-shadow-[0_0_5px_rgba(212,168,83,0.4)]"
        >
          کافه دیدار
        </h1>
      </header>

      <main className="mt-[60px] mb-[70px] flex-1 overflow-y-auto overflow-x-hidden relative">
        {currentView === 'MENU' && (
          <MenuView 
            activeCategory={activeCategory} 
            setActiveCategory={setActiveCategory} 
            menu={menu} 
            cart={cart}
            addToCart={addToCart} 
            updateQuantity={updateQuantity}
          />
        )}
        {currentView === 'CART' && <CartView cart={cart} updateQuantity={updateQuantity} removeFromCart={removeFromCart} total={cartTotal} tableNumber={tableNumber} setTableNumber={setTableNumber} onPlaceOrder={handlePlaceOrder} isSuccess={isSuccess} />}
        {currentView === 'FEEDBACK' && <FeedbackView />}
        {currentView === 'LOYALTY' && <LoyaltyView />}
        {currentView === 'GALLERY' && <GalleryView />}
        {currentView === 'ADMIN_LOGIN' && <AdminLogin onLoginSuccess={() => setCurrentView('ADMIN_DASHBOARD')} />}
        {currentView === 'ADMIN_DASHBOARD' && <AdminDashboard menu={menu} setMenu={setMenu} />}
      </main>

      <nav className="h-[70px] bg-[#1C0F0A]/90 backdrop-blur-md border-t border-[#3D2B24] fixed bottom-0 w-full max-w-[500px] z-50 flex items-center justify-around px-2">
        <NavButton active={currentView === 'MENU'} icon={<Coffee size={20} />} label="منو" onClick={() => setCurrentView('MENU')} />
        <NavButton active={currentView === 'FEEDBACK'} icon={<MessageCircle size={20} />} label="نظرات" onClick={() => setCurrentView('FEEDBACK')} />
        <NavButton active={currentView === 'LOYALTY'} icon={<Star size={20} />} label="باشگاه" onClick={() => setCurrentView('LOYALTY')} />
        <NavButton active={currentView === 'GALLERY'} icon={<ImageIcon size={20} />} label="گالری" onClick={() => setCurrentView('GALLERY')} />
      </nav>
    </div>
  );
}

function NavButton({ active, icon, label, onClick }: { active: boolean, icon: React.ReactNode, label: string, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={`flex flex-col items-center gap-1 transition-all duration-300 ${active ? 'text-[#D4A853] drop-shadow-[0_0_8px_rgba(212,168,83,0.5)]' : 'text-[#A89B95]'}`}
    >
      {icon}
      <span className="text-[10px] font-bold">{label}</span>
    </button>
  );
}

function MenuView({ 
  activeCategory, 
  setActiveCategory, 
  menu, 
  cart, 
  addToCart, 
  updateQuantity 
}: { 
  activeCategory: Category, 
  setActiveCategory: (c: Category) => void, 
  menu: MenuItem[], 
  cart: OrderItem[],
  addToCart: (i: MenuItem) => void,
  updateQuantity: (id: string, delta: number) => void
}) {
  const filteredItems = useMemo(() => menu.filter(i => i.category === activeCategory), [menu, activeCategory]);

  return (
    <div className="animate-fade-in">
      <div className="flex w-full bg-[#1C0F0A]/80 backdrop-blur-md sticky top-0 z-40 border-b border-[#3D2B24]">
        <CategoryTab active={activeCategory === 'HOT'} label="☕ بار گرم" onClick={() => setActiveCategory('HOT')} />
        <CategoryTab active={activeCategory === 'COLD'} label="🍹 بار سرد" onClick={() => setActiveCategory('COLD')} />
        <CategoryTab active={activeCategory === 'DESSERT'} label="🍰 دسر" onClick={() => setActiveCategory('DESSERT')} />
      </div>
      <div className="p-4 space-y-4">
        {filteredItems.map((item, idx) => {
          const cartItem = cart.find(i => i.id === item.id);
          return (
            <div key={item.id} className="bg-[#2A1810] border border-[#3D2B24] rounded-2xl p-3 flex items-center gap-3 animate-fade-in group hover:border-[#D4A853]/30 transition-all" style={{ animationDelay: `${idx * 0.05}s` }}>
              <div className="w-[70px] h-[70px] bg-[#3D2B24] rounded-xl flex items-center justify-center text-3xl overflow-hidden shrink-0 shadow-lg">
                {item.image ? <img src={item.image} alt={item.name} className="w-full h-full object-cover" /> : item.emoji}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-[#F5E6D3] font-bold text-sm truncate">{item.name}</h3>
                <p className="text-[#A89B95] text-[11px] leading-tight mb-2 line-clamp-2">{item.description}</p>
                <div className="flex items-center justify-between mt-auto">
                  <span className="text-[#D4A853] font-bold text-sm">{(item.price / 1000).toLocaleString()} <span className="text-[10px]">تومان</span></span>
                  
                  {cartItem ? (
                    <div className="flex items-center gap-2 bg-[#1C0F0A] rounded-full px-2 py-1 border border-[#3D2B24] scale-90 origin-left">
                      <button 
                        onClick={() => updateQuantity(item.id, -1)} 
                        className="p-1 text-[#D4A853] hover:bg-[#D4A853]/10 rounded-full transition-colors"
                      >
                        <Minus size={14} />
                      </button>
                      <span className="text-xs font-bold w-4 text-center text-[#F5E6D3]">{cartItem.quantity}</span>
                      <button 
                        onClick={() => updateQuantity(item.id, 1)} 
                        className="p-1 text-[#D4A853] hover:bg-[#D4A853]/10 rounded-full transition-colors"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  ) : (
                    <button 
                      onClick={() => addToCart(item)}
                      className="bg-[#D4A853] text-[#1C0F0A] px-4 py-1.5 rounded-full text-xs font-bold active:scale-95 transition-all flex items-center gap-1 shrink-0 shadow-[0_2px_8px_rgba(212,168,83,0.3)] hover:shadow-[0_4px_12px_rgba(212,168,83,0.5)]"
                    >
                      <Plus size={14} /> افزودن
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

function CategoryTab({ active, label, onClick }: { active: boolean, label: string, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={`flex-1 py-3 text-xs font-bold transition-all ${active ? 'bg-[#D4A853] text-[#1C0F0A] shadow-inner' : 'text-[#A89B95] hover:text-[#F5E6D3]'}`}
    >
      {label}
    </button>
  );
}

function CartView({ cart, updateQuantity, removeFromCart, total, tableNumber, setTableNumber, onPlaceOrder, isSuccess }: any) {
  if (isSuccess) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] animate-fade-in">
        <div className="w-20 h-20 bg-[#D4A853] rounded-full flex items-center justify-center mb-4 text-[#1C0F0A] animate-bounce-subtle">
          <CheckCircle2 size={48} />
        </div>
        <h2 className="text-xl font-bold text-[#D4A853]">سفارش شما ثبت شد!</h2>
        <p className="text-[#A89B95] mt-2">لحظاتی دیگر در خدمت شما هستیم.</p>
      </div>
    );
  }

  return (
    <div className="p-4 animate-slide-up h-full">
      <h2 className="text-xl font-bold mb-6 text-[#D4A853] border-b border-[#3D2B24] pb-2">🧾 صورت حساب</h2>
      {cart.length === 0 ? (
        <div className="text-center text-[#A89B95] mt-20">سبد خرید شما خالی است.</div>
      ) : (
        <div className="space-y-4">
          {cart.map((item: any) => (
            <div key={item.id} className="bg-[#2A1810] border border-[#3D2B24] rounded-lg p-3 flex items-center gap-3">
              <div className="flex-1">
                <h4 className="font-bold text-sm">{item.name}</h4>
                <p className="text-[#D4A853] text-xs">{(item.price * item.quantity / 1000).toLocaleString()} تومان</p>
              </div>
              <div className="flex items-center gap-2 bg-[#1C0F0A] rounded-full px-2 py-1">
                <button onClick={() => updateQuantity(item.id, -1)} className="p-1 text-[#D4A853]"><Minus size={14} /></button>
                <span className="text-xs font-bold w-4 text-center">{item.quantity}</span>
                <button onClick={() => updateQuantity(item.id, 1)} className="p-1 text-[#D4A853]"><Plus size={14} /></button>
              </div>
              <button onClick={() => removeFromCart(item.id)} className="text-red-500/50 hover:text-red-500"><Trash2 size={16} /></button>
            </div>
          ))}
          
          <div className="pt-6 border-t border-[#3D2B24] mt-6">
            <div className="flex justify-between mb-4">
              <span className="text-[#A89B95]">جمع کل:</span>
              <span className="text-lg font-bold text-[#D4A853]">{(total / 1000).toLocaleString()} تومان</span>
            </div>
            <div className="space-y-2">
              <label className="text-xs text-[#A89B95]">شماره میز:</label>
              <Input 
                value={tableNumber} 
                onChange={(e) => setTableNumber(e.target.value)} 
                placeholder="شماره میز را وارد کنید" 
                className="bg-[#2A1810] border-[#3D2B24] text-center font-bold text-lg"
              />
            </div>
            <Button onClick={onPlaceOrder} className="w-full mt-6 bg-[#D4A853] hover:bg-[#D4A853]/80 text-[#1C0F0A] font-bold h-12 text-lg rounded-xl shadow-lg">
              ✅ ثبت سفارش
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function FeedbackView() {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    if (rating === 0) return;
    saveFeedback({
      id: Math.random().toString(),
      rating,
      comment,
      timestamp: new Date().toISOString()
    });
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="p-6 text-center animate-fade-in">
        <div className="text-[#D4A853] mb-4"><CheckCircle2 size={60} className="mx-auto" /></div>
        <h2 className="text-xl font-bold">سپاس از نظر شما!</h2>
        <p className="text-[#A89B95] mt-2">نظرات شما به ما در بهبود خدمات کمک می‌کند.</p>
      </div>
    );
  }

  return (
    <div className="p-6 animate-fade-in">
      <h2 className="text-xl font-bold mb-6 text-[#D4A853]">💬 نظرات و پیشنهادات</h2>
      <div className="flex justify-center gap-2 mb-8">
        {[1, 2, 3, 4, 5].map(star => (
          <button key={star} onClick={() => setRating(star)} className="transition-transform active:scale-125">
            <Star size={32} fill={star <= rating ? '#D4A853' : 'transparent'} color={star <= rating ? '#D4A853' : '#3D2B24'} />
          </button>
        ))}
      </div>
      <Textarea 
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="نظر خود را در مورد کافه دیدار بنویسید..."
        className="bg-[#2A1810] border-[#3D2B24] min-h-[150px] mb-6 rounded-xl"
      />
      <Button onClick={handleSubmit} className="w-full bg-[#D4A853] text-[#1C0F0A] font-bold h-12 rounded-xl">ارسال نظر</Button>
    </div>
  );
}

function LoyaltyView() {
  const [phone, setPhone] = useState('');
  const [account, setAccount] = useState<{points: number} | null>(null);

  const handleSearch = () => {
    const loyalty = JSON.parse(localStorage.getItem('cafe_loyalty') || '{}');
    setAccount({ points: loyalty[phone] || 0 });
  };

  return (
    <div className="p-6 animate-fade-in">
      <h2 className="text-xl font-bold mb-6 text-[#D4A853]">⭐ باشگاه مشتریان</h2>
      {!account ? (
        <div className="space-y-4">
          <p className="text-[#A89B95] text-sm">برای مشاهده امتیازات خود، شماره موبایل‌تان را وارد کنید:</p>
          <Input 
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="مثلاً ۰۹۱۲۳۴۵۶۷۸۹"
            className="bg-[#2A1810] border-[#3D2B24] text-center rounded-xl"
          />
          <Button onClick={handleSearch} className="w-full bg-[#D4A853] text-[#1C0F0A] font-bold rounded-xl">جستجو</Button>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="relative h-[200px] w-full rounded-2xl bg-gradient-to-br from-[#D4A853] via-[#B88A3E] to-[#D4A853] p-6 text-[#1C0F0A] shadow-xl overflow-hidden animate-fade-in">
             <div className="absolute top-[-50px] right-[-50px] w-[150px] h-[150px] bg-white/10 rounded-full blur-3xl"></div>
             <div className="relative z-10 flex flex-col h-full justify-between">
                <div>
                  <h3 className="font-bold text-lg">کارت عضویت ویژه</h3>
                  <p className="text-[10px] opacity-80">VIP LOYALTY CARD</p>
                </div>
                <div className="flex justify-between items-end">
                   <div>
                     <p className="text-[10px] opacity-80">امتیاز فعلی</p>
                     <p className="text-3xl font-bold">{account.points}</p>
                   </div>
                   <div className="text-right">
                      <p className="text-[10px] opacity-80">{phone}</p>
                      <p className="font-bold text-sm">Cafe Didar</p>
                   </div>
                </div>
             </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-[#A89B95]">
              <span>پیشرفت تا قهوه رایگان</span>
              <span>{Math.min(100, account.points % 100)}%</span>
            </div>
            <div className="h-2 w-full bg-[#2A1810] rounded-full overflow-hidden border border-[#3D2B24]">
              <div 
                className="h-full bg-[#D4A853] transition-all duration-1000" 
                style={{ width: `${Math.min(100, account.points % 100)}%` }}
              ></div>
            </div>
            <p className="text-[10px] text-center text-[#A89B95]">با هر ۱۰۰ امتیاز، یک قهوه رایگان هدیه بگیرید!</p>
          </div>
          <Button onClick={() => setAccount(null)} variant="outline" className="w-full border-[#3D2B24] text-[#A89B95] rounded-xl">تغییر شماره</Button>
        </div>
      )}
    </div>
  );
}

function GalleryView() {
  const [images, setImages] = useState<string[]>([]);
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    setImages(getStoredGallery());
  }, []);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        saveGalleryImage(base64);
        setImages(prev => [base64, ...prev]);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="p-4 animate-fade-in">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-[#D4A853]">📸 گالری دیدار</h2>
        <label className="bg-[#D4A853] text-[#1C0F0A] px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all hover:shadow-[0_0_10px_rgba(212,168,83,0.5)]">
          آپلود عکس
          <input type="file" className="hidden" accept="image/*" onChange={handleUpload} />
        </label>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {images.map((img, i) => (
          <div key={i} onClick={() => setPreview(img)} className="aspect-square bg-[#2A1810] rounded-xl border border-[#3D2B24] overflow-hidden cursor-pointer active:scale-95 transition-transform">
            <img src={img} alt="Cafe" className="w-full h-full object-cover" />
          </div>
        ))}
      </div>
      {preview && (
        <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4 animate-fade-in" onClick={() => setPreview(null)}>
           <img src={preview} alt="Preview" className="max-w-full max-h-full object-contain rounded-lg shadow-2xl" />
           <button className="absolute top-4 right-4 text-white bg-black/50 p-2 rounded-full"><Plus className="rotate-45" /></button>
        </div>
      )}
    </div>
  );
}

function AdminLogin({ onLoginSuccess }: { onLoginSuccess: () => void }) {
  const [pass, setPass] = useState('');
  const [err, setErr] = useState(false);

  const handleLogin = () => {
    if (pass === 'didar1234') {
      onLoginSuccess();
    } else {
      setErr(true);
    }
  };

  return (
    <div className="p-8 flex flex-col items-center justify-center h-[70vh] animate-fade-in">
      <LogIn size={48} className="text-[#D4A853] mb-4" />
      <h2 className="text-xl font-bold mb-6 text-[#F5E6D3]">ورود به مدیریت</h2>
      <Input 
        type="password"
        value={pass}
        onChange={(e) => setPass(e.target.value)}
        placeholder="رمز عبور"
        className="bg-[#2A1810] border-[#3D2B24] mb-4 text-center rounded-xl"
      />
      {err && <p className="text-red-500 text-xs mb-4">رمز عبور اشتباه است!</p>}
      <Button onClick={handleLogin} className="w-full bg-[#D4A853] text-[#1C0F0A] font-bold rounded-xl h-12">ورود</Button>
    </div>
  );
}

function AdminDashboard({ menu, setMenu }: { menu: MenuItem[], setMenu: any }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [feedback, setFeedback] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);

  useEffect(() => {
    setOrders(getStoredOrders());
    setFeedback(getStoredFeedback());
    const interval = setInterval(() => {
      setOrders(getStoredOrders());
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleUpdateStatus = (id: string, status: Order['status']) => {
    const updated = orders.map(o => o.id === id ? { ...o, status } : o);
    setOrders(updated);
    localStorage.setItem('cafe_orders', JSON.stringify(updated));
  };

  const handleSummarizeFeedback = async () => {
    if (feedback.length === 0) return;
    setIsLoadingSummary(true);
    try {
      const result = await summarizeCustomerFeedback({ 
        feedback: feedback.map(f => ({ 
          comment: f.comment, 
          rating: f.rating, 
          timestamp: f.timestamp 
        })) 
      });
      setSummary(result);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingSummary(false);
    }
  };

  const newOrdersCount = orders.filter(o => o.status === 'NEW').length;

  return (
    <div className="p-4 animate-fade-in bg-[#1C0F0A] min-h-screen">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-[#D4A853] flex items-center gap-2">
          <Settings2 size={24} /> پنل مدیریت هوشمند
        </h2>
        {newOrdersCount > 0 && (
          <Badge className="bg-red-500 animate-pulse py-1 px-3">
            {newOrdersCount} سفارش جدید
          </Badge>
        )}
      </div>

      <Tabs defaultValue="orders" className="w-full">
        <TabsList className="bg-[#2A1810] border border-[#3D2B24] grid grid-cols-4 h-12 rounded-xl mb-6 p-1">
          <TabsTrigger value="orders" className="text-[10px] font-bold data-[state=active]:bg-[#D4A853] data-[state=active]:text-[#1C0F0A] rounded-lg">
            <ListOrdered size={14} className="ml-1" /> سفارش‌ها
          </TabsTrigger>
          <TabsTrigger value="menu" className="text-[10px] font-bold data-[state=active]:bg-[#D4A853] data-[state=active]:text-[#1C0F0A] rounded-lg">
            <Coffee size={14} className="ml-1" /> منو
          </TabsTrigger>
          <TabsTrigger value="feedback" className="text-[10px] font-bold data-[state=active]:bg-[#D4A853] data-[state=active]:text-[#1C0F0A] rounded-lg">
            <MessageCircle size={14} className="ml-1" /> نظرات
          </TabsTrigger>
          <TabsTrigger value="qr" className="text-[10px] font-bold data-[state=active]:bg-[#D4A853] data-[state=active]:text-[#1C0F0A] rounded-lg">
            <QrCode size={14} className="ml-1" /> QR
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="orders" className="space-y-4">
          {orders.length === 0 ? (
            <div className="text-center py-20 text-[#A89B95]">سفارشی ثبت نشده است.</div>
          ) : (
            orders.map(order => (
              <Card key={order.id} className="bg-[#2A1810] border-[#3D2B24] overflow-hidden">
                <CardHeader className="p-4 pb-2 border-b border-[#3D2B24]/50 flex flex-row items-center justify-between space-y-0">
                  <div className="flex items-center gap-2">
                    <div className="bg-[#D4A853] text-[#1C0F0A] w-10 h-10 rounded-lg flex items-center justify-center font-bold text-xl">
                      {order.tableNumber}
                    </div>
                    <div>
                      <CardTitle className="text-sm">سفارش #{order.id.slice(-4)}</CardTitle>
                      <CardDescription className="text-[10px] text-[#A89B95]">
                        {new Date(order.timestamp).toLocaleTimeString('fa-IR')}
                      </CardDescription>
                    </div>
                  </div>
                  <Badge variant={order.status === 'DELIVERED' ? 'secondary' : 'default'} className={order.status === 'NEW' ? 'bg-red-500' : ''}>
                    {order.status === 'NEW' ? 'جدید' : order.status === 'PREPARING' ? 'آماده‌سازی' : 'تحویل شده'}
                  </Badge>
                </CardHeader>
                <CardContent className="p-4">
                  <ul className="text-sm space-y-2 mb-4">
                    {order.items.map((item, i) => (
                      <li key={i} className="flex justify-between items-center bg-[#1C0F0A]/50 p-2 rounded-lg border border-[#3D2B24]/30">
                        <span className="font-bold">{item.name}</span>
                        <span className="text-[#D4A853]">× {item.quantity}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="flex justify-between items-center mb-4 pt-2 border-t border-[#3D2B24]/30">
                     <span className="text-[#A89B95] text-xs">جمع کل:</span>
                     <span className="font-bold text-[#D4A853]">{(order.totalPrice / 1000).toLocaleString()} تومان</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Button 
                      size="sm" 
                      onClick={() => handleUpdateStatus(order.id, 'PREPARING')}
                      disabled={order.status !== 'NEW'}
                      className="bg-blue-600 hover:bg-blue-700 text-white text-[10px] rounded-lg h-9"
                    >
                      شروع آماده‌سازی
                    </Button>
                    <Button 
                      size="sm" 
                      onClick={() => handleUpdateStatus(order.id, 'DELIVERED')}
                      disabled={order.status === 'DELIVERED'}
                      className="bg-green-600 hover:bg-green-700 text-white text-[10px] rounded-lg h-9"
                    >
                      تایید تحویل
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="menu">
           <AdminMenuManager menu={menu} setMenu={setMenu} />
        </TabsContent>

        <TabsContent value="feedback" className="space-y-4">
           <Card className="bg-[#2A1810] border-[#D4A853]/30">
              <CardHeader className="p-4">
                <CardTitle className="text-md flex items-center gap-2">
                  <BarChart3 size={18} /> تحلیل هوشمند نظرات
                </CardTitle>
                <CardDescription className="text-xs">با استفاده از هوش مصنوعی، خلاصه‌ای از تجربه مشتریان را ببینید.</CardDescription>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <Button 
                  onClick={handleSummarizeFeedback} 
                  disabled={isLoadingSummary || feedback.length === 0}
                  className="w-full bg-[#D4A853] text-[#1C0F0A] rounded-xl font-bold h-10"
                >
                  {isLoadingSummary ? 'در حال تحلیل...' : 'تحلیل نظرات اخیر'}
                </Button>
                {summary && (
                  <div className="mt-4 bg-[#3D2B24]/50 p-4 rounded-xl border border-[#D4A853]/20 animate-fade-in">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs font-bold text-[#D4A853]">وضعیت کلی:</span>
                      <Badge className="bg-[#D4A853] text-[#1C0F0A]">{summary.overallSentiment}</Badge>
                    </div>
                    <p className="text-xs text-[#F5E6D3] leading-relaxed mb-4">{summary.summary}</p>
                    <div className="flex flex-wrap gap-1">
                      {summary.commonThemes.map((t: string, i: number) => (
                        <Badge key={i} variant="outline" className="text-[9px] border-[#D4A853]/20 text-[#D4A853] bg-[#D4A853]/5">
                          {t}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
           </Card>

           <div className="space-y-3">
             <h3 className="text-sm font-bold text-[#A89B95] pr-2">آخرین بازخوردها</h3>
             {feedback.map((f, i) => (
               <div key={i} className="bg-[#2A1810] border border-[#3D2B24] p-3 rounded-xl animate-fade-in" style={{ animationDelay: `${i * 0.1}s` }}>
                  <div className="flex justify-between mb-2">
                    <div className="flex gap-0.5">
                      {[1,2,3,4,5].map(s => <Star key={s} size={12} fill={s <= f.rating ? '#D4A853' : 'transparent'} color="#D4A853" />)}
                    </div>
                    <span className="text-[10px] text-[#A89B95]">{new Date(f.timestamp).toLocaleDateString('fa-IR')}</span>
                  </div>
                  <p className="text-xs text-[#F5E6D3] leading-relaxed">{f.comment}</p>
               </div>
             ))}
           </div>
        </TabsContent>

        <TabsContent value="qr" className="grid grid-cols-2 gap-4">
           {[...Array(10)].map((_, i) => (
             <Card key={i} className="bg-white p-3 rounded-2xl text-black border-none shadow-xl flex flex-col items-center group active:scale-95 transition-all">
                <p className="text-sm font-bold mb-2">میز {i+1}</p>
                <div className="bg-gray-50 p-2 rounded-xl border border-gray-100 mb-2">
                  <img 
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=https://rezaxm80-max.github.io/cafe-didar?table=${i+1}`} 
                    alt={`QR Table ${i+1}`}
                    className="w-full h-auto"
                  />
                </div>
                <Button size="sm" variant="ghost" className="text-[10px] h-7 w-full border-t border-gray-100 rounded-none hover:bg-gray-50">
                  دانلود QR
                </Button>
             </Card>
           ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function AdminMenuManager({ menu, setMenu }: { menu: MenuItem[], setMenu: any }) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [editForm, setEditForm] = useState<Partial<MenuItem>>({});
  const [isGenerating, setIsGenerating] = useState(false);

  const handleEdit = (item: MenuItem) => {
    setEditingId(item.id);
    setEditForm({ ...item }); // Ensure full object is copied
    setIsAdding(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAddNew = () => {
    setEditingId(null);
    setIsAdding(true);
    setEditForm({
      id: Math.random().toString(36).substr(2, 9),
      name: '',
      description: '',
      price: 0,
      category: 'HOT',
      emoji: '☕'
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSave = () => {
    if (!editForm.name || !editForm.price) {
      alert('لطفاً نام و قیمت را وارد کنید.');
      return;
    }
    let updated;
    if (isAdding) {
      updated = [...menu, editForm as MenuItem];
    } else {
      updated = menu.map(m => m.id === editingId ? { ...m, ...editForm } as MenuItem : m);
    }
    setMenu(updated);
    saveMenu(updated);
    setEditingId(null);
    setIsAdding(false);
    setEditForm({});
  };

  const handleDelete = (id: string) => {
    if (confirm('آیا از حذف این آیتم اطمینان دارید؟')) {
      const updated = menu.filter(m => m.id !== id);
      setMenu(updated);
      saveMenu(updated);
    }
  };

  const handleGenerateDesc = async () => {
    if (!editForm.name) return;
    setIsGenerating(true);
    try {
      const result = await generateMenuItemDescription({ 
        itemName: editForm.name, 
        keywords: [editForm.category || '', editForm.name] 
      });
      setEditForm(prev => ({ ...prev, description: result.description }));
    } catch (err) {
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditForm(prev => ({ ...prev, image: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-6">
      {!editingId && !isAdding && (
        <Button onClick={handleAddNew} className="w-full bg-[#D4A853] hover:bg-[#D4A853]/90 text-[#1C0F0A] rounded-xl flex items-center gap-2 font-bold h-12 shadow-lg shadow-[#D4A853]/10">
          <PlusCircle size={20} /> افزودن آیتم جدید به منو
        </Button>
      )}

      {(editingId || isAdding) && (
        <Card className="bg-[#2A1810] border-[#D4A853] p-5 rounded-3xl space-y-4 animate-slide-up shadow-2xl shadow-black/50">
           <div className="flex justify-between items-center mb-2">
              <div className="flex items-center gap-2 text-[#D4A853]">
                {isAdding ? <PlusCircle size={20} /> : <Pencil size={20} />}
                <h4 className="font-bold text-lg">{isAdding ? 'افزودن آیتم جدید' : 'ویرایش آیتم'}</h4>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => {setEditingId(null); setIsAdding(false); setEditForm({});}} 
                className="text-[#A89B95] hover:text-white"
              >
                <X size={20} />
              </Button>
           </div>
           
           <div className="space-y-4">
              <div className="flex gap-4 items-center">
                <div className="relative w-24 h-24 shrink-0">
                  <div className="w-full h-full bg-[#1C0F0A] rounded-2xl flex items-center justify-center overflow-hidden border-2 border-dashed border-[#3D2B24] group hover:border-[#D4A853]/50 transition-all">
                    {editForm.image ? (
                      <img src={editForm.image} alt="Upload" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-4xl">{editForm.emoji}</span>
                    )}
                    <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center cursor-pointer transition-opacity">
                      <ImageIcon size={20} className="text-white mb-1" />
                      <span className="text-[10px] text-white">تغییر عکس</span>
                      <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                    </label>
                  </div>
                </div>
                <div className="flex-1 space-y-3">
                  <div className="space-y-1">
                    <label className="text-[10px] text-[#A89B95] mr-1">نام محصول</label>
                    <Input 
                      value={editForm.name} 
                      onChange={e => setEditForm({...editForm, name: e.target.value})} 
                      placeholder="نام آیتم (مثلاً اسپرسو)" 
                      className="bg-[#1C0F0A] border-[#3D2B24] rounded-xl h-11 text-sm focus:border-[#D4A853]/50" 
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] text-[#A89B95] mr-1">دسته‌بندی</label>
                  <select 
                    value={editForm.category} 
                    onChange={e => setEditForm({...editForm, category: e.target.value as Category})}
                    className="bg-[#1C0F0A] border border-[#3D2B24] rounded-xl px-3 text-sm text-[#F5E6D3] h-11 w-full focus:outline-none focus:border-[#D4A853]/50"
                  >
                    <option value="HOT">☕ بار گرم</option>
                    <option value="COLD">🍹 بار سرد</option>
                    <option value="DESSERT">🍰 دسر</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-[#A89B95] mr-1">قیمت (تومان)</label>
                  <Input 
                    type="number" 
                    value={editForm.price} 
                    onChange={e => setEditForm({...editForm, price: Number(e.target.value)})} 
                    placeholder="قیمت" 
                    className="bg-[#1C0F0A] border-[#3D2B24] rounded-xl h-11 text-sm focus:border-[#D4A853]/50" 
                  />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between items-center mr-1">
                  <label className="text-[10px] text-[#A89B95]">توضیحات محصول</label>
                  <button 
                    onClick={handleGenerateDesc} 
                    disabled={isGenerating || !editForm.name}
                    className="text-[10px] text-[#D4A853] hover:underline flex items-center gap-1 disabled:opacity-50"
                  >
                    {isGenerating ? 'در حال تولید...' : 'تولید با هوش مصنوعی'} <Coffee size={12} />
                  </button>
                </div>
                <Textarea 
                  value={editForm.description} 
                  onChange={e => setEditForm({...editForm, description: e.target.value})} 
                  placeholder="توضیحات کوتاه درباره محصول بنویسید..." 
                  className="bg-[#1C0F0A] border-[#3D2B24] text-xs rounded-xl min-h-[100px] focus:border-[#D4A853]/50 leading-relaxed" 
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button onClick={handleSave} className="flex-1 bg-[#D4A853] text-[#1C0F0A] font-bold rounded-2xl h-12 flex items-center gap-2">
                  <Save size={18} /> {isAdding ? 'ثبت محصول' : 'ذخیره تغییرات'}
                </Button>
                <Button 
                  onClick={() => {setEditingId(null); setIsAdding(false); setEditForm({});}} 
                  variant="outline" 
                  className="flex-1 border-[#3D2B24] text-[#A89B95] hover:text-white rounded-2xl h-12"
                >
                  انصراف
                </Button>
              </div>
           </div>
        </Card>
      )}

      <div className="space-y-3">
        <div className="flex items-center justify-between px-2">
           <h3 className="text-sm font-bold text-[#A89B95]">لیست محصولات منو ({menu.length})</h3>
           <div className="flex gap-2">
              <Badge variant="outline" className="text-[9px] border-[#3D2B24]">گرم: {menu.filter(i => i.category === 'HOT').length}</Badge>
              <Badge variant="outline" className="text-[9px] border-[#3D2B24]">سرد: {menu.filter(i => i.category === 'COLD').length}</Badge>
           </div>
        </div>
        
        <div className="grid gap-3">
          {menu.map(item => (
            <div key={item.id} className="bg-[#2A1810] border border-[#3D2B24] p-3 rounded-2xl flex items-center justify-between group hover:border-[#D4A853]/40 transition-all duration-300">
               <div className="flex items-center gap-4">
                 <div className="w-12 h-12 bg-[#1C0F0A] rounded-xl flex items-center justify-center text-xl overflow-hidden shrink-0 border border-[#3D2B24]">
                    {item.image ? (
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                      <span>{item.emoji}</span>
                    )}
                 </div>
                 <div className="min-w-0">
                   <p className="font-bold text-sm text-[#F5E6D3] truncate">{item.name}</p>
                   <div className="flex items-center gap-2 mt-0.5">
                     <p className="text-[11px] text-[#D4A853] font-bold">{(item.price/1000).toLocaleString()} <span className="text-[8px]">تومان</span></p>
                     <span className="text-[8px] text-[#A89B95]">• {item.category === 'HOT' ? 'گرم' : item.category === 'COLD' ? 'سرد' : 'دسر'}</span>
                   </div>
                 </div>
               </div>
               <div className="flex gap-2">
                  <Button 
                    size="icon" 
                    onClick={() => handleEdit(item)} 
                    className="bg-[#D4A853]/10 text-[#D4A853] hover:bg-[#D4A853] hover:text-[#1C0F0A] w-9 h-9 rounded-xl transition-all"
                    title="ویرایش"
                  >
                    <Pencil size={16} />
                  </Button>
                  <Button 
                    size="icon" 
                    onClick={() => handleDelete(item.id)} 
                    className="bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white w-9 h-9 rounded-xl transition-all"
                    title="حذف"
                  >
                    <Trash2 size={16} />
                  </Button>
               </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
