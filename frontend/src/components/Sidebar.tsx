'use client';

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { Home, Compass, Library, Settings, Shield, Wallet, ShoppingBag, LogOut, Upload, Mic, Store, BookOpen, Award, X } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { useUIStore } from "@/store/uiStore";
import api from "@/lib/axios";

export default function Sidebar() {
  const { user, setUser } = useAuthStore();
  const { isSidebarOpen, closeSidebar } = useUIStore();
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = () => {
    api.post('/api/logout').finally(() => {
        localStorage.removeItem('token');
        setUser(null);
        router.push('/login');
    });
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isSidebarOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]" 
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`
          w-64 h-full glass border-r border-white/5 flex flex-col shrink-0
          fixed md:relative top-0 left-0 z-[101] md:z-40 transition-transform duration-300 ease-in-out
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
      >
        {/* Top scrollable nav section */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-8 relative">
          <button 
            onClick={closeSidebar}
            className="md:hidden absolute top-6 right-6 p-2 bg-white/10 rounded-full hover:bg-white/20 transition"
          >
            <X size={16} className="text-white" />
          </button>
          
          <Link href="/" className="flex flex-col mb-12 group cursor-pointer" onClick={closeSidebar}>
           <div className="flex items-center space-x-3">
              <div className="p-2 bg-primary/10 rounded-xl group-hover:bg-primary/20 transition-all duration-500 shadow-[0_0_15px_rgba(0,255,255,0.1)]">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-primary group-hover:rotate-[15deg] transition-transform duration-500">
                     <path d="M12 22C12 22 12 12 20 4C13 4 11 9 11 9C11 9 10 4 3 4C11 12 11 22 11 22H12Z" fill="currentColor" fillOpacity="0.9"/>
                  </svg>
              </div>
              <div className="flex flex-col">
                  <span className="text-white italic font-black tracking-tighter text-2xl leading-none">TE</span>
                  <span className="text-primary font-black tracking-[0.2em] text-sm mt-0.5">RURUBENE</span>
              </div>
           </div>
        </Link>
        <nav className="space-y-1">
          <NavLink href="/" icon={<Home size={20} />} label="Home" />
          <NavLink href="/discover" icon={<Compass size={20} />} label="Discover" />
          <NavLink href="/discover/podcasts" icon={<Mic size={18} />} label="Podcasts" isSub />
          <NavLink href="/marketplace" icon={<ShoppingBag size={20} />} label="Marketplace" />
          <NavLink href="/marketplace/stores" icon={<Store size={18} />} label="Public Stores" isSub />
          <NavLink href="/library" icon={<Library size={20} />} label="Library" />
          <NavLink href="/wallet" icon={<Wallet size={20} />} label="Wallet" />
          
          {(user?.role === 'admin' || user?.role === 'artist' || user?.role === 'studio') && (
            <div className="pt-6 pb-2 px-4">
               <span className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/50">Management</span>
            </div>
          )}

          {user?.role === 'admin' && (
            <NavLink href="/admin" icon={<Shield size={20} />} label="Admin Panel" highlight />
          )}

          {user?.role === 'artist' && (
            <>
              <NavLink href="/studio/upload" icon={<Upload size={20} />} label="Upload Studio" highlight />
              <NavLink href="/studio/store" icon={<Store size={20} />} label="My Store" highlight />
            </>
          )}

          {user?.role === 'studio' && (
            <>
              <NavLink href="/studio/podcasts" icon={<Mic size={20} />} label="Podcasts" highlight />
              <NavLink href="/studio/store" icon={<ShoppingBag size={20} />} label="Manage Store" highlight />
            </>
          )}
        </nav>
      </div>
      <div className="p-8 border-t border-white/5 space-y-4">
        {user ? (
          <>
            <Link href="/creator/guide" className="flex items-center space-x-3 text-foreground/60 hover:text-white transition-all duration-300 group px-4 py-2">
              <BookOpen size={20} className="group-hover:scale-110 transition-transform duration-300" />
              <span className="font-medium">Creator Guide</span>
            </Link>
            <Link href="/creator/terms" className="flex items-center space-x-3 text-foreground/60 hover:text-white transition-all duration-300 group px-4 py-2">
              <Shield size={20} className="group-hover:scale-110 transition-transform duration-300" />
              <span className="font-medium">Creator Terms</span>
            </Link>
            <Link href="/credits" className="flex items-center space-x-3 text-foreground/60 hover:text-white transition-all duration-300 group px-4 py-2">
              <Award size={20} className="group-hover:scale-110 transition-transform duration-300" />
              <span className="font-medium">Credits</span>
            </Link>
            <Link href="/settings" className="flex items-center space-x-3 text-foreground/60 hover:text-white transition-all duration-300 group px-4 py-2">
              <Settings size={20} className="group-hover:rotate-45 transition-transform duration-500" />
              <span className="font-medium">Settings</span>
            </Link>
            <button 
              onClick={handleLogout}
              className="w-full flex items-center space-x-3 text-red-500/60 hover:text-red-500 transition-all duration-300 px-4 py-2 group"
            >
              <LogOut size={20} className="group-hover:-translate-x-1 transition-transform duration-300" />
              <span className="font-medium">Logout</span>
            </button>
          </>
        ) : (
          <Link href="/login" className="flex items-center space-x-3 text-primary font-bold hover:brightness-125 transition-all px-4">
            <LogOut size={20} className="rotate-180" />
            <span>Login</span>
          </Link>
        )}
      </div>
    </aside>
    </>
  );
}

function NavLink({ href, icon, label, isSub = false, highlight = false }: { href: string, icon: React.ReactNode, label: string, isSub?: boolean, highlight?: boolean }) {
    return (
        <Link 
            href={href} 
            className={`
                flex items-center space-x-4 px-4 py-3 rounded-2xl transition-all duration-300 group
                ${isSub ? 'ml-6 py-2 text-sm' : ''}
                ${highlight ? 'text-primary font-bold' : 'text-foreground/70 hover:text-white hover:bg-white/5'}
            `}
        >
            <div className={`transition-transform duration-500 group-hover:scale-110 ${highlight ? 'text-primary' : 'group-hover:text-primary'}`}>
                {icon}
            </div>
            <span className="tracking-tight">{label}</span>
        </Link>
    );
}
