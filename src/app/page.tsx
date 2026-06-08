
/* eslint-disable @next/next/no-img-element */
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { View, MenuItem, OrderItem, Category, Order } from '@/lib/types';
import { 
  Coffee, 
  MessageCircle, 
  Star, 
  Image as ImageIcon, 
  ShoppingCart, 
  CheckCircle2, 
  Plus, 
  Minus, 
  Trash2, 
  QrCode, 
  LogIn, 
  Settings2, 
  BarChart3, 
  ListOrdered,
  PlusCircle,
  Pencil,
  Save,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { generateMenuItemDescription } from '@/ai/flows/generate-menu-item-description';
import { summarizeCustomerFeedback } from '@/ai/flows/summarize-customer-feedback-flow';
import { useCollection, useFirestore } from '@/firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

export default function CafeDidarApp() {
  const [currentView, setCurrentView] = useState<View>('MENU');
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [tableNumber, setTableNumber] = useState<string | null>(null);
  const [isLogoTapped, setIsLogoTapped] = useState(0);
  const [isSuccess, setIsSuccess] = useState(false);
  
  const firestore = useFirestore();

  // Real-time menu
  const menuQuery = useMemo(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'menu'));
  }, [firestore]);
  const { data: menuData, loading: menuLoading } = useCollection<MenuItem>(menuQuery);
  const menu = menuData || [];

  useEffect(() => {
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

  const handlePlaceOrder = () => {
    if (!tableNumber) {
      alert('لطفاً کد میز را با اسکن QR مجدداً وارد کنید.');
      return;
    }
    if (!firestore) return;

    const orderData = {
      tableNumber,
      items: cart.map(i => ({ id: i.id, name: i.name, price: i.price, quantity: i.quantity })),
      totalPrice: cartTotal,
      timestamp: new Date().toISOString(),
      status: 'NEW' as const
    };

    addDoc(collection(firestore, 'orders'), orderData)
      .then(() => {
        setIsSuccess(true);
        setTimeout(() => {
          setIsSuccess(false);
          setCart([]);
          setCurrentView('MENU');
        }, 2000);
      })
      .catch(async (err) => {
        const permissionError = new FirestorePermissionError({
          path: 'orders',
          operation: 'create',
          requestResourceData: orderData
        });
        errorEmitter.emit('permission-error', permissionError);
      });
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
        <div className="flex flex-col items-center">
          <h1 
            onClick={handleLogoClick}
            className="text-[#D4A853] font-bold text-xl cursor-pointer select-none tracking-wider drop-shadow-[0_0_5px_rgba(212,168,83,0.4)]"
          >
            کافه دیدار
          </h1>
          {tableNumber && (
            <span className="text-[8px] text-[#D4A853]/70 font-bold -mt-1">میز {tableNumber}</span>
          )}
        </div>
      </header>

      <main className="mt-[60px] mb-[70px] flex-1 overflow-y-auto overflow-x-hidden relative">
        {currentView === 'MENU' && (
          <MenuView 
            activeCategory="HOT"
            menu={menu} 
            cart={cart}
            addToCart={addToCart} 
            updateQuantity={updateQuantity}
            loading={menuLoading}
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
        {currentView === 'FEEDBACK' && <FeedbackView />}
        {currentView === 'LOYALTY' && <LoyaltyView />}
        {currentView === 'GALLERY' && <GalleryView />}
        {currentView === 'ADMIN_LOGIN' && <AdminLogin onLoginSuccess={() => setCurrentView('ADMIN_DASHBOARD')} />}
        {currentView === 'ADMIN_DASHBOARD' && <AdminDashboard menu={menu} />}
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
  menu, 
  cart, 
  addToCart, 
  updateQuantity,
  loading
}: { 
  menu: MenuItem[], 
  cart: OrderItem[],
  addToCart: (i: MenuItem) => void,
  updateQuantity: (id: string, delta: number) => void,
  loading: boolean
}) {
  const [activeCategory, setActiveCategory] = useState<Category>('HOT');
  const filteredItems = useMemo(() => menu.filter(i => i.category === activeCategory), [menu, activeCategory]);

  if (loading) return <div className="p-8 text-center text-[#A89B95] animate-pulse">در حال بارگذاری منو...</div>;

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
                      <button onClick={() => updateQuantity(item.id, -1)} className="p-1 text-[#D4A853] hover:bg-[#D4A853]/10 rounded-full transition-colors"><Minus size={14} /></button>
                      <span className="text-xs font-bold w-4 text-center text-[#F5E6D3]">{cartItem.quantity}</span>
                      <button onClick={() => updateQuantity(item.id, 1)} className="p-1 text-[#D4A853] hover:bg-[#D4A853]/10 rounded-full transition-colors"><Plus size={14} /></button>
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

function CartView({ cart, updateQuantity, removeFromCart, total, tableNumber, onPlaceOrder, isSuccess }: any) {
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
            {tableNumber ? (
              <div className="text-center p-3 bg-[#D4A853]/10 border border-[#D4A853]/30 rounded-xl mb-4">
                <p className="text-[10px] text-[#A89B95]">سفارش برای میز شماره:</p>
                <p className="text-2xl font-bold text-[#D4A853]">{tableNumber}</p>
              </div>
            ) : (
              <p className="text-red-500 text-xs text-center mb-4">لطفاً QR کد روی میز را اسکن کنید.</p>
            )}
            <Button 
              onClick={onPlaceOrder} 
              disabled={!tableNumber || cart.length === 0}
              className="w-full mt-6 bg-[#D4A853] hover:bg-[#D4A853]/80 text-[#1C0F0A] font-bold h-12 text-lg rounded-xl shadow-lg"
            >
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
  const firestore = useFirestore();

  const handleSubmit = () => {
    if (rating === 0 || !firestore) return;
    const feedbackData = {
      rating,
      comment,
      timestamp: new Date().toISOString()
    };
    addDoc(collection(firestore, 'feedback'), feedbackData)
      .then(() => setSubmitted(true))
      .catch(async () => {
        const err = new FirestorePermissionError({ path: 'feedback', operation: 'create', requestResourceData: feedbackData });
        errorEmitter.emit('permission-error', err);
      });
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
    // In a real app, this would be a Firestore query to 'loyalty' collection
    setAccount({ points: Math.floor(Math.random() * 200) });
  };

  return (
    <div className="p-6 animate-fade-in">
      <h2 className="text-xl font-bold mb-6 text-[#D4A853]">⭐ باشگاه مشتریان</h2>
      {!account ? (
        <div className="space-y-4">
          <p className="text-[#A89B95] text-sm">برای مشاهده امتیازات خود، شماره موبایل‌تان را وارد کنید:</p>
          <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="مثلاً ۰۹۱۲۳۴۵۶۷۸۹" className="bg-[#2A1810] border-[#3D2B24] text-center rounded-xl" />
          <Button onClick={handleSearch} className="w-full bg-[#D4A853] text-[#1C0F0A] font-bold rounded-xl">جستجو</Button>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="relative h-[200px] w-full rounded-2xl bg-gradient-to-br from-[#D4A853] via-[#B88A3E] to-[#D4A853] p-6 text-[#1C0F0A] shadow-xl overflow-hidden animate-fade-in">
             <div className="relative z-10 flex flex-col h-full justify-between">
                <div><h3 className="font-bold text-lg">کارت عضویت ویژه</h3><p className="text-[10px] opacity-80">VIP LOYALTY CARD</p></div>
                <div className="flex justify-between items-end">
                   <div><p className="text-[10px] opacity-80">امتیاز فعلی</p><p className="text-3xl font-bold">{account.points}</p></div>
                   <div className="text-right"><p className="text-[10px] opacity-80">{phone}</p><p className="font-bold text-sm">Cafe Didar</p></div>
                </div>
             </div>
          </div>
          <Button onClick={() => setAccount(null)} variant="outline" className="w-full border-[#3D2B24] text-[#A89B95] rounded-xl">تغییر شماره</Button>
        </div>
      )}
    </div>
  );
}

function GalleryView() {
  const images = ["https://picsum.photos/seed/10/400/400", "https://picsum.photos/seed/11/400/400", "https://picsum.photos/seed/12/400/400", "https://picsum.photos/seed/13/400/400"];
  return (
    <div className="p-4 animate-fade-in">
      <h2 className="text-xl font-bold text-[#D4A853] mb-6">📸 گالری دیدار</h2>
      <div className="grid grid-cols-2 gap-3">
        {images.map((img, i) => (
          <div key={i} className="aspect-square bg-[#2A1810] rounded-xl border border-[#3D2B24] overflow-hidden"><img src={img} alt="Cafe" className="w-full h-full object-cover" /></div>
        ))}
      </div>
    </div>
  );
}

function AdminLogin({ onLoginSuccess }: { onLoginSuccess: () => void }) {
  const [pass, setPass] = useState('');
  const [err, setErr] = useState(false);

  const handleLogin = () => {
    if (pass === 'didar1234') onLoginSuccess();
    else setErr(true);
  };

  return (
    <div className="p-8 flex flex-col items-center justify-center h-[70vh] animate-fade-in">
      <LogIn size={48} className="text-[#D4A853] mb-4" />
      <h2 className="text-xl font-bold mb-6 text-[#F5E6D3]">ورود به مدیریت</h2>
      <Input type="password" value={pass} onChange={(e) => setPass(e.target.value)} placeholder="رمز عبور" className="bg-[#2A1810] border-[#3D2B24] mb-4 text-center rounded-xl" />
      {err && <p className="text-red-500 text-xs mb-4">رمز عبور اشتباه است!</p>}
      <Button onClick={handleLogin} className="w-full bg-[#D4A853] text-[#1C0F0A] font-bold rounded-xl h-12">ورود</Button>
    </div>
  );
}

function AdminDashboard({ menu }: { menu: MenuItem[] }) {
  const firestore = useFirestore();
  
  const ordersQuery = useMemo(() => firestore ? query(collection(firestore, 'orders'), orderBy('timestamp', 'desc')) : null, [firestore]);
  const { data: orders } = useCollection<Order>(ordersQuery);

  const feedbackQuery = useMemo(() => firestore ? query(collection(firestore, 'feedback'), orderBy('timestamp', 'desc')) : null, [firestore]);
  const { data: feedback } = useCollection<any>(feedbackQuery);

  const [summary, setSummary] = useState<any>(null);
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);

  const handleUpdateStatus = (id: string, status: Order['status']) => {
    if (!firestore) return;
    updateDoc(doc(firestore, 'orders', id), { status })
      .catch(async () => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({ path: `orders/${id}`, operation: 'update', requestResourceData: { status } }));
      });
  };

  const handleSummarizeFeedback = async () => {
    if (!feedback || feedback.length === 0) return;
    setIsLoadingSummary(true);
    try {
      const result = await summarizeCustomerFeedback({ feedback: feedback.map(f => ({ comment: f.comment, rating: f.rating, timestamp: f.timestamp })) });
      setSummary(result);
    } catch (err) { console.error(err); } 
    finally { setIsLoadingSummary(false); }
  };

  const newOrdersCount = orders?.filter(o => o.status === 'NEW').length || 0;

  return (
    <div className="p-4 animate-fade-in bg-[#1C0F0A] min-h-screen">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-[#D4A853] flex items-center gap-2"><Settings2 size={24} /> پنل مدیریت</h2>
        {newOrdersCount > 0 && <Badge className="bg-red-500 animate-pulse">{newOrdersCount} جدید</Badge>}
      </div>

      <Tabs defaultValue="orders">
        <TabsList className="bg-[#2A1810] grid grid-cols-4 mb-6">
          <TabsTrigger value="orders"><ListOrdered size={14} /></TabsTrigger>
          <TabsTrigger value="menu"><Coffee size={14} /></TabsTrigger>
          <TabsTrigger value="feedback"><MessageCircle size={14} /></TabsTrigger>
          <TabsTrigger value="qr"><QrCode size={14} /></TabsTrigger>
        </TabsList>
        
        <TabsContent value="orders" className="space-y-4">
          {!orders || orders.length === 0 ? (
            <div className="text-center py-20 text-[#A89B95]">سفارشی ثبت نشده است.</div>
          ) : (
            orders.map(order => (
              <Card key={order.id} className="bg-[#2A1810] border-[#3D2B24]">
                <CardHeader className="p-4 flex flex-row items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="bg-[#D4A853] text-[#1C0F0A] w-8 h-8 rounded flex items-center justify-center font-bold">{order.tableNumber}</div>
                    <CardTitle className="text-sm">میز {order.tableNumber}</CardTitle>
                  </div>
                  <Badge className={order.status === 'NEW' ? 'bg-red-500' : ''}>{order.status}</Badge>
                </CardHeader>
                <CardContent className="p-4">
                  <ul className="text-xs space-y-1 mb-4">
                    {order.items.map((item, i) => (
                      <li key={i} className="flex justify-between"><span>{item.name}</span><span className="text-[#D4A853]">×{item.quantity}</span></li>
                    ))}
                  </ul>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => handleUpdateStatus(order.id, 'PREPARING')} disabled={order.status !== 'NEW'} className="flex-1 text-[10px]">آماده‌سازی</Button>
                    <Button size="sm" onClick={() => handleUpdateStatus(order.id, 'DELIVERED')} disabled={order.status === 'DELIVERED'} className="flex-1 text-[10px]">تحویل</Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="menu">
           <AdminMenuManager menu={menu} />
        </TabsContent>

        <TabsContent value="feedback" className="space-y-4">
           <Button onClick={handleSummarizeFeedback} disabled={isLoadingSummary || !feedback} className="w-full bg-[#D4A853]">تحلیل هوشمند نظرات</Button>
           {summary && <div className="p-3 bg-[#3D2B24] rounded-lg text-xs">{summary.summary}</div>}
           {feedback?.map((f, i) => (
             <div key={i} className="bg-[#2A1810] p-3 rounded-lg border border-[#3D2B24]">
               <div className="flex justify-between"><div className="flex">{[...Array(f.rating)].map((_,s)=> <Star key={s} size={10} fill="#D4A853" color="#D4A853" />)}</div></div>
               <p className="text-xs mt-1">{f.comment}</p>
             </div>
           ))}
        </TabsContent>

        <TabsContent value="qr" className="grid grid-cols-2 gap-4">
           {[...Array(6)].map((_, i) => (
             <Card key={i} className="bg-white p-2 text-black text-center">
                <p className="text-xs font-bold">میز {i+1}</p>
                <img src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${window.location.origin}?table=${i+1}`} alt="QR" className="mx-auto my-2" />
             </Card>
           ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function AdminMenuManager({ menu }: { menu: MenuItem[] }) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [editForm, setEditForm] = useState<Partial<MenuItem>>({});
  const firestore = useFirestore();

  const handleSave = () => {
    if (!firestore || !editForm.name) return;
    if (isAdding) {
      addDoc(collection(firestore, 'menu'), editForm)
        .then(() => { setIsAdding(false); setEditForm({}); })
        .catch(async () => errorEmitter.emit('permission-error', new FirestorePermissionError({ path: 'menu', operation: 'create', requestResourceData: editForm })));
    } else if (editingId) {
      updateDoc(doc(firestore, 'menu', editingId), editForm)
        .then(() => { setEditingId(null); setEditForm({}); })
        .catch(async () => errorEmitter.emit('permission-error', new FirestorePermissionError({ path: `menu/${editingId}`, operation: 'update', requestResourceData: editForm })));
    }
  };

  const handleDelete = (id: string) => {
    if (!firestore || !confirm('حذف شود؟')) return;
    deleteDoc(doc(firestore, 'menu', id))
      .catch(async () => errorEmitter.emit('permission-error', new FirestorePermissionError({ path: `menu/${id}`, operation: 'delete' })));
  };

  return (
    <div className="space-y-4">
      <Button onClick={() => { setIsAdding(true); setEditForm({ category: 'HOT' }); }} className="w-full bg-[#D4A853] text-[#1C0F0A]">افزودن آیتم جدید</Button>
      {(isAdding || editingId) && (
        <Card className="bg-[#2A1810] p-4 space-y-3">
          <Input placeholder="نام" value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} className="bg-[#1C0F0A] border-[#3D2B24]" />
          <Input placeholder="قیمت" type="number" value={editForm.price} onChange={e => setEditForm({...editForm, price: Number(e.target.value)})} className="bg-[#1C0F0A] border-[#3D2B24]" />
          <Textarea placeholder="توضیحات" value={editForm.description} onChange={e => setEditForm({...editForm, description: e.target.value})} className="bg-[#1C0F0A] border-[#3D2B24]" />
          <div className="flex gap-2">
            <Button onClick={handleSave} className="flex-1 bg-[#D4A853]">ذخیره</Button>
            <Button onClick={() => { setIsAdding(false); setEditingId(null); }} variant="outline" className="flex-1">انصراف</Button>
          </div>
        </Card>
      )}
      <div className="space-y-2">
        {menu.map(item => (
          <div key={item.id} className="bg-[#2A1810] p-3 rounded-xl flex justify-between items-center border border-[#3D2B24]">
            <span className="text-sm">{item.name}</span>
            <div className="flex gap-2">
              <Button size="icon" variant="ghost" onClick={() => { setEditingId(item.id); setEditForm(item); }}><Pencil size={14} /></Button>
              <Button size="icon" variant="ghost" onClick={() => handleDelete(item.id)} className="text-red-500"><Trash2 size={14} /></Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
