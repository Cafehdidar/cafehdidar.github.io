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
  ListOrdered,
  Pencil,
  Upload,
  Sparkles,
  ChevronLeft
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { summarizeCustomerFeedback } from '@/ai/flows/summarize-customer-feedback-flow';
import { useCollection, useFirestore } from '@/firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { cn } from '@/lib/utils';

export default function CafeDidarApp() {
  const [currentView, setCurrentView] = useState<View>('MENU');
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [tableNumber, setTableNumber] = useState<string | null>(null);
  const [isLogoTapped, setIsLogoTapped] = useState(0);
  const [isSuccess, setIsSuccess] = useState(false);
  
  const firestore = useFirestore();

  const menuQuery = useMemo(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'menu'), orderBy('name', 'asc'));
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
    if (!firestore || cart.length === 0) return;

    const orderData = {
      tableNumber: tableNumber || 'بیرون‌بر',
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
        }, 3000);
      })
      .catch(async () => {
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
    if (isLogoTapped + 1 >= 5) {
      setCurrentView('ADMIN_LOGIN');
      setIsLogoTapped(0);
    }
  };

  return (
    <div className="flex flex-col min-h-screen max-w-[500px] mx-auto relative overflow-x-hidden bg-[#1C0F0A] font-body selection:bg-[#D4A853]/30">
      <header className="h-[65px] flex items-center justify-between px-4 bg-black/60 backdrop-blur-xl border-b border-[#D4A853]/20 shadow-[0_4px_20px_rgba(0,0,0,0.4)] fixed top-0 w-full max-w-[500px] z-[100]">
        <div className="flex items-center gap-2">
          {currentView === 'MENU' && (
            <button 
              onClick={() => setCurrentView('CART')}
              className="relative flex items-center gap-2 bg-gradient-to-r from-[#2A1810] to-[#1C0F0A] px-3 py-2 rounded-xl border border-[#D4A853]/30 transition-all hover:border-[#D4A853]/60 active:scale-95 group"
            >
              <ShoppingCart size={18} className="text-[#D4A853] group-hover:rotate-12 transition-transform" />
              <span className="text-xs text-[#F5E6D3] font-bold">صورتحساب</span>
              {cartItemCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-[#D4A853] text-[#1C0F0A] text-[11px] w-6 h-6 flex items-center justify-center rounded-full font-black shadow-[0_0_15px_rgba(212,168,83,0.6)] animate-pulse">
                  {cartItemCount}
                </span>
              )}
            </button>
          )}
          {['CART', 'FEEDBACK', 'LOYALTY', 'GALLERY'].includes(currentView) && (
            <button onClick={() => setCurrentView('MENU')} className="text-[#D4A853] text-sm font-bold flex items-center gap-1 group">
              <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" /> بازگشت به منو
            </button>
          )}
          {(currentView === 'ADMIN_LOGIN' || currentView === 'ADMIN_DASHBOARD') && (
            <button onClick={() => setCurrentView('MENU')} className="text-red-400 text-sm font-bold flex items-center gap-1">
              خروج از مدیریت
            </button>
          )}
        </div>
        <div className="flex flex-col items-center">
          <h1 
            onClick={handleLogoClick}
            className="text-[#D4A853] font-black text-2xl cursor-pointer select-none tracking-tighter drop-shadow-[0_0_10px_rgba(212,168,83,0.3)] hover:scale-105 transition-transform"
          >
            دیدار
          </h1>
          {tableNumber && (
            <span className="text-[9px] bg-[#D4A853]/10 text-[#D4A853] px-2 py-0.5 rounded-full font-bold border border-[#D4A853]/20">میز {tableNumber}</span>
          )}
        </div>
      </header>

      <main className="mt-[65px] mb-[75px] flex-1 overflow-y-auto relative scroll-smooth">
        {currentView === 'MENU' && (
          <MenuView 
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

      <nav className="h-[75px] bg-black/80 backdrop-blur-2xl border-t border-[#D4A853]/10 fixed bottom-0 w-full max-w-[500px] z-50 flex items-center justify-around px-4 shadow-[0_-4px_20px_rgba(0,0,0,0.4)]">
        <NavButton active={currentView === 'MENU'} icon={<Coffee size={22} />} label="منو" onClick={() => setCurrentView('MENU')} />
        <NavButton active={currentView === 'FEEDBACK'} icon={<MessageCircle size={22} />} label="نظرات" onClick={() => setCurrentView('FEEDBACK')} />
        <NavButton active={currentView === 'LOYALTY'} icon={<Star size={22} />} label="امتیاز" onClick={() => setCurrentView('LOYALTY')} />
        <NavButton active={currentView === 'GALLERY'} icon={<ImageIcon size={22} />} label="گالری" onClick={() => setCurrentView('GALLERY')} />
      </nav>
    </div>
  );
}

function NavButton({ active, icon, label, onClick }: { active: boolean, icon: React.ReactNode, label: string, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "flex flex-col items-center gap-1.5 transition-all duration-300 relative py-1 w-16",
        active ? 'text-[#D4A853]' : 'text-[#A89B95] hover:text-[#D4A853]/60'
      )}
    >
      <div className={cn("transition-transform duration-300", active ? "scale-110 -translate-y-1" : "scale-100")}>
        {icon}
      </div>
      <span className="text-[10px] font-black uppercase tracking-wider">{label}</span>
      {active && <span className="absolute -bottom-1 w-1 h-1 bg-[#D4A853] rounded-full shadow-[0_0_8px_#D4A853]"></span>}
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

  return (
    <div className="animate-fade-in">
      <div className="flex w-full bg-[#1C0F0A]/95 backdrop-blur-md sticky top-0 z-40 border-b border-[#3D2B24] p-1">
        <CategoryTab active={activeCategory === 'HOT'} label="☕ بار گرم" onClick={() => setActiveCategory('HOT')} />
        <CategoryTab active={activeCategory === 'COLD'} label="🍹 بار سرد" onClick={() => setActiveCategory('COLD')} />
        <CategoryTab active={activeCategory === 'DESSERT'} label="🍰 دسر" onClick={() => setActiveCategory('DESSERT')} />
      </div>
      
      <div className="p-4 space-y-4 min-h-[400px]">
        {loading && menu.length === 0 && (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-24 bg-[#2A1810] rounded-2xl animate-pulse" />
            ))}
          </div>
        )}
        
        {!loading && filteredItems.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-[#A89B95] opacity-50">
            <Coffee size={48} className="mb-4" />
            <p className="text-sm">در این بخش هنوز آیتمی ثبت نشده است.</p>
          </div>
        )}

        {filteredItems.map((item, idx) => {
          const cartItem = cart.find(i => i.id === item.id);
          return (
            <div 
              key={item.id} 
              className="bg-[#2A1810] border border-[#3D2B24] rounded-2xl p-3 flex items-center gap-3 animate-fade-in hover:border-[#D4A853]/40 transition-all shadow-sm hover:shadow-[0_4px_20px_rgba(0,0,0,0.3)] group" 
              style={{ animationDelay: `${idx * 0.05}s` }}
            >
              <div className="w-[85px] h-[85px] bg-[#3D2B24] rounded-2xl flex items-center justify-center text-3xl overflow-hidden shrink-0 shadow-inner border border-[#D4A853]/10 relative">
                {item.image ? (
                  <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                ) : (
                  <span className="text-3xl group-hover:scale-125 transition-transform duration-500">{item.emoji || '🍽️'}</span>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
              </div>
              <div className="flex-1 min-w-0 h-full flex flex-col justify-between py-1">
                <div>
                  <h3 className="text-[#F5E6D3] font-black text-sm mb-1">{item.name}</h3>
                  <p className="text-[#A89B95] text-[10px] leading-relaxed line-clamp-2">{item.description}</p>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <div className="flex flex-col">
                     <span className="text-[#D4A853] font-black text-sm">{(item.price / 1000).toLocaleString()}</span>
                     <span className="text-[8px] text-[#A89B95] -mt-1 uppercase tracking-widest font-bold">هزار تومان</span>
                  </div>
                  
                  {cartItem ? (
                    <div className="flex items-center gap-3 bg-black/40 rounded-full p-1 border border-[#D4A853]/30">
                      <button onClick={() => updateQuantity(item.id, -1)} className="w-7 h-7 flex items-center justify-center text-[#D4A853] hover:bg-[#D4A853]/20 rounded-full transition-colors"><Minus size={14} /></button>
                      <span className="text-xs font-black w-4 text-center text-[#F5E6D3]">{cartItem.quantity}</span>
                      <button onClick={() => updateQuantity(item.id, 1)} className="w-7 h-7 flex items-center justify-center text-[#D4A853] hover:bg-[#D4A853]/20 rounded-full transition-colors"><Plus size={14} /></button>
                    </div>
                  ) : (
                    <button 
                      onClick={() => addToCart(item)}
                      className="bg-[#D4A853] text-[#1C0F0A] px-5 py-2 rounded-xl text-[11px] font-black active:scale-90 transition-all flex items-center gap-1.5 shadow-[0_4px_15px_rgba(212,168,83,0.3)] hover:shadow-[0_6px_25px_rgba(212,168,83,0.4)]"
                    >
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

function CategoryTab({ active, label, onClick }: { active: boolean, label: string, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "flex-1 py-3 text-[11px] font-black transition-all rounded-xl m-1",
        active ? 'bg-[#D4A853] text-[#1C0F0A] shadow-lg' : 'text-[#A89B95] hover:text-[#F5E6D3]'
      )}
    >
      {label}
    </button>
  );
}

function CartView({ cart, updateQuantity, removeFromCart, total, tableNumber, onPlaceOrder, isSuccess }: any) {
  if (isSuccess) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] animate-fade-in p-6">
        <div className="relative mb-8">
           <div className="absolute inset-0 bg-[#D4A853] rounded-full animate-ping opacity-20"></div>
           <div className="relative w-24 h-24 bg-gradient-to-br from-[#D4A853] to-[#B88A3E] rounded-full flex items-center justify-center text-[#1C0F0A] shadow-[0_0_30px_rgba(212,168,83,0.5)]">
             <CheckCircle2 size={56} className="animate-bounce-subtle" />
           </div>
        </div>
        <h2 className="text-2xl font-black text-[#D4A853] mb-2">سفارش ثبت شد</h2>
        <p className="text-[#A89B95] text-center max-w-[250px] leading-relaxed">با سپاس از انتخاب شما، سفارش شما در اسرع وقت آماده خواهد شد.</p>
        <div className="mt-8 flex gap-2">
           <div className="w-1.5 h-1.5 rounded-full bg-[#D4A853] animate-bounce [animation-delay:-0.3s]"></div>
           <div className="w-1.5 h-1.5 rounded-full bg-[#D4A853] animate-bounce [animation-delay:-0.15s]"></div>
           <div className="w-1.5 h-1.5 rounded-full bg-[#D4A853] animate-bounce"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 animate-slide-up">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-black text-[#D4A853]">فاکتور سفارش</h2>
        <Badge variant="outline" className="border-[#D4A853]/30 text-[#D4A853]">{cart.length} آیتم</Badge>
      </div>

      {cart.length === 0 ? (
        <div className="text-center text-[#A89B95] mt-20 opacity-40">
           <ShoppingCart size={64} className="mx-auto mb-4" />
           <p className="text-lg">سبد خرید شما خالی است</p>
        </div>
      ) : (
        <div className="space-y-4 pb-32">
          {cart.map((item: any) => (
            <div key={item.id} className="bg-[#2A1810] border border-[#3D2B24] rounded-2xl p-4 flex items-center gap-4 group">
              <div className="w-12 h-12 rounded-xl bg-[#1C0F0A] flex items-center justify-center text-xl shrink-0">
                {item.image ? <img src={item.image} className="w-full h-full object-cover rounded-xl" /> : item.emoji}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-sm truncate">{item.name}</h4>
                <p className="text-[#D4A853] text-[10px] font-black uppercase tracking-wider">{(item.price * item.quantity / 1000).toLocaleString()} تومان</p>
              </div>
              <div className="flex items-center gap-3 bg-black/30 rounded-full px-3 py-1 border border-[#3D2B24]">
                <button onClick={() => updateQuantity(item.id, -1)} className="text-[#D4A853] active:scale-75 transition-transform"><Minus size={14} /></button>
                <span className="text-xs font-black w-4 text-center">{item.quantity}</span>
                <button onClick={() => updateQuantity(item.id, 1)} className="text-[#D4A853] active:scale-75 transition-transform"><Plus size={14} /></button>
              </div>
              <button onClick={() => removeFromCart(item.id)} className="text-red-500/30 hover:text-red-500 transition-colors p-1"><Trash2 size={18} /></button>
            </div>
          ))}
          
          <div className="bg-gradient-to-b from-[#2A1810] to-[#1C0F0A] border border-[#D4A853]/20 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-end border-b border-[#3D2B24] pb-4">
              <span className="text-[#A89B95] text-xs font-bold">مجموع کل:</span>
              <div className="text-right">
                <span className="text-2xl font-black text-[#D4A853]">{(total / 1000).toLocaleString()}</span>
                <span className="text-[10px] text-[#A89B95] block tracking-widest font-bold">هزار تومان</span>
              </div>
            </div>
            
            <div className="flex items-center gap-3 bg-black/40 rounded-xl p-3 border border-[#3D2B24]">
              <div className="w-10 h-10 bg-[#D4A853]/10 rounded-lg flex items-center justify-center text-[#D4A853]">
                <QrCode size={20} />
              </div>
              <div>
                <p className="text-[10px] text-[#A89B95] font-bold">تحویل سفارش:</p>
                <p className="text-sm font-black text-[#F5E6D3]">{tableNumber ? `میز شماره ${tableNumber}` : 'تحویل حضوری (بیرون‌بر)'}</p>
              </div>
            </div>

            <Button 
              onClick={onPlaceOrder} 
              disabled={cart.length === 0}
              className="w-full mt-2 bg-[#D4A853] hover:bg-[#D4A853]/80 active:scale-[0.98] text-[#1C0F0A] font-black h-14 text-lg rounded-2xl shadow-[0_4px_20px_rgba(212,168,83,0.3)] transition-all"
            >
              ✅ تایید نهایی و پرداخت
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
      <div className="p-8 text-center animate-fade-in flex flex-col items-center justify-center h-[60vh]">
        <div className="w-20 h-20 bg-[#D4A853]/20 rounded-full flex items-center justify-center mb-6">
           <CheckCircle2 size={40} className="text-[#D4A853]" />
        </div>
        <h2 className="text-xl font-black text-[#D4A853]">سپاس از شما</h2>
        <p className="text-[#A89B95] mt-3 text-sm leading-relaxed">نظرات شما به ما در ارائه خدمات بهتر کمک می‌کند.</p>
      </div>
    );
  }

  return (
    <div className="p-6 animate-fade-in max-w-sm mx-auto">
      <h2 className="text-2xl font-black mb-2 text-[#D4A853]">نظرسنجی</h2>
      <p className="text-[#A89B95] text-xs mb-8">تجربه خود را از حضور در کافه دیدار با ما در میان بگذارید.</p>
      
      <div className="flex justify-center gap-3 mb-10">
        {[1, 2, 3, 4, 5].map(star => (
          <button key={star} onClick={() => setRating(star)} className="transition-all hover:scale-125 active:scale-150">
            <Star size={36} fill={star <= rating ? '#D4A853' : 'transparent'} strokeWidth={1.5} color={star <= rating ? '#D4A853' : '#3D2B24'} />
          </button>
        ))}
      </div>

      <div className="space-y-6">
        <Textarea 
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="تجربه شما..."
          className="bg-[#2A1810] border-[#3D2B24] min-h-[120px] rounded-2xl p-4 text-sm focus:border-[#D4A853]/50"
        />
        <Button onClick={handleSubmit} disabled={rating === 0} className="w-full bg-[#D4A853] text-[#1C0F0A] font-black h-14 rounded-2xl shadow-lg">ثبت بازخورد</Button>
      </div>
    </div>
  );
}

function LoyaltyView() {
  const [phone, setPhone] = useState('');
  const [account, setAccount] = useState<{points: number} | null>(null);

  const handleSearch = () => {
    if (phone.length < 10) return;
    // Mocking loyalty check
    setAccount({ points: 150 });
  };

  return (
    <div className="p-6 animate-fade-in">
      <h2 className="text-2xl font-black mb-8 text-[#D4A853] text-center">باشگاه مشتریان</h2>
      {!account ? (
        <div className="bg-[#2A1810] border border-[#3D2B24] rounded-3xl p-8 space-y-6 shadow-2xl">
          <div className="w-16 h-16 bg-[#D4A853]/10 rounded-full flex items-center justify-center mx-auto text-[#D4A853] mb-2">
             <Star size={32} />
          </div>
          <div className="text-center space-y-1">
             <p className="text-sm font-bold">مشاهده امتیازات</p>
             <p className="text-[10px] text-[#A89B95]">شماره همراه خود را وارد کنید</p>
          </div>
          <Input 
            value={phone} 
            onChange={(e) => setPhone(e.target.value)} 
            placeholder="۰۹********* " 
            className="bg-[#1C0F0A] border-[#3D2B24] text-center rounded-2xl h-14 text-lg font-black tracking-[0.2em] focus:border-[#D4A853]" 
          />
          <Button onClick={handleSearch} className="w-full bg-[#D4A853] text-[#1C0F0A] font-black h-14 rounded-2xl shadow-lg">بررسی موجودی</Button>
        </div>
      ) : (
        <div className="space-y-6 animate-slide-up">
          <div className="relative h-[220px] w-full rounded-[32px] bg-gradient-to-br from-[#D4A853] via-[#B88A3E] to-[#8C642A] p-8 text-[#1C0F0A] shadow-2xl overflow-hidden group">
             <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10 blur-3xl"></div>
             <div className="relative z-10 flex flex-col h-full justify-between">
                <div className="flex justify-between items-start">
                   <div>
                      <h3 className="font-black text-xl tracking-tighter">کافه دیدار</h3>
                      <p className="text-[9px] opacity-70 font-black uppercase tracking-widest">Premium Member</p>
                   </div>
                   <Sparkles className="text-[#1C0F0A] opacity-40" />
                </div>
                <div className="flex justify-between items-end">
                   <div>
                      <p className="text-[10px] opacity-60 font-bold mb-1">امتیاز فعلی شما</p>
                      <p className="text-5xl font-black tracking-tighter">{account.points}</p>
                   </div>
                   <div className="text-right">
                      <p className="text-[11px] font-black opacity-80">{phone}</p>
                      <p className="text-[8px] opacity-60 font-bold">EXP: 12/25</p>
                   </div>
                </div>
             </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
             <div className="bg-[#2A1810] p-4 rounded-2xl border border-[#3D2B24] text-center">
                <p className="text-[10px] text-[#A89B95] font-bold">رتبه شما</p>
                <p className="text-lg font-black text-[#D4A853]">نقره‌ای</p>
             </div>
             <div className="bg-[#2A1810] p-4 rounded-2xl border border-[#3D2B24] text-center">
                <p className="text-[10px] text-[#A89B95] font-bold">تعداد بازدید</p>
                <p className="text-lg font-black text-[#D4A853]">۱۲ بار</p>
             </div>
          </div>
          <Button onClick={() => setAccount(null)} variant="ghost" className="w-full text-[#A89B95] font-bold">تغییر شماره همراه</Button>
        </div>
      )}
    </div>
  );
}

function GalleryView() {
  const images = [
    { id: 1, url: "https://picsum.photos/seed/didar1/600/600", hint: "cafe coffee" },
    { id: 2, url: "https://picsum.photos/seed/didar2/600/600", hint: "cafe dessert" },
    { id: 3, url: "https://picsum.photos/seed/didar3/600/600", hint: "cafe interior" },
    { id: 4, url: "https://picsum.photos/seed/didar4/600/600", hint: "cafe latte" },
    { id: 5, url: "https://picsum.photos/seed/didar5/600/600", hint: "cafe tea" },
    { id: 6, url: "https://picsum.photos/seed/didar6/600/600", hint: "cafe pastries" },
  ];
  return (
    <div className="p-4 animate-fade-in">
      <h2 className="text-2xl font-black text-[#D4A853] mb-6 text-center">گالری تصاویر</h2>
      <div className="grid grid-cols-2 gap-4">
        {images.map((img) => (
          <div key={img.id} className="aspect-square bg-[#2A1810] rounded-2xl border border-[#3D2B24] overflow-hidden shadow-lg group">
            <img src={img.url} data-ai-hint={img.hint} alt="Kafe Didar" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
          </div>
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
      <LogIn size={56} className="text-[#D4A853] mb-6" />
      <h2 className="text-2xl font-black mb-8 text-[#F5E6D3]">مدیریت سیستم</h2>
      <div className="w-full max-w-[300px] space-y-4">
        <Input 
          type="password" 
          value={pass} 
          onChange={(e) => setPass(e.target.value)} 
          placeholder="رمز عبور" 
          className="bg-[#2A1810] border-[#3D2B24] h-14 text-center rounded-2xl focus:border-[#D4A853]" 
        />
        {err && <p className="text-red-500 text-xs text-center font-bold">رمز عبور وارد شده اشتباه است!</p>}
        <Button onClick={handleLogin} className="w-full bg-[#D4A853] text-[#1C0F0A] font-black h-14 rounded-2xl">ورود به پنل</Button>
      </div>
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
      <div className="flex items-center justify-between mb-8 px-2">
        <h2 className="text-2xl font-black text-[#D4A853] flex items-center gap-3">
          <Settings2 size={28} /> مدیریت دیدار
        </h2>
        {newOrdersCount > 0 && <Badge className="bg-red-500 h-6 animate-pulse px-3">{newOrdersCount} سفارش جدید</Badge>}
      </div>

      <Tabs defaultValue="orders" className="w-full">
        <TabsList className="bg-[#2A1810] grid grid-cols-4 h-14 mb-8 rounded-2xl p-1">
          <TabsTrigger value="orders" className="rounded-xl data-[state=active]:bg-[#D4A853] data-[state=active]:text-[#1C0F0A]"><ListOrdered size={20} /></TabsTrigger>
          <TabsTrigger value="menu" className="rounded-xl data-[state=active]:bg-[#D4A853] data-[state=active]:text-[#1C0F0A]"><Coffee size={20} /></TabsTrigger>
          <TabsTrigger value="feedback" className="rounded-xl data-[state=active]:bg-[#D4A853] data-[state=active]:text-[#1C0F0A]"><MessageCircle size={20} /></TabsTrigger>
          <TabsTrigger value="qr" className="rounded-xl data-[state=active]:bg-[#D4A853] data-[state=active]:text-[#1C0F0A]"><QrCode size={20} /></TabsTrigger>
        </TabsList>
        
        <TabsContent value="orders" className="space-y-4">
          {!orders || orders.length === 0 ? (
            <div className="text-center py-24 opacity-30">
               <ListOrdered size={48} className="mx-auto mb-4" />
               <p>سفارشی یافت نشد</p>
            </div>
          ) : (
            orders.map(order => (
              <Card key={order.id} className="bg-[#2A1810] border-[#3D2B24] rounded-2xl overflow-hidden shadow-xl">
                <CardHeader className="p-4 flex flex-row items-center justify-between border-b border-[#3D2B24]">
                  <div className="flex items-center gap-3">
                    <div className="bg-[#D4A853] text-[#1C0F0A] w-10 h-10 rounded-xl flex items-center justify-center font-black shadow-lg">
                      {order.tableNumber === 'بیرون‌بر' ? '📦' : order.tableNumber}
                    </div>
                    <div className="flex flex-col">
                       <span className="text-xs font-black">میز {order.tableNumber}</span>
                       <span className="text-[10px] text-[#A89B95]">{new Date(order.timestamp).toLocaleTimeString('fa-IR')}</span>
                    </div>
                  </div>
                  <Badge className={cn("rounded-lg px-2 py-1", order.status === 'NEW' ? 'bg-red-500' : order.status === 'PREPARING' ? 'bg-blue-500' : 'bg-green-600')}>{order.status}</Badge>
                </CardHeader>
                <CardContent className="p-4">
                  <ul className="text-xs space-y-2 mb-6">
                    {order.items.map((item, i) => (
                      <li key={i} className="flex justify-between items-center bg-[#1C0F0A]/50 p-2 rounded-lg">
                        <span className="font-bold">{item.name}</span>
                        <Badge variant="secondary" className="bg-[#3D2B24] text-[#D4A853]">{item.quantity} عدد</Badge>
                      </li>
                    ))}
                  </ul>
                  <div className="flex gap-3">
                    <Button size="sm" onClick={() => handleUpdateStatus(order.id, 'PREPARING')} disabled={order.status !== 'NEW'} className="flex-1 rounded-xl h-10 font-bold">در حال آماده‌سازی</Button>
                    <Button size="sm" onClick={() => handleUpdateStatus(order.id, 'DELIVERED')} disabled={order.status === 'DELIVERED'} className="flex-1 rounded-xl h-10 font-bold bg-green-600 hover:bg-green-700">تحویل شد</Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="menu">
           <AdminMenuManager menu={menu} />
        </TabsContent>

        <TabsContent value="feedback" className="space-y-6">
           <Button onClick={handleSummarizeFeedback} disabled={isLoadingSummary || !feedback} className="w-full bg-[#D4A853] text-[#1C0F0A] font-black h-14 rounded-2xl shadow-lg flex items-center gap-2">
             {isLoadingSummary ? 'در حال تحلیل...' : <><Sparkles size={20} /> تحلیل هوشمند نظرات</>}
           </Button>
           
           {summary && (
             <div className="p-5 bg-gradient-to-br from-[#3D2B24] to-[#2A1810] rounded-2xl border border-[#D4A853]/30 shadow-2xl animate-fade-in">
                <div className="flex items-center gap-2 mb-3 text-[#D4A853]">
                   <Sparkles size={16} />
                   <h4 className="text-sm font-black">خلاصه تحلیل هوش مصنوعی</h4>
                </div>
                <p className="text-xs leading-relaxed text-[#F5E6D3]">{summary.summary}</p>
             </div>
           )}

           <div className="space-y-3">
             {feedback?.map((f, i) => (
               <div key={i} className="bg-[#2A1810] p-4 rounded-2xl border border-[#3D2B24] shadow-md">
                 <div className="flex justify-between items-center mb-2">
                    <div className="flex gap-0.5">{[...Array(f.rating)].map((_,s)=> <Star key={s} size={12} fill="#D4A853" color="#D4A853" />)}</div>
                    <span className="text-[10px] text-[#A89B95]">{new Date(f.timestamp).toLocaleDateString('fa-IR')}</span>
                 </div>
                 <p className="text-xs text-[#F5E6D3] leading-relaxed">{f.comment}</p>
               </div>
             ))}
           </div>
        </TabsContent>

        <TabsContent value="qr" className="grid grid-cols-2 gap-4 pb-20">
           {[...Array(6)].map((_, i) => (
             <Card key={i} className="bg-white p-4 text-black text-center rounded-[32px] shadow-2xl border-none">
                <p className="text-sm font-black mb-2 tracking-tighter">میز شماره {i+1}</p>
                <div className="bg-[#F5E6D3]/30 p-2 rounded-2xl">
                   <img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${window.location.origin}?table=${i+1}`} alt="QR" className="mx-auto rounded-xl" />
                </div>
                <p className="text-[8px] mt-2 opacity-40 font-bold uppercase">Cafe Didar Digital Menu</p>
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
  const [editForm, setEditForm] = useState<Partial<MenuItem>>({
    name: '',
    price: 0,
    description: '',
    category: 'HOT',
    emoji: '',
    image: ''
  });
  const firestore = useFirestore();

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

  const handleSave = () => {
    if (!firestore || !editForm.name) return;
    const finalData = { 
      name: editForm.name,
      price: Number(editForm.price) || 0,
      description: editForm.description || '',
      category: editForm.category || 'HOT',
      emoji: editForm.emoji || '🍽️',
      image: editForm.image || ''
    };
    
    if (isAdding) {
      addDoc(collection(firestore, 'menu'), finalData)
        .then(() => { 
          setIsAdding(false); 
          setEditForm({ name: '', price: 0, description: '', category: 'HOT', emoji: '', image: '' }); 
        })
        .catch(async () => errorEmitter.emit('permission-error', new FirestorePermissionError({ path: 'menu', operation: 'create', requestResourceData: finalData })));
    } else if (editingId) {
      updateDoc(doc(firestore, 'menu', editingId), finalData)
        .then(() => { 
          setEditingId(null); 
          setEditForm({ name: '', price: 0, description: '', category: 'HOT', emoji: '', image: '' }); 
        })
        .catch(async () => errorEmitter.emit('permission-error', new FirestorePermissionError({ path: `menu/${editingId}`, operation: 'update', requestResourceData: finalData })));
    }
  };

  const handleDelete = (id: string) => {
    if (!firestore || !confirm('آیا از حذف این آیتم اطمینان دارید؟')) return;
    deleteDoc(doc(firestore, 'menu', id))
      .catch(async () => errorEmitter.emit('permission-error', new FirestorePermissionError({ path: `menu/${id}`, operation: 'delete' })));
  };

  const startEdit = (item: MenuItem) => {
    setEditingId(item.id);
    setEditForm({ ...item });
    setIsAdding(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="space-y-6">
      <Button 
        onClick={() => { 
          setIsAdding(true); 
          setEditingId(null); 
          setEditForm({ name: '', price: 0, description: '', category: 'HOT', emoji: '', image: '' }); 
        }} 
        className="w-full bg-[#D4A853] text-[#1C0F0A] font-black h-14 rounded-2xl shadow-lg"
      >
        افزودن آیتم جدید +
      </Button>
      
      {(isAdding || editingId) && (
        <Card className="bg-[#2A1810] p-6 space-y-4 border-[#D4A853]/40 shadow-2xl animate-slide-up rounded-3xl relative">
          <button onClick={() => { setIsAdding(false); setEditingId(null); }} className="absolute top-4 left-4 text-[#A89B95]"><Minus /></button>
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-[10px] text-[#D4A853] mr-2 font-bold uppercase tracking-wider">نام آیتم</label>
              <Input placeholder="مثلاً کاپوچینو ویژه" value={editForm.name || ''} onChange={e => setEditForm({...editForm, name: e.target.value})} className="bg-[#1C0F0A] border-[#3D2B24] h-12 rounded-xl" />
            </div>
            <div className="w-24">
              <label className="text-[10px] text-[#D4A853] mr-2 font-bold uppercase tracking-wider">ایموجی</label>
              <Input placeholder="☕" value={editForm.emoji || ''} onChange={e => setEditForm({...editForm, emoji: e.target.value})} className="bg-[#1C0F0A] border-[#3D2B24] h-12 text-center rounded-xl" />
            </div>
          </div>
          
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-[10px] text-[#D4A853] mr-2 font-bold uppercase tracking-wider">دسته بندی</label>
              <Select value={editForm.category} onValueChange={(val: Category) => setEditForm({...editForm, category: val})}>
                <SelectTrigger className="bg-[#1C0F0A] border-[#3D2B24] h-12 rounded-xl">
                  <SelectValue placeholder="انتخاب دسته" />
                </SelectTrigger>
                <SelectContent className="bg-[#2A1810] border-[#3D2B24]">
                  <SelectItem value="HOT">☕ بار گرم</SelectItem>
                  <SelectItem value="COLD">🍹 بار سرد</SelectItem>
                  <SelectItem value="DESSERT">🍰 دسر</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-32">
              <label className="text-[10px] text-[#D4A853] mr-2 font-bold uppercase tracking-wider">قیمت (تومان)</label>
              <Input placeholder="150000" type="number" value={editForm.price || ''} onChange={e => setEditForm({...editForm, price: Number(e.target.value)})} className="bg-[#1C0F0A] border-[#3D2B24] h-12 rounded-xl" />
            </div>
          </div>

          <div>
            <label className="text-[10px] text-[#D4A853] mr-2 font-bold uppercase tracking-wider">توضیحات</label>
            <Textarea placeholder="ترکیب دانه‌های عربیکا..." value={editForm.description || ''} onChange={e => setEditForm({...editForm, description: e.target.value})} className="bg-[#1C0F0A] border-[#3D2B24] min-h-[100px] rounded-xl p-3" />
          </div>

          <div className="space-y-3">
            <label className="text-[10px] text-[#D4A853] mr-2 font-bold uppercase tracking-wider">تصویر محصول</label>
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 bg-[#1C0F0A] rounded-2xl border border-[#3D2B24] flex items-center justify-center overflow-hidden shrink-0 shadow-inner">
                {editForm.image ? <img src={editForm.image} className="w-full h-full object-cover" /> : <ImageIcon size={24} className="text-[#3D2B24]" />}
              </div>
              <label className="flex-1 flex items-center justify-center gap-3 bg-[#1C0F0A]/50 hover:bg-[#1C0F0A] text-xs py-5 rounded-2xl cursor-pointer transition-all border-2 border-dashed border-[#3D2B24] hover:border-[#D4A853]/50">
                <Upload size={18} className="text-[#D4A853]" /> 
                <span className="font-bold">انتخاب عکس از گالری</span>
                <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
              </label>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button onClick={handleSave} className="flex-1 bg-[#D4A853] text-[#1C0F0A] font-black h-14 rounded-2xl">ذخیره نهایی</Button>
            <Button onClick={() => { setIsAdding(false); setEditingId(null); }} variant="outline" className="flex-1 border-[#3D2B24] text-[#A89B95] h-14 rounded-2xl">انصراف</Button>
          </div>
        </Card>
      )}

      <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
        {menu.length === 0 && (
          <div className="text-center py-20 opacity-20">
             <Coffee size={40} className="mx-auto mb-2" />
             <p className="text-sm">لیست منو خالی است</p>
          </div>
        )}
        {menu.map(item => (
          <div key={item.id} className="bg-[#2A1810] p-4 rounded-2xl flex justify-between items-center border border-[#3D2B24] hover:border-[#D4A853]/30 transition-all shadow-md group">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-[#1C0F0A] flex items-center justify-center text-xl border border-[#D4A853]/10 overflow-hidden shadow-inner">
                {item.image ? <img src={item.image} className="w-full h-full object-cover" /> : item.emoji}
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-black">{item.name}</span>
                <span className="text-[10px] text-[#D4A853] font-bold uppercase tracking-widest">{(item.price/1000).toLocaleString()} تومان</span>
              </div>
            </div>
            <div className="flex gap-2">
              <Button size="icon" variant="ghost" onClick={() => startEdit(item)} className="h-10 w-10 rounded-xl text-[#A89B95] hover:text-[#D4A853] hover:bg-[#D4A853]/10"><Pencil size={18} /></Button>
              <Button size="icon" variant="ghost" onClick={() => handleDelete(item.id)} className="h-10 w-10 rounded-xl text-red-500/40 hover:text-red-500 hover:bg-red-500/10"><Trash2 size={18} /></Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

