/* eslint-disable @next/next/no-img-element */
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { View, MenuItem, OrderItem, Category } from '@/lib/types';
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
  Upload,
  ChevronLeft,
  ListOrdered,
  Check
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { DEFAULT_MENU } from '@/lib/constants';

const API_URL = '/api/orders';

export default function CafeDidarApp() {
  const [currentView, setCurrentView] = useState<View>('MENU');
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [tableNumber, setTableNumber] = useState<string | null>(null);
  const [isLogoTapped, setIsLogoTapped] = useState(0);
  const [isSuccess, setIsSuccess] = useState(false);
  
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [feedback, setFeedback] = useState<any[]>([]);
  const [gallery, setGallery] = useState<any[]>([]);

  useEffect(() => {
    const storedMenu = localStorage.getItem('cafe_menu');
    setMenu(storedMenu ? JSON.parse(storedMenu) : DEFAULT_MENU);

    const storedFeedback = localStorage.getItem('cafe_feedback');
    setFeedback(storedFeedback ? JSON.parse(storedFeedback) : []);

    const storedGallery = localStorage.getItem('cafe_gallery');
    setGallery(storedGallery ? JSON.parse(storedGallery) : []);

    const params = new URLSearchParams(window.location.search);
    const table = params.get('table');
    if (table) setTableNumber(table);
  }, []);

  useEffect(() => {
    if (menu.length > 0) localStorage.setItem('cafe_menu', JSON.stringify(menu));
  }, [menu]);

  useEffect(() => {
    localStorage.setItem('cafe_feedback', JSON.stringify(feedback));
  }, [feedback]);

  useEffect(() => {
    localStorage.setItem('cafe_gallery', JSON.stringify(gallery));
  }, [gallery]);

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

    const itemsStr = cart.map(i => `${i.name} (${i.quantity})`).join(', ');
    const table = tableNumber || 'Takeout';
    
    const params = new URLSearchParams({
      tableNumber: table,
      items: itemsStr,
      totalPrice: cartTotal.toString(),
      status: 'جدید',
      timestamp: Date.now().toString()
    });

    try {
      await fetch(`${API_URL}?${params.toString()}`);
      setIsSuccess(true);
      setCart([]);
      setTimeout(() => {
        setIsSuccess(false);
        setCurrentView('MENU');
      }, 3500);
    } catch (error) {
      // Handle silently
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
    <div className="flex flex-col min-h-screen max-w-[500px] mx-auto relative overflow-x-hidden bg-[#1C0F0A] font-body">
      <header className="h-[75px] flex items-center justify-between px-4 bg-black/70 backdrop-blur-xl border-b border-[#D4A853]/20 fixed top-0 w-full max-w-[500px] z-[100]">
        <div className="flex items-center gap-2">
          {currentView === 'MENU' && (
            <button 
              onClick={() => setCurrentView('CART')}
              className="relative flex items-center gap-2 bg-gradient-to-r from-[#2A1810] to-[#1C0F0A] px-3 py-2 rounded-xl border border-[#D4A853]/30"
            >
              <ShoppingCart size={18} className="text-[#D4A853]" />
              <span className="text-xs text-[#F5E6D3] font-bold">سبد خرید</span>
              {cartItemCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-[#D4A853] text-[#1C0F0A] text-[11px] w-6 h-6 flex items-center justify-center rounded-full font-black">
                  {cartItemCount}
                </span>
              )}
            </button>
          )}
          {['CART', 'FEEDBACK', 'GALLERY'].includes(currentView) && (
            <button onClick={() => setCurrentView('MENU')} className="text-[#D4A853] text-sm font-bold flex items-center gap-1">
              <ChevronLeft size={20} /> بازگشت
            </button>
          )}
          {(currentView === 'ADMIN_LOGIN' || currentView === 'ADMIN_DASHBOARD') && (
            <button onClick={() => setCurrentView('MENU')} className="text-red-400 text-xs font-bold bg-red-500/10 px-3 py-1.5 rounded-lg border border-red-500/20">
              خروج از مدیریت
            </button>
          )}
        </div>
        <div className="flex flex-col items-center">
          <h1 onClick={handleLogoClick} className="text-[#D4A853] font-black text-2xl cursor-pointer leading-tight">دیدار</h1>
          <span className="font-script text-[#D4A853] text-sm -mt-1 opacity-80 uppercase tracking-widest">Cafe Didar</span>
        </div>
        <div className="w-[80px]">
          {tableNumber && <span className="text-[9px] bg-[#D4A853]/20 text-[#D4A853] px-2 py-0.5 rounded-full font-bold block text-center">میز {tableNumber}</span>}
        </div>
      </header>

      <main className="mt-[75px] mb-[75px] flex-1 overflow-y-auto relative scroll-smooth">
        <div className="animate-fade-in">
          {currentView === 'MENU' && (
            <MenuView 
              menu={menu} 
              cart={cart}
              addToCart={addToCart} 
              updateQuantity={updateQuantity}
            />
          )}
          {currentView === 'CART' && (
            <CartView 
              cart={cart} 
              updateQuantity={updateQuantity} 
              removeFromCart={removeFromCart} 
              total={cartTotal} 
              tableNumber={tableNumber} 
              onPlaceOrder={handlePlaceOrder} 
              isSuccess={isSuccess} 
            />
          )}
          {currentView === 'FEEDBACK' && <FeedbackView onFeedbackSubmit={(f: any) => setFeedback(prev => [f, ...prev])} />}
          {currentView === 'GALLERY' && <GalleryView gallery={gallery} />}
          {currentView === 'ADMIN_LOGIN' && <AdminLogin onLoginSuccess={() => setCurrentView('ADMIN_DASHBOARD')} />}
          {currentView === 'ADMIN_DASHBOARD' && (
            <AdminDashboard 
              menu={menu} 
              setMenu={setMenu} 
              feedback={feedback} 
              gallery={gallery}
              setGallery={setGallery}
            />
          )}
        </div>
      </main>

      <nav className="h-[75px] bg-black/80 backdrop-blur-2xl border-t border-[#D4A853]/10 fixed bottom-0 w-full max-w-[500px] z-50 flex items-center justify-around px-4">
        <NavButton active={currentView === 'MENU'} icon={<Coffee size={22} />} label="منو" onClick={() => setCurrentView('MENU')} />
        <NavButton active={currentView === 'FEEDBACK'} icon={<MessageCircle size={22} />} label="نظرات" onClick={() => setCurrentView('FEEDBACK')} />
        <NavButton active={currentView === 'GALLERY'} icon={<ImageIcon size={22} />} label="گالری" onClick={() => setCurrentView('GALLERY')} />
      </nav>
    </div>
  );
}

