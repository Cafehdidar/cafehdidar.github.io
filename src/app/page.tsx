/* eslint-disable @next/next/no-img-element */
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { View, MenuItem, OrderItem, Category, Order } from '@/lib/types';
import { 
  getStoredMenu, 
  getStoredOrders, 
  saveOrder, 
  updateLoyaltyPoints, 
  getStoredGallery,
  saveGalleryImage,
  getStoredFeedback,
  saveFeedback
} from '@/lib/storage';
import { Coffee, MessageCircle, Star, Image as ImageIcon, ShoppingCart, CheckCircle2, Plus, Minus, Trash2, QrCode, LogIn, LayoutDashboard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
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
        const newQty = Math.max(1, i.quantity + delta);
        return { ...i, quantity: newQty };
      }
      return i;
    }));
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
    <div className="flex flex-col min-h-screen max-w-[500px] mx-auto relative overflow-x-hidden">
      {/* Header */}
      <header className="h-[50px] flex items-center justify-between px-4 bg-[#1C0F0A] border-b border-[#3D2B24] fixed top-0 w-full max-w-[500px] z-50">
        <div className="flex items-center gap-2">
          {currentView === 'MENU' && (
            <button 
              onClick={() => setCurrentView('CART')}
              className="relative flex items-center gap-1 bg-[#2A1810] px-2 py-1 rounded border border-[#3D2B24]"
            >
              <span className="text-[10px] text-red-500 font-bold">🧾 صورت حساب</span>
              {cartItemCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-[#D4A853] text-[#1C0F0A] text-[10px] w-5 h-5 flex items-center justify-center rounded-full font-bold animate-bounce-subtle">
                  {cartItemCount}
                </span>
              )}
            </button>
          )}
          {currentView !== 'MENU' && (
            <button onClick={() => setCurrentView('MENU')} className="text-[#D4A853] text-sm">بازگشت</button>
          )}
        </div>
        <h1 
          onClick={handleLogoClick}
          className="text-[#D4A853] font-bold text-xl cursor-pointer select-none"
        >
          کافه دیدار
        </h1>
      </header>

      {/* Main Content */}
      <main className="mt-[50px] mb-[70px] flex-1 overflow-y-auto overflow-x-hidden">
        {currentView === 'MENU' && <MenuView activeCategory={activeCategory} setActiveCategory={setActiveCategory} menu={menu} addToCart={addToCart} />}
        {currentView === 'CART' && <CartView cart={cart} updateQuantity={updateQuantity} removeFromCart={removeFromCart} total={cartTotal} tableNumber={tableNumber} setTableNumber={setTableNumber} onPlaceOrder={handlePlaceOrder} isSuccess={isSuccess} />}
        {currentView === 'FEEDBACK' && <FeedbackView />}
        {currentView === 'LOYALTY' && <LoyaltyView />}
        {currentView === 'GALLERY' && <GalleryView />}
        {currentView === 'ADMIN_LOGIN' && <AdminLogin onLoginSuccess={() => setCurrentView('ADMIN_DASHBOARD')} />}
        {currentView === 'ADMIN_DASHBOARD' && <AdminDashboard />}
      </main>

      {/* Bottom Nav */}
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

