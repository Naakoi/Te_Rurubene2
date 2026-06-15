'use client';

import { useEffect, useRef, useState } from 'react';
import api from '@/lib/axios';
import { Bell, X, CheckCheck, Wallet, ShieldAlert, Clock } from 'lucide-react';

interface Notification {
  id: number;
  type: string;
  title: string;
  message: string;
  read_at: string | null;
  created_at: string;
}

interface NotificationDropdownProps {
  onCountChange?: (count: number) => void;
}

function timeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function NotificationIcon({ type }: { type: string }) {
  if (type === 'transaction') return <Wallet size={14} className="text-[#00e5ff]" />;
  if (type === 'system') return <ShieldAlert size={14} className="text-yellow-400" />;
  return <Bell size={14} className="text-white" />;
}

export default function NotificationDropdown({ onCountChange }: NotificationDropdownProps) {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter(n => !n.read_at).length;

  const fetchNotifications = () => {
    setLoading(true);
    api.get('/api/notifications')
      .then(res => {
        setNotifications(res.data);
        onCountChange?.(res.data.filter((n: Notification) => !n.read_at).length);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchNotifications();
    // Poll every 30 seconds for new notifications
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAllRead = () => {
    api.post('/api/notifications/read-all')
      .then(() => {
        setNotifications(prev => prev.map(n => ({ ...n, read_at: n.read_at ?? new Date().toISOString() })));
        onCountChange?.(0);
      })
      .catch(() => {});
  };

  const handleMarkRead = (id: number) => {
    api.post(`/api/notifications/${id}/read`)
      .then(() => {
        setNotifications(prev =>
          prev.map(n => n.id === id ? { ...n, read_at: new Date().toISOString() } : n)
        );
        onCountChange?.(Math.max(0, unreadCount - 1));
      })
      .catch(() => {});
  };

  return (
    <div className="relative" ref={ref}>
      {/* Bell Button */}
      <button
        onClick={() => { setOpen(prev => !prev); if (!open) fetchNotifications(); }}
        className="p-3 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all duration-300 relative group"
        title="Notifications"
      >
        <Bell size={20} className="text-muted-foreground group-hover:text-white transition-colors" />
        {unreadCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-[#00e5ff] text-black text-[10px] font-black rounded-full flex items-center justify-center border-2 border-background shadow-lg animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {open && (
        <div className="absolute right-0 top-14 w-80 md:w-96 bg-gradient-to-b from-[#0a122c] to-[#060b1e] border border-[#00e5ff]/15 rounded-3xl shadow-2xl shadow-black/60 z-[200] overflow-hidden animate-in fade-in slide-in-from-top-3 duration-200">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
            <div className="flex items-center space-x-2">
              <Bell size={16} className="text-[#00e5ff]" />
              <span className="font-black text-sm text-white uppercase tracking-wide">Notifications</span>
              {unreadCount > 0 && (
                <span className="bg-[#00e5ff]/20 text-[#00e5ff] text-[10px] font-bold px-2 py-0.5 rounded-full">
                  {unreadCount} new
                </span>
              )}
            </div>
            <div className="flex items-center space-x-2">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="text-[10px] font-bold text-muted-foreground hover:text-[#00e5ff] transition-colors flex items-center space-x-1"
                  title="Mark all as read"
                >
                  <CheckCheck size={13} />
                  <span>All read</span>
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                className="p-1 hover:bg-white/5 rounded-lg transition"
              >
                <X size={14} className="text-muted-foreground" />
              </button>
            </div>
          </div>

          {/* Notification List */}
          <div className="max-h-[400px] overflow-y-auto">
            {loading ? (
              <div className="py-12 flex flex-col items-center space-y-2 text-muted-foreground">
                <Bell size={24} className="animate-pulse text-[#00e5ff]" />
                <p className="text-xs">Loading notifications...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-14 flex flex-col items-center space-y-3 text-muted-foreground">
                <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center">
                  <Bell size={22} />
                </div>
                <p className="text-xs font-semibold">You're all caught up!</p>
                <p className="text-[10px] text-center px-8 opacity-60">Transaction notifications will appear here.</p>
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {notifications.map(n => (
                  <div
                    key={n.id}
                    onClick={() => !n.read_at && handleMarkRead(n.id)}
                    className={`px-5 py-4 flex items-start space-x-3 transition cursor-pointer ${
                      n.read_at
                        ? 'hover:bg-white/3 opacity-60'
                        : 'hover:bg-white/5 bg-[#00e5ff]/3'
                    }`}
                  >
                    {/* Icon */}
                    <div className={`mt-0.5 w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${
                      n.read_at ? 'bg-white/5' : 'bg-[#00e5ff]/10 border border-[#00e5ff]/20'
                    }`}>
                      <NotificationIcon type={n.type} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between space-x-2">
                        <p className={`text-xs font-bold leading-tight ${n.read_at ? 'text-white/70' : 'text-white'}`}>
                          {n.title}
                        </p>
                        {!n.read_at && (
                          <span className="w-2 h-2 rounded-full bg-[#00e5ff] shrink-0 mt-1 shadow-[0_0_6px_rgba(0,229,255,0.8)]" />
                        )}
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed line-clamp-2">
                        {n.message}
                      </p>
                      <div className="flex items-center space-x-1 mt-1.5">
                        <Clock size={9} className="text-muted-foreground/50" />
                        <span className="text-[9px] text-muted-foreground/50">{timeAgo(n.created_at)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="px-5 py-3 border-t border-white/5 text-center">
              <p className="text-[10px] text-muted-foreground/50">
                {notifications.length} notification{notifications.length !== 1 ? 's' : ''} total
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
