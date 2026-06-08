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
  ChevronLeft,
  Loader2,
  Box,
  LayoutDashboard,
  TrendingUp,
  Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { summarizeCustomerFeedback } from '@/ai/flows/summarize-customer-feedback-flow';
import { generateMenuItemDescription } from '@/ai/flows/generate-menu-item-description';
import { useCollection, useFirestore } from '@/firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, query, orderBy, serverTimestamp, limit } from 'firebase/firestore';
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

  // Optimized Menu Query
  const menuQuery = useMemo(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'menu'), orderBy('name', 'asc'));
  }, [firestore]);
  
  const { data: menuData, loading: menuLoading } = useCollection<MenuItem>(menuQuery);
  const menu = menuData || [];

  // Table number detection from URL
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const table = params.get('table');
      if (table) setTableNumber(table);
    }
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
      tableNumber: tableNumber || 'Takeout',
      items: cart.map(i => ({ id: i.id, name: i.name, price: i.price, quantity: i.quantity })),
      totalPrice: cartTotal,
      timestamp: new Date().toISOString(),
      status: 'NEW' as const,
      createdAt: serverTimestamp()
    };

    addDoc(collection(firestore, 'orders'), orderData)
      .then(() => {
        setIsSuccess(true);
        setCart([]);
        setTimeout(() => {
          setIsSuccess(false);
          setCurrentView('MENU');
        }, 3500);
      })
      .catch(async () => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: 'orders',
          operation: 'create',
          requestResourceData: orderData
        }));
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
      <header className="h-[65px] flex items-center justify-between px-4 bg-black/60 backdrop-blur-xl border-b border-[#D4A853]/30 shadow-[0_4px_30px_rgba(212,168,83,0.15)] fixed top-0 w-full max-w-[500px] z-[100]">
        <div className="flex items-center gap-2">
          {currentView === 'MENU' && (
            <button 
              onClick={() => setCurrentView('CART')}
              className="relative flex items-center gap-2 bg-gradient-to-r from-[#2A1810] to-[#1C0F0A] px-3 py-2 rounded-xl border border-[#D4A853]/30 transition-all hover:border-[#D4A853]/60 active:scale-95 group"
            >
              <ShoppingCart size={18} className="text-[#D4A853] group-hover:rotate-12 transition-transform" />
              <span className="text-xs text-[#F5E6D3] font-bold">سبد خرید</span>
              {cartItemCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-[#D4A853] text-[#1C0F0A] text-[11px] w-6 h-6 flex items-center justify-center rounded-full font-black shadow-[0_0_15px_rgba(212,168,83,0.6)] animate-pulse">
                  {cartItemCount}
                </span>
              )}
            </button>
          )}
          {['CART', 'FEEDBACK', 'LOYALTY', 'GALLERY'].includes(currentView) && (
            <button onClick={() => setCurrentView('MENU')} className="text-[#D4A853] text-sm font-bold flex items-center gap-1 group">
              <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" /> بازگشت
            </button>
          )}
          {(currentView === 'ADMIN_LOGIN' || currentView === 'ADMIN_DASHBOARD') && (
            <button onClick={() => setCurrentView('MENU')} className="text-red-400 text-xs font-bold flex items-center gap-1 bg-red-500/10 px-3 py-1.5 rounded-lg border border-red-500/20">
              خروج از مدیریت
            </button>
          )}
        </div>
        <div className="flex flex-col items-center">
          <h1 
            onClick={handleLogoClick}
            className="text-[#D4A853] font-black text-2xl cursor-pointer select-none tracking-tighter drop-shadow-[0_0_12px_rgba(212,168,83,0.4)] hover:scale-105 transition-transform"
          >
            دیدار
          </h1>
          {tableNumber && (
            <span className="text-[9px] bg-[#D4A853]/20 text-[#D4A853] px-2 py-0.5 rounded-full font-bold border border-[#D4A853]/30 tracking-widest">TABLE {tableNumber}</span>
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

      <nav className="h-[75px] bg-black/80 backdrop-blur-2xl border-t border-[#D4A853]/10 fixed bottom-0 w-full max-w-[500px] z-50 flex items-center justify-around px-4 shadow-[0_-4px_30px_rgba(0,0,0,0.5)]">
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
      <div className={cn("transition-transform duration-300", active ? "scale-125 -translate-y-1.5" : "scale-100")}>
        {icon}
      </div>
      <span className="text-[10px] font-black uppercase tracking-wider">{label}</span>
      {active && <span className="absolute -bottom-1 w-1.5 h-1.5 bg-[#D4A853] rounded-full shadow-[0_0_12px_#D4A853]"></span>}
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
    <div className="animate-fade-in pb-10">
      <div className="flex w-full bg-[#1C0F0A]/95 backdrop-blur-md sticky top-0 z-40 border-b border-[#3D2B24] p-1">
        <CategoryTab active={activeCategory === 'HOT'} label="☕ بار گرم" onClick={() => setActiveCategory('HOT')} />
        <CategoryTab active={activeCategory === 'COLD'} label="🍹 بار سرد" onClick={() => setActiveCategory('COLD')} />
        <CategoryTab active={activeCategory === 'DESSERT'} label="🍰 دسر" onClick={() => setActiveCategory('DESSERT')} />
      </div>
      
      <div className="p-4 space-y-4 min-h-[400px]">
        {loading && (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-28 bg-[#2A1810] rounded-2xl animate-pulse border border-[#3D2B24]" />
            ))}
          </div>
        )}
        
        {!loading && filteredItems.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-[#A89B95] opacity-30">
            <Coffee size={64} className="mb-4 stroke-1" />
            <p className="text-sm font-bold">هنوز آیتمی در این بخش وجود ندارد.</p>
          </div>
        )}

        {filteredItems.map((item, idx) => {
          const cartItem = cart.find(i => i.id === item.id);
          return (
            <div 
              key={item.id} 
              className="bg-[#2A1810] border border-[#3D2B24] rounded-2xl p-3 flex items-center gap-3 animate-fade-in hover:border-[#D4A853]/40 transition-all shadow-sm group relative overflow-hidden" 
              style={{ animationDelay: `${idx * 0.05}s` }}
            >
              <div className="w-[95px] h-[95px] bg-[#3D2B24] rounded-2xl flex items-center justify-center text-3xl overflow-hidden shrink-0 shadow-inner border border-[#D4A853]/10 relative">
                {item.image ? (
                  <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                ) : (
                  <span className="text-4xl group-hover:scale-125 transition-transform duration-500">{item.emoji || '🍽️'}</span>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
              </div>
              <div className="flex-1 min-w-0 h-full flex flex-col justify-between py-1">
                <div>
                  <h3 className="text-[#F5E6D3] font-black text-sm mb-1 leading-tight">{item.name}</h3>
                  <p className="text-[#A89B95] text-[10px] leading-relaxed line-clamp-2 italic">{item.description}</p>
                </div>
                <div className="flex items-center justify-between mt-3">
                  <div className="flex flex-col">
                     <span className="text-[#D4A853] font-black text-lg">{(item.price / 1000).toLocaleString()}</span>
                     <span className="text-[8px] text-[#A89B95] -mt-1 uppercase tracking-[0.2em] font-bold">Toman</span>
                  </div>
                  
                  {cartItem ? (
                    <div className="flex items-center gap-3 bg-black/50 rounded-full p-1 border border-[#D4A853]/40 shadow-lg">
                      <button onClick={() => updateQuantity(item.id, -1)} className="w-8 h-8 flex items-center justify-center text-[#D4A853] hover:bg-[#D4A853]/20 rounded-full transition-colors"><Minus size={16} /></button>
                      <span className="text-xs font-black w-5 text-center text-[#F5E6D3]">{cartItem.quantity}</span>
                      <button onClick={() => updateQuantity(item.id, 1)} className="w-8 h-8 flex items-center justify-center text-[#D4A853] hover:bg-[#D4A853]/20 rounded-full transition-colors"><Plus size={16} /></button>
                    </div>
                  ) : (
                    <button 
                      onClick={() => addToCart(item)}
                      className="bg-gradient-to-br from-[#D4A853] to-[#B88A3E] text-[#1C0F0A] px-6 py-2.5 rounded-xl text-[11px] font-black active:scale-95 transition-all flex items-center gap-1.5 shadow-[0_4px_15px_rgba(212,168,83,0.4)]"
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
        "flex-1 py-3.5 text-[11px] font-black transition-all rounded-xl m-1 border border-transparent",
        active ? 'bg-[#D4A853] text-[#1C0F0A] shadow-xl border-[#D4A853]' : 'text-[#A89B95] hover:text-[#F5E6D3] hover:bg-[#2A1810]'
      )}
    >
      {label}
    </button>
  );
}

function CartView({ cart, updateQuantity, removeFromCart, total, tableNumber, onPlaceOrder, isSuccess }: any) {
  if (isSuccess) {
    return (
      <div className="flex flex-col items-center justify-center h-[75vh] animate-fade-in p-6">
        <div className="relative mb-10">
           <div className="absolute inset-0 bg-[#D4A853] rounded-full animate-ping-slow opacity-20 scale-150"></div>
           <div className="absolute inset-0 bg-[#D4A853] rounded-full animate-ping-slow opacity-10 scale-[2]"></div>
           <div className="relative w-32 h-32 bg-gradient-to-br from-[#D4A853] to-[#B88A3E] rounded-full flex items-center justify-center text-[#1C0F0A] shadow-[0_0_60px_rgba(212,168,83,0.5)] z-10 border-4 border-[#1C0F0A]">
             <CheckCircle2 size={72} className="animate-bounce-subtle" />
           </div>
        </div>
        <div className="text-center animate-slide-up [animation-delay:0.3s] space-y-4">
          <h2 className="text-4xl font-black text-[#D4A853] tracking-tighter">سفارش ثبت شد</h2>
          <div className="space-y-2">
            <p className="text-[#A89B95] text-center max-w-[300px] leading-relaxed text-sm">
              با سپاس از انتخاب شما. 
              {tableNumber ? (
                <span> سفارش میز شماره <span className="text-[#F5E6D3] font-bold text-lg">{tableNumber}</span> ثبت شد.</span>
              ) : (
                <span> سفارش شما به صورت <span className="text-[#F5E6D3] font-bold text-lg">بیرون‌بر</span> ثبت شد.</span>
              )}
            </p>
            <p className="text-[#D4A853]/60 text-xs font-bold">بزودی آماده پذیرایی از شما هستیم.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 animate-slide-up pb-20">
      <div className="flex items-center justify-between mb-10">
        <h2 className="text-3xl font-black text-[#D4A853] tracking-tight">صورتحساب</h2>
        <Badge variant="outline" className="border-[#D4A853]/40 text-[#D4A853] bg-[#D4A853]/5 px-4 py-1.5 rounded-lg font-black">{cart.length} آیتم</Badge>
      </div>

      {cart.length === 0 ? (
        <div className="text-center text-[#A89B95] mt-24 opacity-20">
           <ShoppingCart size={80} className="mx-auto mb-6 stroke-1" />
           <p className="text-xl font-bold">سبد خرید شما خالی است</p>
           <p className="text-xs mt-2">همین حالا طعم‌های جدید را امتحان کنید</p>
        </div>
      ) : (
        <div className="space-y-4">
          {cart.map((item: any) => (
            <div key={item.id} className="bg-[#2A1810] border border-[#3D2B24] rounded-2xl p-4 flex items-center gap-4 group hover:border-[#D4A853]/30 transition-all">
              <div className="w-14 h-14 rounded-xl bg-[#1C0F0A] flex items-center justify-center text-2xl shrink-0 border border-[#3D2B24] overflow-hidden shadow-inner">
                {item.image ? <img src={item.image} className="w-full h-full object-cover" alt="" /> : <span>{item.emoji}</span>}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-sm truncate text-[#F5E6D3]">{item.name}</h4>
                <p className="text-[#D4A853] text-[10px] font-black uppercase tracking-widest mt-1">{(item.price * item.quantity / 1000).toLocaleString()} تومان</p>
              </div>
              <div className="flex items-center gap-4 bg-black/40 rounded-full px-4 py-1.5 border border-[#3D2B24]">
                <button onClick={() => updateQuantity(item.id, -1)} className="text-[#D4A853] active:scale-75 transition-transform"><Minus size={16} /></button>
                <span className="text-xs font-black w-5 text-center">{item.quantity}</span>
                <button onClick={() => updateQuantity(item.id, 1)} className="text-[#D4A853] active:scale-75 transition-transform"><Plus size={16} /></button>
              </div>
              <button onClick={() => removeFromCart(item.id)} className="text-red-500/30 hover:text-red-500 transition-colors p-1.5"><Trash2 size={20} /></button>
            </div>
          ))}
          
          <div className="mt-10 bg-gradient-to-b from-[#2A1810] to-[#1C0F0A] border border-[#D4A853]/30 rounded-3xl p-6 shadow-[0_10px_50px_rgba(0,0,0,0.5)] space-y-6">
            <div className="flex justify-between items-end border-b border-[#3D2B24] pb-6">
              <span className="text-[#A89B95] text-xs font-bold uppercase tracking-widest">مبلغ نهایی:</span>
              <div className="text-right">
                <span className="text-3xl font-black text-[#D4A853] tracking-tighter">{(total / 1000).toLocaleString()}</span>
                <span className="text-[10px] text-[#A89B95] block tracking-[0.3em] font-black uppercase mt-1">Thousand Toman</span>
              </div>
            </div>
            
            <div className="flex items-center gap-4 bg-black/40 rounded-2xl p-4 border border-[#3D2B24]">
              <div className="w-12 h-12 bg-[#D4A853]/15 rounded-xl flex items-center justify-center text-[#D4A853] border border-[#D4A853]/20 shadow-inner">
                {tableNumber ? <QrCode size={24} /> : <Box size={24} />}
              </div>
              <div>
                <p className="text-[10px] text-[#A89B95] font-black uppercase tracking-widest">Delivery Mode:</p>
                <p className="text-sm font-black text-[#F5E6D3]">{tableNumber ? `میز شماره ${tableNumber}` : 'تحویل حضوری (بیرون‌بر)'}</p>
              </div>
            </div>

            <Button 
              onClick={onPlaceOrder} 
              disabled={cart.length === 0}
              className="w-full mt-4 bg-gradient-to-r from-[#D4A853] to-[#B88A3E] hover:from-[#E5B964] hover:to-[#C99B4F] active:scale-[0.98] text-[#1C0F0A] font-black h-16 text-lg rounded-2xl shadow-[0_10px_30px_rgba(212,168,83,0.3)] transition-all border-none"
            >
              ✅ تایید نهایی و ثبت سفارش
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
      timestamp: new Date().toISOString(),
      createdAt: serverTimestamp()
    };
    addDoc(collection(firestore, 'feedback'), feedbackData)
      .then(() => setSubmitted(true))
      .catch(async () => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({ path: 'feedback', operation: 'create', requestResourceData: feedbackData }));
      });
  };

  if (submitted) {
    return (
      <div className="p-10 text-center animate-fade-in flex flex-col items-center justify-center h-[65vh]">
        <div className="w-24 h-24 bg-[#D4A853]/15 rounded-full flex items-center justify-center mb-8 border border-[#D4A853]/20 shadow-2xl">
           <CheckCircle2 size={48} className="text-[#D4A853] animate-bounce-subtle" />
        </div>
        <h2 className="text-2xl font-black text-[#D4A853] tracking-tighter">سپاس از بازخورد شما</h2>
        <p className="text-[#A89B95] mt-4 text-sm leading-relaxed max-w-[250px] mx-auto">نظرات ارزشمند شما به ما در ارائه تجربه‌ای لوکس‌تر و بهتر کمک می‌کند.</p>
        <Button onClick={() => setSubmitted(false)} variant="ghost" className="mt-10 text-[#D4A853] font-bold">ارسال نظر جدید</Button>
      </div>
    );
  }

  return (
    <div className="p-6 animate-fade-in max-w-sm mx-auto pb-20">
      <h2 className="text-3xl font-black mb-3 text-[#D4A853] tracking-tight">نظرسنجی</h2>
      <p className="text-[#A89B95] text-xs mb-10 leading-relaxed">تجربه حضور خود در کافه دیدار را ارزیابی کنید. نظرات شما روشنایی مسیر ماست.</p>
      
      <div className="flex justify-center gap-4 mb-12">
        {[1, 2, 3, 4, 5].map(star => (
          <button key={star} onClick={() => setRating(star)} className="transition-all hover:scale-125 active:scale-150">
            <Star size={42} fill={star <= rating ? '#D4A853' : 'transparent'} strokeWidth={1.5} color={star <= rating ? '#D4A853' : '#3D2B24'} className={cn("transition-colors", star <= rating && "drop-shadow-[0_0_10px_#D4A853]")} />
          </button>
        ))}
      </div>

      <div className="space-y-8">
        <Textarea 
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="شما بنویسید..."
          className="bg-[#2A1810] border-[#3D2B24] min-h-[150px] rounded-[24px] p-5 text-sm focus:border-[#D4A853]/50 focus:ring-0 placeholder:text-[#3D2B24]"
        />
        <Button onClick={handleSubmit} disabled={rating === 0} className="w-full bg-gradient-to-r from-[#D4A853] to-[#B88A3E] text-[#1C0F0A] font-black h-16 rounded-2xl shadow-xl active:scale-[0.98] transition-all border-none text-lg">ثبت بازخورد</Button>
      </div>
    </div>
  );
}

function LoyaltyView() {
  const [phone, setPhone] = useState('');
  const [account, setAccount] = useState<{points: number} | null>(null);

  const handleSearch = () => {
    if (phone.length < 10) return;
    setAccount({ points: 2750 });
  };

  return (
    <div className="p-6 animate-fade-in pb-20">
      <h2 className="text-3xl font-black mb-10 text-[#D4A853] text-center tracking-tight">باشگاه مشتریان</h2>
      {!account ? (
        <div className="bg-gradient-to-b from-[#2A1810] to-[#1C0F0A] border border-[#D4A853]/20 rounded-[40px] p-10 space-y-8 shadow-[0_20px_50px_rgba(0,0,0,0.6)]">
          <div className="w-20 h-20 bg-[#D4A853]/10 rounded-full flex items-center justify-center mx-auto text-[#D4A853] mb-2 border border-[#D4A853]/20">
             <Star size={40} className="animate-pulse" />
          </div>
          <div className="text-center space-y-2">
             <p className="text-lg font-black text-[#F5E6D3]">مشاهده امتیازات</p>
             <p className="text-[10px] text-[#A89B95] uppercase tracking-widest font-bold">Enter your phone number</p>
          </div>
          <Input 
            value={phone} 
            onChange={(e) => setPhone(e.target.value)} 
            placeholder="۰۹********* " 
            className="bg-[#1C0F0A] border-[#3D2B24] text-center rounded-2xl h-16 text-2xl font-black tracking-[0.3em] focus:border-[#D4A853] text-[#D4A853]" 
          />
          <Button onClick={handleSearch} className="w-full bg-[#D4A853] text-[#1C0F0A] font-black h-16 rounded-2xl shadow-xl text-lg border-none active:scale-[0.98]">بررسی موجودی</Button>
        </div>
      ) : (
        <div className="space-y-8 animate-slide-up">
          <div className="relative h-[250px] w-full rounded-[40px] bg-gradient-to-br from-[#D4A853] via-[#B88A3E] to-[#8C642A] p-10 text-[#1C0F0A] shadow-[0_20px_60px_rgba(212,168,83,0.4)] overflow-hidden group">
             <div className="absolute top-0 right-0 w-48 h-48 bg-white/20 rounded-full -mr-16 -mt-16 blur-3xl animate-pulse"></div>
             <div className="absolute bottom-0 left-0 w-32 h-32 bg-black/10 rounded-full -ml-10 -mb-10 blur-2xl"></div>
             <div className="relative z-10 flex flex-col h-full justify-between">
                <div className="flex justify-between items-start">
                   <div>
                      <h3 className="font-black text-2xl tracking-tighter">کافه دیدار</h3>
                      <p className="text-[10px] opacity-70 font-black uppercase tracking-[0.2em] mt-1">Diamond Privilege</p>
                   </div>
                   <Sparkles className="text-[#1C0F0A] opacity-50 animate-bounce-subtle" size={28} />
                </div>
                <div className="flex justify-between items-end">
                   <div>
                      <p className="text-[10px] opacity-70 font-bold mb-2 uppercase tracking-widest">Available Points</p>
                      <p className="text-6xl font-black tracking-tighter drop-shadow-lg">{account.points.toLocaleString()}</p>
                   </div>
                   <div className="text-right">
                      <p className="text-[12px] font-black opacity-90 tracking-widest">{phone}</p>
                      <p className="text-[9px] opacity-70 font-black mt-1">SINCE 2024</p>
                   </div>
                </div>
             </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
             <div className="bg-[#2A1810] p-6 rounded-[30px] border border-[#3D2B24] text-center shadow-lg hover:border-[#D4A853]/40 transition-colors">
                <p className="text-[10px] text-[#A89B95] font-black uppercase tracking-widest mb-2">Member Level</p>
                <p className="text-xl font-black text-[#D4A853]">الماس طلایی</p>
             </div>
             <div className="bg-[#2A1810] p-6 rounded-[30px] border border-[#3D2B24] text-center shadow-lg hover:border-[#D4A853]/40 transition-colors">
                <p className="text-[10px] text-[#A89B95] font-black uppercase tracking-widest mb-2">Visits</p>
                <p className="text-xl font-black text-[#D4A853]">۳۴ مرتبه</p>
             </div>
          </div>
          <Button onClick={() => setAccount(null)} variant="ghost" className="w-full text-[#A89B95] font-bold h-12">تغییر شماره همراه</Button>
        </div>
      )}
    </div>
  );
}

function GalleryView() {
  const images = [
    { id: 1, url: "https://picsum.photos/seed/didar101/600/600", hint: "luxury cafe" },
    { id: 2, url: "https://picsum.photos/seed/didar102/600/600", hint: "persian tea" },
    { id: 3, url: "https://picsum.photos/seed/didar103/600/600", hint: "cafe dessert" },
    { id: 4, url: "https://picsum.photos/seed/didar104/600/600", hint: "modern interior" },
    { id: 5, url: "https://picsum.photos/seed/didar105/600/600", hint: "espresso shot" },
    { id: 6, url: "https://picsum.photos/seed/didar106/600/600", hint: "cafe pastry" },
  ];
  return (
    <div className="p-4 animate-fade-in pb-20">
      <h2 className="text-3xl font-black text-[#D4A853] mb-8 text-center tracking-tight">گالری دیدار</h2>
      <div className="grid grid-cols-2 gap-4">
        {images.map((img) => (
          <div key={img.id} className="aspect-square bg-[#2A1810] rounded-[24px] border border-[#3D2B24] overflow-hidden shadow-2xl group relative">
            <img src={img.url} data-ai-hint={img.hint} alt="Kafe Didar" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
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
    <div className="p-8 flex flex-col items-center justify-center h-[75vh] animate-fade-in">
      <div className="w-20 h-20 bg-[#D4A853]/10 rounded-3xl flex items-center justify-center mb-8 border border-[#D4A853]/20 shadow-2xl">
        <LogIn size={42} className="text-[#D4A853]" />
      </div>
      <h2 className="text-3xl font-black mb-10 text-[#F5E6D3] tracking-tighter">مدیریت کافه دیدار</h2>
      <div className="w-full max-w-[320px] space-y-6">
        <div className="space-y-2">
          <Input 
            type="password" 
            value={pass} 
            onChange={(e) => { setPass(e.target.value); setErr(false); }} 
            placeholder="رمز عبور مدیریتی" 
            className="bg-[#2A1810] border-[#3D2B24] h-16 text-center rounded-2xl focus:border-[#D4A853] text-xl tracking-[0.5em]" 
          />
          {err && <p className="text-red-500 text-xs text-center font-bold animate-shake">رمز عبور اشتباه است!</p>}
        </div>
        <Button onClick={handleLogin} className="w-full bg-[#D4A853] text-[#1C0F0A] font-black h-16 rounded-2xl shadow-xl text-lg active:scale-[0.98] border-none">ورود به سیستم</Button>
      </div>
    </div>
  );
}

function AdminDashboard({ menu }: { menu: MenuItem[] }) {
  const firestore = useFirestore();
  
  // Real-time queries for admin dashboard
  const ordersQuery = useMemo(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'orders'), orderBy('createdAt', 'desc'), limit(50));
  }, [firestore]);
  
  const { data: orders, loading: ordersLoading } = useCollection<Order>(ordersQuery);

  const feedbackQuery = useMemo(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'feedback'), orderBy('createdAt', 'desc'), limit(100));
  }, [firestore]);
  
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
    <div className="p-4 animate-fade-in bg-[#1C0F0A] min-h-screen pb-24">
      <div className="grid grid-cols-2 gap-3 mb-8">
        <div className="bg-[#2A1810] border border-[#3D2B24] p-4 rounded-2xl flex flex-col justify-between h-28">
          <div className="flex justify-between items-start">
            <LayoutDashboard size={18} className="text-[#D4A853]" />
            {newOrdersCount > 0 && <span className="w-2 h-2 bg-red-500 rounded-full animate-ping"></span>}
          </div>
          <div>
            <p className="text-[10px] text-[#A89B95] font-black uppercase">سفارشات جدید</p>
            <p className="text-2xl font-black text-[#F5E6D3]">{newOrdersCount}</p>
          </div>
        </div>
        <div className="bg-[#2A1810] border border-[#3D2B24] p-4 rounded-2xl flex flex-col justify-between h-28">
          <TrendingUp size={18} className="text-[#D4A853]" />
          <div>
            <p className="text-[10px] text-[#A89B95] font-black uppercase">کل سفارشات امروز</p>
            <p className="text-2xl font-black text-[#F5E6D3]">{orders?.length || 0}</p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="orders" className="w-full">
        <TabsList className="bg-[#2A1810] grid grid-cols-4 h-16 mb-8 rounded-2xl p-1.5 border border-[#3D2B24] shadow-2xl">
          <TabsTrigger value="orders" className="rounded-xl data-[state=active]:bg-[#D4A853] data-[state=active]:text-[#1C0F0A] transition-all"><ListOrdered size={22} /></TabsTrigger>
          <TabsTrigger value="menu" className="rounded-xl data-[state=active]:bg-[#D4A853] data-[state=active]:text-[#1C0F0A] transition-all"><Coffee size={22} /></TabsTrigger>
          <TabsTrigger value="feedback" className="rounded-xl data-[state=active]:bg-[#D4A853] data-[state=active]:text-[#1C0F0A] transition-all"><MessageCircle size={22} /></TabsTrigger>
          <TabsTrigger value="qr" className="rounded-xl data-[state=active]:bg-[#D4A853] data-[state=active]:text-[#1C0F0A] transition-all"><QrCode size={22} /></TabsTrigger>
        </TabsList>
        
        <TabsContent value="orders" className="space-y-4">
          {ordersLoading && (
            <div className="flex flex-col items-center justify-center py-20 opacity-30">
              <Loader2 className="animate-spin text-[#D4A853] mb-4" size={48} />
              <p className="font-bold">در حال بارگذاری سفارشات...</p>
            </div>
          )}
          {!ordersLoading && (!orders || orders.length === 0) ? (
            <div className="text-center py-32 opacity-20">
               <ListOrdered size={64} className="mx-auto mb-6 stroke-1" />
               <p className="font-bold text-sm">سفارشی یافت نشد</p>
            </div>
          ) : (
            orders?.map(order => (
              <Card key={order.id} className="bg-[#2A1810] border-[#3D2B24] rounded-3xl overflow-hidden shadow-2xl hover:border-[#D4A853]/20 transition-all">
                <CardHeader className="p-4 flex flex-row items-center justify-between border-b border-[#3D2B24]/50">
                  <div className="flex items-center gap-3">
                    <div className="bg-[#D4A853] text-[#1C0F0A] w-10 h-10 rounded-xl flex items-center justify-center font-black shadow-lg text-sm border border-[#1C0F0A]/20">
                      {order.tableNumber === 'Takeout' ? '📦' : order.tableNumber}
                    </div>
                    <div className="flex flex-col">
                       <span className="text-xs font-black text-[#F5E6D3]">
                         {order.tableNumber === 'Takeout' ? 'سفارش بیرون‌بر' : `میز شماره ${order.tableNumber}`}
                       </span>
                       <span className="text-[10px] text-[#A89B95] flex items-center gap-1 font-bold">
                         <Clock size={10} /> {new Date(order.timestamp).toLocaleTimeString('fa-IR')}
                       </span>
                    </div>
                  </div>
                  <Badge className={cn(
                    "rounded-full px-3 py-1 font-black text-[9px] border-none shadow-sm",
                    order.status === 'NEW' ? 'bg-red-500 text-white' : order.status === 'PREPARING' ? 'bg-blue-500 text-white' : 'bg-green-600 text-white'
                  )}>
                    {order.status === 'NEW' ? 'جدید' : order.status === 'PREPARING' ? 'درحال آماده‌سازی' : 'تحویل شده'}
                  </Badge>
                </CardHeader>
                <CardContent className="p-4">
                  <ul className="text-xs space-y-2 mb-6">
                    {order.items.map((item, i) => (
                      <li key={i} className="flex justify-between items-center bg-[#1C0F0A]/40 p-2.5 rounded-xl border border-[#3D2B24]">
                        <span className="font-bold text-[#F5E6D3]">{item.name}</span>
                        <span className="text-[#D4A853] font-black">{item.quantity} عدد</span>
                      </li>
                    ))}
                  </ul>
                  <div className="flex gap-3">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleUpdateStatus(order.id, 'PREPARING')} 
                      disabled={order.status !== 'NEW'} 
                      className="flex-1 rounded-xl h-12 font-black border-[#3D2B24] text-[#A89B95] hover:bg-[#3D2B24] hover:text-[#D4A853] transition-all disabled:opacity-20"
                    >
                      شروع آماده‌سازی
                    </Button>
                    <Button 
                      size="sm" 
                      onClick={() => handleUpdateStatus(order.id, 'DELIVERED')} 
                      disabled={order.status === 'DELIVERED'} 
                      className="flex-1 rounded-xl h-12 font-black bg-green-600 hover:bg-green-700 text-white transition-all shadow-lg border-none"
                    >
                      تکمیل و تحویل
                    </Button>
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
           <Button onClick={handleSummarizeFeedback} disabled={isLoadingSummary || !feedback} className="w-full bg-[#D4A853] text-[#1C0F0A] font-black h-16 rounded-2xl shadow-xl flex items-center justify-center gap-3 text-lg border-none active:scale-[0.98]">
             {isLoadingSummary ? <Loader2 className="animate-spin" /> : <Sparkles size={24} />}
             {isLoadingSummary ? 'در حال تحلیل داده‌ها...' : 'تحلیل هوشمند بازخوردها'}
           </Button>
           
           {summary && (
             <div className="p-5 bg-[#2A1810] rounded-3xl border border-[#D4A853]/30 shadow-2xl animate-fade-in space-y-4">
                <div className="flex items-center gap-2 text-[#D4A853]">
                   <Sparkles size={16} />
                   <h4 className="text-[10px] font-black uppercase tracking-widest">AI Analytics</h4>
                </div>
                <div className="space-y-3">
                  <Badge className="bg-[#D4A853] text-[#1C0F0A] text-[9px] px-2 rounded-full font-black uppercase">{summary.overallSentiment}</Badge>
                  <p className="text-xs leading-relaxed text-[#F5E6D3] italic">"{summary.summary}"</p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {summary.commonThemes?.map((theme: string, i: number) => (
                      <Badge key={i} variant="outline" className="border-[#D4A853]/20 text-[#A89B95] text-[10px]">{theme}</Badge>
                    ))}
                  </div>
                </div>
             </div>
           )}

           <div className="space-y-3">
             {feedback?.map((f, i) => (
               <div key={i} className="bg-[#2A1810] p-4 rounded-2xl border border-[#3D2B24] shadow-sm">
                 <div className="flex justify-between items-center mb-2">
                    <div className="flex gap-0.5">{[...Array(5)].map((_,s)=> <Star key={s} size={12} fill={s < f.rating ? "#D4A853" : "transparent"} color={s < f.rating ? "#D4A853" : "#3D2B24"} />)}</div>
                    <span className="text-[10px] text-[#A89B95] font-bold">{new Date(f.timestamp).toLocaleDateString('fa-IR')}</span>
                 </div>
                 <p className="text-xs text-[#F5E6D3] leading-relaxed font-medium">{f.comment}</p>
               </div>
             ))}
           </div>
        </TabsContent>

        <TabsContent value="qr" className="grid grid-cols-2 gap-4 pb-20">
           {[...Array(8)].map((_, i) => (
             <Card key={i} className="bg-white p-4 text-black text-center rounded-3xl shadow-xl border-none flex flex-col items-center">
                <p className="text-[10px] font-black mb-3 tracking-tighter bg-black text-white px-3 py-1 rounded-full">میز شماره {i+1}</p>
                <div className="bg-[#F5E6D3]/40 p-2 rounded-2xl mb-3">
                   <img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${typeof window !== 'undefined' ? window.location.origin : ''}?table=${i+1}`} alt="QR" className="w-full rounded-xl" />
                </div>
                <p className="text-[8px] opacity-40 font-black uppercase tracking-widest">Cafe Didar Digital Menu</p>
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
  const [isAiLoading, setIsAiLoading] = useState(false);
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

  const handleAiDescribe = async () => {
    if (!editForm.name) return;
    setIsAiLoading(true);
    try {
      const result = await generateMenuItemDescription({ 
        itemName: editForm.name, 
        keywords: [editForm.category || 'HOT', editForm.emoji || ''] 
      });
      setEditForm(prev => ({ ...prev, description: result.description }));
    } catch (e) {
      console.error(e);
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleSave = () => {
    if (!firestore || !editForm.name) return;
    const finalData = { 
      name: editForm.name,
      price: Number(editForm.price) || 0,
      description: editForm.description || '',
      category: editForm.category || 'HOT',
      emoji: editForm.emoji || '☕',
      image: editForm.image || '',
      updatedAt: serverTimestamp()
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
        className="w-full bg-[#D4A853] text-[#1C0F0A] font-black h-14 rounded-2xl shadow-xl border-none active:scale-[0.98]"
      >
        + افزودن آیتم جدید
      </Button>
      
      {(isAdding || editingId) && (
        <Card className="bg-[#2A1810] p-6 space-y-5 border-[#D4A853]/30 shadow-2xl animate-slide-up rounded-3xl relative">
          <button onClick={() => { setIsAdding(false); setEditingId(null); }} className="absolute top-4 left-4 text-[#A89B95] hover:text-red-500 transition-colors"><Minus /></button>
          
          <div className="grid grid-cols-4 gap-3">
            <div className="col-span-3">
              <label className="text-[9px] text-[#D4A853] ml-1 mb-1 block font-black uppercase tracking-widest">نام آیتم</label>
              <Input placeholder="نام محصول" value={editForm.name || ''} onChange={e => setEditForm({...editForm, name: e.target.value})} className="bg-[#1C0F0A] border-[#3D2B24] h-12 rounded-xl focus:border-[#D4A853] text-xs font-bold" />
            </div>
            <div className="col-span-1">
              <label className="text-[9px] text-[#D4A853] ml-1 mb-1 block font-black uppercase tracking-widest">ایموجی</label>
              <Input placeholder="☕" value={editForm.emoji || ''} onChange={e => setEditForm({...editForm, emoji: e.target.value})} className="bg-[#1C0F0A] border-[#3D2B24] h-12 text-center rounded-xl focus:border-[#D4A853] text-xl" />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[9px] text-[#D4A853] ml-1 mb-1 block font-black uppercase tracking-widest">دسته بندی</label>
              <Select value={editForm.category} onValueChange={(val: Category) => setEditForm({...editForm, category: val})}>
                <SelectTrigger className="bg-[#1C0F0A] border-[#3D2B24] h-12 rounded-xl font-bold text-xs">
                  <SelectValue placeholder="بخش" />
                </SelectTrigger>
                <SelectContent className="bg-[#2A1810] border-[#3D2B24] rounded-xl">
                  <SelectItem value="HOT" className="font-bold">☕ بار گرم</SelectItem>
                  <SelectItem value="COLD" className="font-bold">🍹 بار سرد</SelectItem>
                  <SelectItem value="DESSERT" className="font-bold">🍰 دسر</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-[9px] text-[#D4A853] ml-1 mb-1 block font-black uppercase tracking-widest">قیمت (تومان)</label>
              <Input placeholder="قیمت" type="number" value={editForm.price || ''} onChange={e => setEditForm({...editForm, price: Number(e.target.value)})} className="bg-[#1C0F0A] border-[#3D2B24] h-12 rounded-xl focus:border-[#D4A853] font-black text-xs" />
            </div>
          </div>

          <div className="relative">
            <label className="text-[9px] text-[#D4A853] ml-1 mb-1 block font-black uppercase tracking-widest">توضیحات</label>
            <Textarea placeholder="داستان این طعم را بنویسید..." value={editForm.description || ''} onChange={e => setEditForm({...editForm, description: e.target.value})} className="bg-[#1C0F0A] border-[#3D2B24] min-h-[100px] rounded-2xl p-4 focus:border-[#D4A853] text-xs leading-relaxed" />
            <button 
              onClick={handleAiDescribe}
              disabled={isAiLoading || !editForm.name}
              className="absolute bottom-3 left-3 bg-[#D4A853]/10 hover:bg-[#D4A853]/20 text-[#D4A853] p-2.5 rounded-xl transition-all disabled:opacity-20 border border-[#D4A853]/20"
            >
              {isAiLoading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
            </button>
          </div>

          <div className="space-y-3">
            <label className="text-[9px] text-[#D4A853] ml-1 block font-black uppercase tracking-widest">تصویر محصول</label>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-[#1C0F0A] rounded-2xl border border-[#3D2B24] flex items-center justify-center overflow-hidden shrink-0 shadow-inner relative">
                {editForm.image ? <img src={editForm.image} className="w-full h-full object-cover" alt="" /> : <ImageIcon size={24} className="text-[#3D2B24]" />}
              </div>
              <label className="flex-1 flex items-center justify-center gap-2 bg-[#1C0F0A]/40 hover:bg-[#1C0F0A] text-[10px] py-4 rounded-2xl cursor-pointer transition-all border-2 border-dashed border-[#3D2B24] hover:border-[#D4A853]/30">
                <Upload size={18} className="text-[#D4A853]" /> 
                <span className="font-black">انتخاب تصویر</span>
                <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
              </label>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button onClick={handleSave} className="flex-1 bg-gradient-to-r from-[#D4A853] to-[#B88A3E] text-[#1C0F0A] font-black h-14 rounded-xl shadow-lg border-none">ذخیره آیتم</Button>
            <Button onClick={() => { setIsAdding(false); setEditingId(null); }} variant="outline" className="flex-1 border-[#3D2B24] text-[#A89B95] h-14 rounded-xl hover:bg-[#1C0F0A] font-bold">انصراف</Button>
          </div>
        </Card>
      )}

      <div className="space-y-3">
        {menu.length === 0 && (
          <div className="text-center py-20 opacity-20">
             <Coffee size={48} className="mx-auto mb-4 stroke-1" />
             <p className="text-sm font-bold">لیست منو خالی است</p>
          </div>
        )}
        {menu.map(item => (
          <div key={item.id} className="bg-[#2A1810] p-3 rounded-2xl flex justify-between items-center border border-[#3D2B24] hover:border-[#D4A853]/20 transition-all shadow-sm">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-[#1C0F0A] flex items-center justify-center text-xl border border-[#D4A853]/10 overflow-hidden shadow-inner">
                {item.image ? <img src={item.image} className="w-full h-full object-cover" alt="" /> : <span>{item.emoji}</span>}
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-black text-[#F5E6D3]">{item.name}</span>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="text-[8px] py-0 px-1.5 border-[#3D2B24] text-[#A89B95]">{item.category}</Badge>
                  <span className="text-[9px] text-[#D4A853] font-black">{(item.price/1000).toLocaleString()} T</span>
                </div>
              </div>
            </div>
            <div className="flex gap-1">
              <Button size="icon" variant="ghost" onClick={() => startEdit(item)} className="h-10 w-10 rounded-xl text-[#A89B95] hover:text-[#D4A853] hover:bg-[#D4A853]/10"><Pencil size={16} /></Button>
              <Button size="icon" variant="ghost" onClick={() => handleDelete(item.id)} className="h-10 w-10 rounded-xl text-red-500/30 hover:text-red-500 hover:bg-red-500/10"><Trash2 size={16} /></Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
