import Link from 'next/link';
import { Tag, Ticket, Mic, Radio, ShoppingCart, Store, Music } from 'lucide-react';

export default function MarketplacePage() {
  const categories = [
    { id: 'merch', name: 'Merchandise', description: 'Exclusive artist apparel and gear.', icon: <Tag size={32} />, color: 'from-purple-500 to-indigo-600', href: '/marketplace/merch' },
    { id: 'tickets', name: 'Event Tickets', description: 'Book your spot at the next live show.', icon: <Ticket size={32} />, color: 'from-orange-500 to-red-600', href: '/marketplace/events' },
    { id: 'podcasts', name: 'Podcasts', description: 'Pacific stories and industry talks.', icon: <Mic size={32} />, color: 'from-green-500 to-emerald-600', href: '/marketplace/podcasts' },
    { id: 'radio', name: 'Radio Stations', description: 'Live broadcast from across the islands.', icon: <Radio size={32} />, color: 'from-blue-500 to-cyan-600', href: '/marketplace/radio' },
    { id: 'stores', name: 'Public Stores', description: 'Explore creator shops and merchandise.', icon: <Store size={32} />, color: 'from-pink-500 to-rose-600', href: '/marketplace/stores' },
    { id: 'productions', name: 'Productions', description: 'Hire experts for mixing, mastering, and beats.', icon: <Music size={32} />, color: 'from-amber-500 to-yellow-600', href: '/marketplace/productions' },
  ];

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-10">
        <h1 className="text-3xl font-bold tracking-tight">Marketplace</h1>
        <button className="p-3 glass rounded-full hover:text-primary transition relative">
            <ShoppingCart size={24} />
            <span className="absolute top-0 right-0 w-5 h-5 bg-primary text-primary-foreground text-[10px] font-bold rounded-full flex items-center justify-center">0</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {categories.map((cat) => (
          <Link key={cat.id} href={cat.href} className="group">
            <div className={`h-64 rounded-3xl bg-gradient-to-br ${cat.color} p-8 flex flex-col justify-between shadow-xl transition-all duration-500 group-hover:scale-[1.02] group-hover:shadow-2xl relative overflow-hidden`}>
               {/* Background Icon Decoration */}
               <div className="absolute -bottom-10 -right-10 opacity-10 group-hover:scale-125 transition-transform duration-700">
                  {cat.icon}
               </div>
               
               <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md">
                  {cat.icon}
               </div>
               
               <div>
                  <h2 className="text-3xl font-bold text-white mb-2">{cat.name}</h2>
                  <p className="text-white/80 max-w-xs">{cat.description}</p>
               </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