function MenuView({ activeCategory, setActiveCategory, menu, addToCart }: { activeCategory: Category, setActiveCategory: (c: Category) => void, menu: MenuItem[], addToCart: (i: MenuItem) => void }) {
  const filteredItems = useMemo(() => menu.filter(i => i.category === activeCategory), [menu, activeCategory]);

  return (
    <div className="animate-fade-in">
      <div className="flex w-full bg-[#1C0F0A] sticky top-[50px] z-40 border-b border-[#3D2B24]">
        <CategoryTab active={activeCategory === 'HOT'} label="☕ بار گرم" onClick={() => setActiveCategory('HOT')} />
        <CategoryTab active={activeCategory === 'COLD'} label="🍹 بار سرد" onClick={() => setActiveCategory('COLD')} />
        <CategoryTab active={activeCategory === 'DESSERT'} label="🍰 دسر" onClick={() => setActiveCategory('DESSERT')} />
      </div>
      <div className="p-4 space-y-4">
        {filteredItems.map((item, idx) => (
          <div key={item.id} className="bg-[#2A1810] border border-[#3D2B24] rounded-xl p-3 flex items-center gap-3 animate-fade-in" style={{ animationDelay: `${idx * 0.05}s` }}>
            <div className="w-[60px] h-[60px] bg-[#3D2B24] rounded-lg flex items-center justify-center text-3xl overflow-hidden shrink-0">
              {item.image ? <img src={item.image} alt={item.name} className="w-full h-full object-cover" /> : item.emoji}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-[#F5E6D3] font-bold text-sm truncate">{item.name}</h3>
              <p className="text-[#A89B95] text-[11px] leading-tight mb-1">{item.description}</p>
              <span className="text-[#D4A853] font-bold text-sm">{(item.price / 1000).toLocaleString()} تومان</span>
            </div>
            <button 
              onClick={() => addToCart(item)}
              className="bg-[#D4A853] text-[#1C0F0A] px-3 py-1 rounded-full text-xs font-bold active:scale-90 transition-transform flex items-center gap-1 shrink-0"
            >
              <Plus size={14} /> افزودن
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function CategoryTab({ active, label, onClick }: { active: boolean, label: string, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={`flex-1 py-3 text-xs font-bold transition-colors ${active ? 'bg-[#D4A853] text-[#1C0F0A]' : 'text-[#A89B95] hover:text-[#F5E6D3]'}`}
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
            <Button onClick={onPlaceOrder} className="w-full mt-6 bg-[#D4A853] hover:bg-[#D4A853]/80 text-[#1C0F0A] font-bold h-12 text-lg">
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
        className="bg-[#2A1810] border-[#3D2B24] min-h-[150px] mb-6"
      />
      <Button onClick={handleSubmit} className="w-full bg-[#D4A853] text-[#1C0F0A] font-bold h-12">ارسال نظر</Button>
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
            className="bg-[#2A1810] border-[#3D2B24] text-center"
          />
          <Button onClick={handleSearch} className="w-full bg-[#D4A853] text-[#1C0F0A] font-bold">جستجو</Button>
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
          <Button onClick={() => setAccount(null)} variant="outline" className="w-full border-[#3D2B24] text-[#A89B95]">تغییر شماره</Button>
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
        <label className="bg-[#D4A853] text-[#1C0F0A] px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer">
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
        <div className="fixed inset-0 z-[100] bg-black flex items-center justify-center p-4 animate-fade-in" onClick={() => setPreview(null)}>
           <img src={preview} alt="Preview" className="max-w-full max-h-full object-contain" />
           <button className="absolute top-4 right-4 text-white"><Minus /></button>
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
      <h2 className="text-xl font-bold mb-6">ورود به مدیریت</h2>
      <Input 
        type="password"
        value={pass}
        onChange={(e) => setPass(e.target.value)}
        placeholder="رمز عبور"
        className="bg-[#2A1810] border-[#3D2B24] mb-4 text-center"
      />
      {err && <p className="text-red-500 text-xs mb-4">رمز عبور اشتباه است!</p>}
      <Button onClick={handleLogin} className="w-full bg-[#D4A853] text-[#1C0F0A] font-bold">ورود</Button>
    </div>
  );
}

function AdminDashboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [feedback, setFeedback] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);

  useEffect(() => {
    setOrders(getStoredOrders());
    setMenu(getStoredMenu());
    setFeedback(getStoredFeedback());
    const interval = setInterval(() => setOrders(getStoredOrders()), 5000);
    return () => clearInterval(interval);
  }, []);

  const handleUpdateStatus = (id: string, status: Order['status']) => {
    const updated = orders.map(o => o.id === id ? { ...o, status } : o);
    setOrders(updated);
    localStorage.setItem('cafe_orders', JSON.stringify(updated));
    if (status === 'DELIVERED') {
      const order = updated.find(o => o.id === id);
      // Simplified: award points if we have a way to match loyalty. 
      // In a real app we'd prompt for phone.
    }
  };

  const handleSummarizeFeedback = async () => {
    if (feedback.length === 0) return;
    const result = await summarizeCustomerFeedback({ feedback: feedback.map(f => ({ comment: f.comment, rating: f.rating, timestamp: f.timestamp })) });
    setSummary(result);
  };

  return (
    <div className="p-4 animate-fade-in">
      <h2 className="text-xl font-bold mb-6 text-[#D4A853] flex items-center gap-2"><LayoutDashboard /> پنل مدیریت</h2>
      <Tabs defaultValue="orders" className="w-full">
        <TabsList className="bg-[#2A1810] border border-[#3D2B24] grid grid-cols-4 h-12">
          <TabsTrigger value="orders" className="text-[10px] font-bold">سفارش‌ها</TabsTrigger>
          <TabsTrigger value="menu" className="text-[10px] font-bold">منو</TabsTrigger>
          <TabsTrigger value="feedback" className="text-[10px] font-bold">نظرات</TabsTrigger>
          <TabsTrigger value="qr" className="text-[10px] font-bold">QR</TabsTrigger>
        </TabsList>
        
        <TabsContent value="orders" className="space-y-4 mt-4">
          {orders.map(order => (
            <div key={order.id} className="bg-[#2A1810] border border-[#3D2B24] rounded-xl p-4">
              <div className="flex justify-between items-start mb-2">
                <div>
                   <span className="text-3xl font-bold text-[#D4A853]">میز {order.tableNumber}</span>
                   {order.status === 'NEW' && <Badge className="mr-2 bg-red-500 animate-pulse">🔴 جدید</Badge>}
                </div>
                <span className="text-[10px] text-[#A89B95]">{new Date(order.timestamp).toLocaleTimeString('fa-IR')}</span>
              </div>
              <ul className="text-sm border-y border-[#3D2B24] py-2 my-2 space-y-1">
                {order.items.map((item, i) => (
                  <li key={i} className="flex justify-between">
                    <span>{item.name} × {item.quantity}</span>
                  </li>
                ))}
              </ul>
              <div className="flex justify-between items-center mb-4">
                 <span className="text-[#A89B95] text-xs">جمع کل:</span>
                 <span className="font-bold text-[#D4A853]">{(order.totalPrice / 1000).toLocaleString()} تومان</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Button 
                  size="sm" 
                  onClick={() => handleUpdateStatus(order.id, 'PREPARING')}
                  disabled={order.status !== 'NEW'}
                  className="bg-blue-600 text-white text-[10px]"
                >
                  در حال آماده‌سازی
                </Button>
                <Button 
                  size="sm" 
                  onClick={() => handleUpdateStatus(order.id, 'DELIVERED')}
                  className="bg-green-600 text-white text-[10px]"
                >
                  تحویل داده شد
                </Button>
              </div>
            </div>
          ))}
        </TabsContent>

        <TabsContent value="menu" className="mt-4">
           <AdminMenuManager menu={menu} setMenu={setMenu} />
        </TabsContent>

        <TabsContent value="feedback" className="mt-4 space-y-4">
           <Button onClick={handleSummarizeFeedback} className="w-full bg-[#D4A853] text-[#1C0F0A]">خلاصه هوشمند نظرات</Button>
           {summary && (
             <div className="bg-[#3D2B24] p-3 rounded-lg text-xs leading-relaxed space-y-2 border border-[#D4A853]">
                <p className="font-bold text-[#D4A853]">خلاصه: {summary.overallSentiment}</p>
                <p>{summary.summary}</p>
                <div className="flex flex-wrap gap-1">
                  {summary.commonThemes.map((t: string, i: number) => <Badge key={i} variant="outline" className="text-[8px]">{t}</Badge>)}
                </div>
             </div>
           )}
           {feedback.map((f, i) => (
             <div key={i} className="bg-[#2A1810] border border-[#3D2B24] p-3 rounded-xl">
                <div className="flex justify-between mb-1">
                  <div className="flex gap-0.5">
                    {[1,2,3,4,5].map(s => <Star key={s} size={10} fill={s <= f.rating ? '#D4A853' : 'transparent'} color="#D4A853" />)}
                  </div>
                  <span className="text-[8px] text-[#A89B95]">{new Date(f.timestamp).toLocaleDateString('fa-IR')}</span>
                </div>
                <p className="text-xs">{f.comment}</p>
             </div>
           ))}
        </TabsContent>

        <TabsContent value="qr" className="mt-4 grid grid-cols-2 gap-4">
           {[...Array(13)].map((_, i) => (
             <div key={i} className="bg-white p-2 rounded-xl text-black text-center flex flex-col items-center">
                <p className="text-sm font-bold mb-1">میز {i+1}</p>
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=https://rezaxm80-max.github.io/cafe-didar?table=${i+1}`} 
                  alt={`QR Table ${i+1}`}
                  className="w-full h-auto"
                />
             </div>
           ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function AdminMenuManager({ menu, setMenu }: { menu: MenuItem[], setMenu: any }) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<MenuItem>>({});
  const [isGenerating, setIsGenerating] = useState(false);

  const handleEdit = (item: MenuItem) => {
    setEditingId(item.id);
    setEditForm(item);
  };

  const handleSave = () => {
    const updated = menu.map(m => m.id === editingId ? { ...m, ...editForm } : m);
    setMenu(updated);
    localStorage.setItem('cafe_menu', JSON.stringify(updated));
    setEditingId(null);
  };

  const handleDelete = (id: string) => {
    const updated = menu.filter(m => m.id !== id);
    setMenu(updated);
    localStorage.setItem('cafe_menu', JSON.stringify(updated));
  };

  const handleGenerateDesc = async () => {
    if (!editForm.name) return;
    setIsGenerating(true);
    const result = await generateMenuItemDescription({ itemName: editForm.name, keywords: [editForm.category || ''] });
    setEditForm(prev => ({ ...prev, description: result.description }));
    setIsGenerating(false);
  };

  return (
    <div className="space-y-4">
      {editingId ? (
        <div className="bg-[#2A1810] border border-[#D4A853] p-4 rounded-xl space-y-3">
           <Input value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} placeholder="نام آیتم" className="bg-[#1C0F0A] border-[#3D2B24]" />
           <div className="flex gap-2">
             <Textarea value={editForm.description} onChange={e => setEditForm({...editForm, description: e.target.value})} placeholder="توضیحات" className="bg-[#1C0F0A] border-[#3D2B24] flex-1 text-xs" />
             <Button onClick={handleGenerateDesc} disabled={isGenerating} size="icon" className="bg-[#D4A853] text-[#1C0F0A] shrink-0"><Coffee size={18} /></Button>
           </div>
           <Input type="number" value={editForm.price} onChange={e => setEditForm({...editForm, price: Number(e.target.value)})} placeholder="قیمت (ریال)" className="bg-[#1C0F0A] border-[#3D2B24]" />
           <div className="flex gap-2">
             <Button onClick={handleSave} className="flex-1 bg-green-600 text-white">ذخیره</Button>
             <Button onClick={() => setEditingId(null)} variant="outline" className="flex-1">انصراف</Button>
           </div>
        </div>
      ) : (
        menu.map(item => (
          <div key={item.id} className="bg-[#2A1810] border border-[#3D2B24] p-3 rounded-xl flex items-center justify-between">
             <div>
               <p className="font-bold text-sm">{item.name}</p>
               <p className="text-[10px] text-[#A89B95]">{(item.price/1000).toLocaleString()} تومان</p>
             </div>
             <div className="flex gap-2">
                <Button size="sm" onClick={() => handleEdit(item)} className="bg-[#D4A853] text-[#1C0F0A] p-2 h-auto"><LayoutDashboard size={14} /></Button>
                <Button size="sm" onClick={() => handleDelete(item.id)} className="bg-red-600 text-white p-2 h-auto"><Trash2 size={14} /></Button>
             </div>
          </div>
        ))
      )}
    </div>
  );
}