function NavButton({ active, icon, label, onClick }: { active: boolean, icon: React.ReactNode, label: string, onClick: () => void }) {
  return (
    <button onClick={onClick} className={cn("flex flex-col items-center gap-1.5 transition-all duration-500", active ? 'text-[#D4A853] scale-110' : 'text-[#A89B95] scale-100')}>
      {icon}
      <span className="text-[10px] font-black uppercase tracking-tighter">{label}</span>
    </button>
  );
}

function CategoryTab({ active, label, onClick }: any) {
  return (
    <button onClick={onClick} className={cn("flex-1 py-3 text-[11px] font-black rounded-xl m-1 transition-all", active ? 'bg-[#D4A853] text-[#1C0F0A]' : 'text-[#A89B95]')}>
      {label}
    </button>
  );
}

function MenuView({ menu, cart, addToCart, updateQuantity }: any) {
  const [activeCategory, setActiveCategory] = useState<Category>('HOT');
  const filteredItems = menu.filter((i: any) => i.category === activeCategory);

  return (
    <div className="animate-fade-in pb-10">
      <div className="flex w-full bg-[#1C0F0A]/95 backdrop-blur-md sticky top-0 z-40 border-b border-[#3D2B24] p-1">
        <CategoryTab active={activeCategory === 'HOT'} label="☕ بار گرم" onClick={() => setActiveCategory('HOT')} />
        <CategoryTab active={activeCategory === 'COLD'} label="🍹 بار سرد" onClick={() => setActiveCategory('COLD')} />
        <CategoryTab active={activeCategory === 'DESSERT'} label="🍰 دسر" onClick={() => setActiveCategory('DESSERT')} />
      </div>
      
      <div className="p-4 space-y-4">
        {filteredItems.map((item: any) => {
          const cartItem = cart.find((i: any) => i.id === item.id);
          return (
            <div key={item.id} className="bg-[#2A1810] border border-[#3D2B24] rounded-2xl p-3 flex items-center gap-3 transition-all hover:bg-[#3D2B24]/50">
              <div className="w-[85px] h-[85px] bg-[#3D2B24] rounded-2xl flex items-center justify-center text-3xl overflow-hidden shrink-0">
                {item.image ? <img src={item.image} alt="" className="w-full h-full object-cover" /> : <span>{item.emoji || '🍽️'}</span>}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-[#F5E6D3] font-black text-sm">{item.name}</h3>
                <p className="text-[#A89B95] text-[10px] italic line-clamp-1">{item.description}</p>
                <div className="flex items-center justify-between mt-3">
                  <span className="text-[#D4A853] font-black">{(item.price / 1000).toLocaleString()} <span className="text-[8px] font-bold">تومان</span></span>
                  {cartItem ? (
                    <div className="flex items-center gap-3 bg-black/50 rounded-full p-1 px-2 border border-[#D4A853]/40">
                      <button onClick={() => updateQuantity(item.id, -1)} className="text-[#D4A853]"><Minus size={14} /></button>
                      <span className="text-xs font-black text-[#F5E6D3]">{cartItem.quantity}</span>
                      <button onClick={() => updateQuantity(item.id, 1)} className="text-[#D4A853]"><Plus size={14} /></button>
                    </div>
                  ) : (
                    <button onClick={() => addToCart(item)} className="bg-[#D4A853] text-[#1C0F0A] px-4 py-1.5 rounded-xl text-[10px] font-black transition-transform active:scale-90">افزودن +</button>
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

function FeedbackView({ onFeedbackSubmit }: any) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    if (rating === 0) return;
    onFeedbackSubmit({ rating, comment, timestamp: new Date().toLocaleString('fa-IR'), id: Math.random().toString(36).substr(2, 9) });
    setSubmitted(true);
  };

  if (submitted) return (
    <div className="flex flex-col items-center justify-center h-[70vh] p-10 text-center animate-fade-in">
      <CheckCircle2 size={64} className="text-[#D4A853] mb-4 animate-bounce-subtle" />
      <h2 className="text-2xl font-black text-[#D4A853]">سپاس از نظر شما</h2>
      <Button onClick={() => setSubmitted(false)} variant="ghost" className="mt-8 text-[#D4A853]">ارسال نظر دیگر</Button>
    </div>
  );

  return (
    <div className="p-6 animate-fade-in">
      <h2 className="text-3xl font-black mb-10 text-[#D4A853]">نظرسنجی</h2>
      <div className="flex justify-center gap-4 mb-10">
        {[1, 2, 3, 4, 5].map(s => (
          <button key={s} onClick={() => setRating(s)} className="transition-transform active:scale-75">
            <CheckCircle2 size={32} fill={s <= rating ? '#D4A853' : 'transparent'} color={s <= rating ? '#D4A853' : '#3D2B24'} />
          </button>
        ))}
      </div>
      <Textarea value={comment} onChange={e => setComment(e.target.value)} placeholder="متن نظر شما..." className="bg-[#2A1810] border-[#3D2B24] min-h-[120px] mb-6" />
      <Button onClick={handleSubmit} disabled={rating === 0} className="w-full bg-[#D4A853] text-[#1C0F0A] font-black h-14 shadow-lg shadow-[#D4A853]/20">ثبت بازخورد</Button>
    </div>
  );
}

function GalleryView({ gallery }: any) {
  return (
    <div className="p-4 animate-fade-in">
      <h2 className="text-3xl font-black text-[#D4A853] mb-8 text-center">گالری دیدار</h2>
      <div className="grid grid-cols-2 gap-3">
        {gallery.map((img: any) => (
          <div key={img.id} className="aspect-square bg-[#2A1810] rounded-2xl overflow-hidden border border-[#3D2B24] group relative">
            <img src={img.url} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt="" />
          </div>
        ))}
      </div>
    </div>
  );
}

function CartView({ cart, updateQuantity, removeFromCart, total, tableNumber, onPlaceOrder, isSuccess }: any) {
  if (isSuccess) return (
    <div className="flex flex-col items-center justify-center h-[75vh] p-6 animate-fade-in">
      <div className="w-32 h-32 bg-[#D4A853] rounded-full flex items-center justify-center mb-8 shadow-2xl relative overflow-hidden">
        <div className="absolute inset-0 bg-white/20 animate-ping-slow rounded-full"></div>
        <CheckCircle2 size={80} className="text-[#1C0F0A] relative z-10" />
      </div>
      <h2 className="text-3xl font-black text-[#D4A853] drop-shadow-lg">سفارش ثبت شد</h2>
      <p className="text-[#A89B95] mt-2 text-center font-bold">سفارش شما {tableNumber ? `میز ${tableNumber}` : 'بیرون‌بر'} دریافت شد.</p>
    </div>
  );

  return (
    <div className="p-4 pb-20 animate-slide-up">
      <h2 className="text-3xl font-black text-[#D4A853] mb-8">صورتحساب</h2>
      {cart.length === 0 ? (
        <div className="text-center text-[#A89B95] py-20 opacity-30"><ShoppingCart size={64} className="mx-auto" /><p className="mt-4">سبد خرید خالی است</p></div>
      ) : (
        <div className="space-y-4">
          {cart.map((item: any) => (
            <div key={item.id} className="bg-[#2A1810] p-4 rounded-2xl flex items-center gap-4 border border-[#3D2B24]">
              <div className="w-12 h-12 rounded-xl overflow-hidden bg-[#1C0F0A] flex items-center justify-center">{item.image ? <img src={item.image} className="w-full h-full object-cover" alt="" /> : <span>{item.emoji}</span>}</div>
              <div className="flex-1">
                <h4 className="font-bold text-sm text-[#F5E6D3]">{item.name}</h4>
                <p className="text-[#D4A853] text-xs font-black">{(item.price * item.quantity / 1000).toLocaleString()} تومان</p>
              </div>
              <div className="flex items-center gap-3 bg-black/40 rounded-full px-3 py-1">
                <button onClick={() => updateQuantity(item.id, -1)} className="text-[#D4A853]"><Minus size={14} /></button>
                <span className="text-xs font-black">{item.quantity}</span>
                <button onClick={() => updateQuantity(item.id, 1)} className="text-[#D4A853]"><Plus size={14} /></button>
              </div>
              <button onClick={() => removeFromCart(item.id)} className="text-red-500/50"><Trash2 size={18} /></button>
            </div>
          ))}
          <div className="mt-10 bg-[#2A1810] p-6 rounded-3xl border border-[#D4A853]/30">
            <div className="flex justify-between items-center mb-6">
              <span className="text-[#A89B95] font-bold">مجموع کل:</span>
              <span className="text-3xl font-black text-[#D4A853]">{(total / 1000).toLocaleString()} <span className="text-xs">تومان</span></span>
            </div>
            <Button onClick={onPlaceOrder} className="w-full h-16 bg-[#D4A853] text-[#1C0F0A] font-black rounded-2xl text-lg shadow-xl shadow-[#D4A853]/20 transition-transform active:scale-95">ثبت و تایید نهایی</Button>
          </div>
        </div>
      )}
    </div>
  );
}

function AdminLogin({ onLoginSuccess }: any) {
  const [pass, setPass] = useState('');
  return (
    <div className="p-8 flex flex-col items-center justify-center h-[70vh]">
      <LogIn size={48} className="text-[#D4A853] mb-8" />
      <h2 className="text-2xl font-black mb-8">ورود به پنل مدیریت</h2>
      <Input type="password" value={pass} onChange={e => setPass(e.target.value)} placeholder="رمز عبور" className="bg-[#2A1810] border-[#3D2B24] h-14 text-center mb-6" />
      <Button onClick={() => pass === 'didar1234' ? onLoginSuccess() : alert('غلط')} className="w-full bg-[#D4A853] text-[#1C0F0A] h-14 font-black">ورود</Button>
    </div>
  );
}

function AdminDashboard({ menu, setMenu, feedback, gallery, setGallery }: any) {
  const [rawOrders, setRawOrders] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('orders');

  const fetchOrders = async () => {
    try {
      const res = await fetch(`${API_URL}?timestamp=${Date.now()}`);
      if (!res.ok) throw new Error('Network response was not ok');
      const data = await res.json();
      if (Array.isArray(data)) {
        const mapped = data.map((o: any, idx: number) => ({
          ...o,
          rowIndex: idx + 2
        }));

        // Filter: skip any order where tableNumber AND items AND totalPrice are all empty or zero
        const filtered = mapped.filter((o: any) => {
          const tableEmpty = !o.tableNumber || o.tableNumber === 'undefined' || String(o.tableNumber).trim() === '' || o.tableNumber === '0';
          const itemsEmpty = !o.items || String(o.items).trim() === '';
          const priceEmpty = !o.totalPrice || o.totalPrice === '0' || o.totalPrice === 0;
          
          return !(tableEmpty && itemsEmpty && priceEmpty);
        });
        setRawOrders(filtered);
      }
    } catch (err) {
      // Handle silently
    }
  };

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 10000); // 10s poll
    return () => clearInterval(interval);
  }, []);

  const handleDeleteOrder = async (order: any) => {
    // Optimistic local update: remove immediately
    setRawOrders(prev => prev.filter(o => o.rowIndex !== order.rowIndex));

    const params = new URLSearchParams({
      action: 'deleteOrder',
      rowIndex: order.rowIndex.toString(),
      timestamp: Date.now().toString()
    });

    try {
      // Send delete command to GAS via proxy
      fetch(`${API_URL}?${params.toString()}`);
    } catch (err) {
      // If error occurs, let polling restore the UI state if deletion failed
    }
  };

  return (
    <div className="p-4 bg-[#1C0F0A] min-h-screen pb-20 animate-fade-in">
      <div className="grid grid-cols-1 gap-3 mb-8">
        <div className="bg-[#2A1810] p-4 rounded-2xl border border-[#3D2B24]">
          <p className="text-[10px] text-[#A89B95] font-black uppercase">تعداد سفارشات</p>
          <p className="text-2xl font-black text-[#D4A853]">{rawOrders.length}</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-[#2A1810] grid grid-cols-4 h-14 mb-8">
          <TabsTrigger value="orders"><ListOrdered size={18} /></TabsTrigger>
          <TabsTrigger value="menu"><Coffee size={18} /></TabsTrigger>
          <TabsTrigger value="feedback"><MessageCircle size={18} /></TabsTrigger>
          <TabsTrigger value="gallery"><ImageIcon size={18} /></TabsTrigger>
        </TabsList>
        
        <TabsContent value="orders" className="space-y-6">
          <div className="space-y-4">
            {rawOrders.length === 0 && (
              <p className="text-center text-[#A89B95] py-10 opacity-50">هیچ سفارشی وجود ندارد</p>
            )}
            {rawOrders.map((order) => (
              <Card key={order.rowIndex} className="bg-[#2A1810] border-[#3D2B24] overflow-hidden">
                <CardHeader className="p-4 flex flex-row items-center justify-between border-b border-[#3D2B24]/50">
                  <div className="flex flex-col">
                    <span className="text-xs font-black text-[#F5E6D3]">{order.tableNumber === 'Takeout' ? '📦 بیرون‌بر' : `میز ${order.tableNumber}`}</span>
                    <span className="text-[10px] text-[#A89B95]">{order.timestamp}</span>
                  </div>
                </CardHeader>
                <CardContent className="p-4 space-y-4">
                  <p className="text-sm text-[#F5E6D3] leading-relaxed">{order.items}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-black text-[#D4A853]">{(Number(order.totalPrice) / 1000).toLocaleString()} تومان</span>
                  </div>
                  <Button 
                    onClick={() => handleDeleteOrder(order)}
                    className="w-full bg-green-600 hover:bg-green-700 text-white text-[10px] font-black flex items-center gap-2 h-12"
                  >
                    <Check size={16} /> ✓ انجام شد
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="menu">
          <AdminMenuManager menu={menu} setMenu={setMenu} />
        </TabsContent>
        
        <TabsContent value="feedback">
           <div className="space-y-3">
             {feedback.map((f: any) => (
               <div key={f.id} className="bg-[#2A1810] p-4 rounded-2xl border border-[#3D2B24]">
                 <div className="flex justify-between mb-2">
                   <div className="flex">{[...Array(5)].map((_, i) => <CheckCircle2 key={i} size={10} fill={f.rating > i ? "#D4A853" : "transparent"} color="#D4A853" />)}</div>
                   <span className="text-[10px] text-[#A89B95]">{f.timestamp}</span>
                 </div>
                 <p className="text-xs text-[#F5E6D3]">{f.comment}</p>
               </div>
             ))}
           </div>
        </TabsContent>

        <TabsContent value="gallery">
           <AdminGalleryManager gallery={gallery} setGallery={setGallery} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function AdminMenuManager({ menu, setMenu }: any) {
  const [isAdding, setIsAdding] = useState(false);
  const [form, setForm] = useState<Partial<MenuItem>>({ name: '', price: 0, category: 'HOT', emoji: '☕', description: '', image: '' });

  const handleSave = () => {
    if (!form.name) return;
    const newItem = { ...form, id: Math.random().toString(36).substr(2, 9) } as MenuItem;
    setMenu([newItem, ...menu]);
    setIsAdding(false);
    setForm({ name: '', price: 0, category: 'HOT', emoji: '☕', description: '', image: '' });
  };

  const handleImage = (e: any) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setForm({ ...form, image: reader.result as string });
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-4">
      <Button onClick={() => setIsAdding(!isAdding)} className="w-full bg-[#D4A853] text-[#1C0F0A] font-black h-12">
        {isAdding ? 'انصراف' : '+ افزودن آیتم جدید'}
      </Button>
      {isAdding && (
        <Card className="bg-[#2A1810] border-[#D4A853]/20 p-4 space-y-4">
          <Input placeholder="نام آیتم" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="bg-[#1C0F0A] border-[#3D2B24]" />
          <div className="grid grid-cols-2 gap-2">
            <Input type="number" placeholder="قیمت" value={form.price} onChange={e => setForm({ ...form, price: Number(e.target.value) })} className="bg-[#1C0F0A] border-[#3D2B24]" />
            <Input placeholder="ایموجی" value={form.emoji} onChange={e => setForm({ ...form, emoji: e.target.value })} className="bg-[#1C0F0A] border-[#3D2B24]" />
          </div>
          <Select value={form.category} onValueChange={(v: Category) => setForm({ ...form, category: v })}>
            <SelectTrigger className="bg-[#1C0F0A] border-[#3D2B24]"><SelectValue /></SelectTrigger>
            <SelectContent className="bg-[#2A1810]">
              <SelectItem value="HOT">HOT BAR</SelectItem>
              <SelectItem value="COLD">COLD BAR</SelectItem>
              <SelectItem value="DESSERT">DESSERT</SelectItem>
            </SelectContent>
          </Select>
          <Textarea placeholder="توضیحات" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="bg-[#1C0F0A] border-[#3D2B24]" />
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-black rounded border border-[#3D2B24] overflow-hidden">
               {form.image && <img src={form.image} className="w-full h-full object-cover" alt="" />}
            </div>
            <label className="flex-1 bg-black/40 h-12 rounded border border-[#3D2B24] flex items-center justify-center cursor-pointer text-[10px] font-black">
              <Upload size={16} className="mr-2" /> آپلود تصویر
              <input type="file" className="hidden" accept="image/*" onChange={handleImage} />
            </label>
          </div>
          <Button onClick={handleSave} className="w-full bg-[#D4A853] text-[#1C0F0A] font-black">ذخیره آیتم</Button>
        </Card>
      )}
      <div className="space-y-2">
        {menu.map((m: any) => (
          <div key={m.id} className="bg-[#2A1810] p-3 rounded-2xl flex justify-between items-center border border-[#3D2B24]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-black border border-[#3D2B24] flex items-center justify-center">{m.image ? <img src={m.image} className="w-full h-full object-cover" alt="" /> : m.emoji}</div>
              <span className="text-xs font-bold text-[#F5E6D3]">{m.name}</span>
            </div>
            <button onClick={() => setMenu(menu.filter((x: any) => x.id !== m.id))} className="text-red-500/30"><Trash2 size={16} /></button>
          </div>
        ))}
      </div>
    </div>
  );
}

function AdminGalleryManager({ gallery, setGallery }: any) {
  const handleUpload = (e: any) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setGallery([{ id: Math.random(), url: reader.result as string }, ...gallery]);
      reader.readAsDataURL(file);
    }
  };
  return (
    <div className="space-y-4">
      <label className="w-full bg-[#D4A853] text-[#1C0F0A] font-black h-12 rounded-xl flex items-center justify-center cursor-pointer">
        <Upload size={18} className="mr-2" /> افزودن تصویر
        <input type="file" className="hidden" accept="image/*" onChange={handleUpload} />
      </label>
      <div className="grid grid-cols-3 gap-2">
        {gallery.map((img: any) => (
          <div key={img.id} className="relative aspect-square rounded-lg overflow-hidden group">
            <img src={img.url} className="w-full h-full object-cover" alt="" />
            <button onClick={() => setGallery(gallery.filter((x: any) => x.id !== img.id))} className="absolute inset-0 bg-red-500/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={20} className="text-white" /></button>
          </div>
        ))}
      </div>
    </div>
  );
}
