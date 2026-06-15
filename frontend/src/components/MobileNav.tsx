'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Compass, Library, ShoppingBag, Wallet } from "lucide-react";
import { useAuthStore } from "@/store/authStore";

export default function MobileNav() {
  const pathname = usePathname();
  const { user } = useAuthStore();

  const navItems = [
    { href: "/", icon: <Home size={20} />, label: "Home" },
    { href: "/discover", icon: <Compass size={20} />, label: "Discover" },
    ...(user ? [
      { href: "/marketplace", icon: <ShoppingBag size={20} />, label: "Shop" },
      { href: "/library", icon: <Library size={20} />, label: "Library" },
      { href: "/wallet", icon: <Wallet size={20} />, label: "Wallet" },
    ] : []),
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-background/80 backdrop-blur-xl border-t border-white/5 flex items-center justify-around px-2 z-[100] pb-safe shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
      {navItems.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link 
            key={item.href} 
            href={item.href}
            className={`flex flex-col items-center justify-center space-y-1 transition ${isActive ? 'text-primary scale-110' : 'text-muted-foreground'}`}
          >
            {item.icon}
            <span className="text-[10px] font-bold">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
