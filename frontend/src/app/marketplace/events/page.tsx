'use client';

import { useState, useEffect } from 'react';
import {
  Calendar, MapPin, Ticket, Search, X, CheckCircle,
  Loader2, AlertCircle, QrCode, Users, Clock,
} from 'lucide-react';
import api from '@/lib/axios';

interface Event {
  id: number;
  title: string;
  description: string | null;
  location: string | null;
  event_date: string;
  ticket_price: number;
  capacity: number | null;
  artist?: {
    name: string;
    user?: { name: string };
  };
}

interface Ticket {
  id: number;
  qr_code: string;
  status: string;
  event_id: number;
}

// ── QR Ticket Modal ───────────────────────────────────────────────────────────
function TicketModal({
  event,
  onClose,
}: {
  event: Event;
  onClose: () => void;
}) {
  const [stage, setStage] = useState<'confirm' | 'buying' | 'success' | 'error'>('confirm');
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [newBalance, setNewBalance] = useState<number | null>(null);

  const handleBuy = async () => {
    setStage('buying');
    try {
      const res = await api.post(`/api/events/${event.id}/tickets`);
      setTicket(res.data.ticket);
      setNewBalance(res.data.balance);
      setStage('success');
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.message || 'Could not purchase ticket. Check your wallet balance.');
      setStage('error');
    }
  };

  const dateObj = new Date(event.event_date);
  const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'long' });
  const dateStr = dateObj.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  const timeStr = dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
      <div className="w-full max-w-md glass-card rounded-3xl overflow-hidden shadow-2xl border border-white/10 animate-in fade-in zoom-in-95 duration-300">

        {/* Header */}
        <div className="bg-gradient-to-r from-orange-500 to-red-600 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
                <Ticket size={18} className="text-white" />
              </div>
              <div>
                <p className="text-white font-black">Ticket Purchase</p>
                <p className="text-orange-200 text-xs">Rurubene Events</p>
              </div>
            </div>
            {stage !== 'buying' && (
              <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition">
                <X size={16} className="text-white" />
              </button>
            )}
          </div>

          <div className="bg-white/10 rounded-2xl p-4">
            <h2 className="text-white text-xl font-black mb-2">{event.title}</h2>
            <div className="space-y-1.5">
              <div className="flex items-center space-x-2 text-orange-100 text-sm">
                <Calendar size={14} />
                <span>{dayName}, {dateStr} · {timeStr}</span>
              </div>
              {event.location && (
                <div className="flex items-center space-x-2 text-orange-100 text-sm">
                  <MapPin size={14} />
                  <span>{event.location}</span>
                </div>
              )}
              {event.artist && (
                <div className="flex items-center space-x-2 text-orange-100 text-sm">
                  <Users size={14} />
                  <span>{event.artist.name}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-6">
          {stage === 'confirm' && (
            <div className="space-y-5">
              {event.description && (
                <p className="text-sm text-muted-foreground leading-relaxed">{event.description}</p>
              )}
              <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl">
                <span className="text-sm text-muted-foreground font-medium">Ticket Price</span>
                <span className="text-2xl font-black">${Number(event.ticket_price).toFixed(2)} <span className="text-sm font-medium text-muted-foreground">AUD</span></span>
              </div>
              <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl">
                <span className="text-sm text-muted-foreground font-medium">Will be debited from</span>
                <span className="text-sm font-bold text-primary">Rurubene Wallet</span>
              </div>
              <button
                onClick={handleBuy}
                className="w-full py-4 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-400 hover:to-red-500 text-white font-black rounded-2xl transition shadow-lg shadow-orange-500/20 text-lg"
              >
                Confirm & Buy Ticket
              </button>
            </div>
          )}

          {stage === 'buying' && (
            <div className="flex flex-col items-center justify-center py-10 space-y-4">
              <div className="w-16 h-16 rounded-full border-4 border-orange-500/20 border-t-orange-500 animate-spin" />
              <p className="text-lg font-bold">Purchasing ticket…</p>
              <p className="text-sm text-muted-foreground">Debiting your wallet</p>
            </div>
          )}

          {stage === 'success' && ticket && (
            <div className="flex flex-col items-center py-4 space-y-5">
              <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
                <CheckCircle size={24} className="text-green-500" />
              </div>
              <div className="text-center">
                <p className="text-xl font-black text-green-400">You're In!</p>
                <p className="text-sm text-muted-foreground mt-1">Present this QR code at the door</p>
              </div>

              {/* QR Code Display */}
              <div className="w-full bg-white rounded-2xl p-6 flex flex-col items-center space-y-3">
                {/* Visual QR grid (stylized representation) */}
                <div className="w-40 h-40 relative">
                  <div className="w-full h-full grid grid-cols-8 gap-0.5 opacity-90">
                    {Array.from({ length: 64 }).map((_, i) => {
                      const code = ticket.qr_code;
                      const charSum = code.split('').reduce((s, c) => s + c.charCodeAt(0), 0);
                      const fill = ((charSum * (i + 7) * 13 + i * 31) % 3) !== 0;
                      return (
                        <div
                          key={i}
                          className={`rounded-sm ${fill ? 'bg-gray-900' : 'bg-white'}`}
                        />
                      );
                    })}
                  </div>
                  {/* Corner markers */}
                  {['top-0 left-0', 'top-0 right-0', 'bottom-0 left-0'].map(pos => (
                    <div key={pos} className={`absolute ${pos} w-8 h-8 border-4 border-gray-900 ${pos.includes('right') ? 'border-l-0' : ''} ${pos.includes('bottom') ? 'border-t-0' : ''}`} />
                  ))}
                </div>

                <div className="text-center">
                  <p className="font-mono text-xs font-bold text-gray-800 tracking-widest">{ticket.qr_code}</p>
                  <p className="text-[10px] text-gray-400 mt-1">Ticket #{ticket.id} · Valid</p>
                </div>
              </div>

              {newBalance !== null && (
                <div className="w-full flex items-center justify-between p-3 bg-white/5 rounded-xl text-sm">
                  <span className="text-muted-foreground">New wallet balance</span>
                  <span className="font-bold text-primary">${Number(newBalance).toFixed(2)} AUD</span>
                </div>
              )}

              <button onClick={onClose} className="w-full py-3 bg-white/10 hover:bg-white/20 rounded-2xl font-bold transition">
                Done
              </button>
            </div>
          )}

          {stage === 'error' && (
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
              <div className="w-14 h-14 rounded-full bg-red-500/20 flex items-center justify-center">
                <AlertCircle size={28} className="text-red-500" />
              </div>
              <p className="text-lg font-bold text-red-400">Purchase Failed</p>
              <p className="text-sm text-muted-foreground text-center">{errorMsg}</p>
              <button onClick={() => setStage('confirm')} className="px-6 py-2 bg-white/10 rounded-xl font-bold text-sm hover:bg-white/20 transition">
                Try Again
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main Events Page ──────────────────────────────────────────────────────────
export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [filtered, setFiltered] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<Event | null>(null);

  useEffect(() => {
    api.get('/api/events')
      .then(res => {
        setEvents(res.data);
        setFiltered(res.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const q = query.toLowerCase();
    setFiltered(events.filter(e =>
      e.title.toLowerCase().includes(q) ||
      (e.location ?? '').toLowerCase().includes(q) ||
      (e.artist?.name ?? '').toLowerCase().includes(q)
    ));
  }, [query, events]);

  return (
    <>
      {selected && <TicketModal event={selected} onClose={() => setSelected(null)} />}

      <div className="p-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-orange-500/20 text-orange-500 rounded-2xl">
              <Ticket size={24} />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Live Events & Tickets</h1>
              <p className="text-muted-foreground text-sm mt-0.5">{filtered.length} upcoming event{filtered.length !== 1 ? 's' : ''}</p>
            </div>
          </div>
          <div className="w-full md:w-80 relative">
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search events or locations..."
              className="w-full bg-secondary border border-white/10 rounded-xl px-10 py-3 focus:outline-none focus:ring-2 focus:ring-primary text-sm"
            />
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          </div>
        </div>

        {loading && (
          <div className="flex flex-col items-center justify-center py-24 space-y-4">
            <Loader2 size={32} className="text-primary animate-spin" />
            <p className="text-muted-foreground">Loading events…</p>
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 space-y-3">
            <Ticket size={48} className="text-muted-foreground/30" />
            <p className="text-muted-foreground text-lg font-semibold">No events found.</p>
            <p className="text-muted-foreground/60 text-sm">More events are coming soon — stay tuned!</p>
          </div>
        )}

        <div className="space-y-6">
          {filtered.map(event => {
            const dateObj = new Date(event.event_date);
            const month = dateObj.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
            const day = dateObj.getDate();
            const fullDate = dateObj.toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric' });
            const time = dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

            return (
              <div
                key={event.id}
                className="glass-card rounded-3xl p-8 flex flex-col lg:flex-row items-center gap-8 group hover:bg-white/5 transition duration-500"
              >
                {/* Date Badge */}
                <div className="w-full lg:w-48 h-32 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl flex flex-col items-center justify-center text-white shadow-lg shadow-orange-500/20 shrink-0">
                  <p className="text-sm font-bold uppercase tracking-widest">{month}</p>
                  <p className="text-5xl font-black leading-none">{day}</p>
                  <p className="text-orange-200 text-xs mt-1">{time}</p>
                </div>

                {/* Event Info */}
                <div className="flex-1 text-center lg:text-left">
                  <h2 className="text-2xl font-bold mb-2 group-hover:text-primary transition">{event.title}</h2>
                  {event.description && (
                    <p className="text-muted-foreground text-sm mb-3 line-clamp-2 leading-relaxed">{event.description}</p>
                  )}
                  <div className="flex flex-wrap justify-center lg:justify-start gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center space-x-1.5">
                      <Calendar size={15} className="text-orange-500" />
                      <span>{fullDate}</span>
                    </div>
                    {event.location && (
                      <div className="flex items-center space-x-1.5">
                        <MapPin size={15} className="text-orange-500" />
                        <span>{event.location}</span>
                      </div>
                    )}
                    {event.artist && (
                      <div className="flex items-center space-x-1.5">
                        <Users size={15} className="text-orange-500" />
                        <span>{event.artist.name}</span>
                      </div>
                    )}
                    {event.capacity && (
                      <div className="flex items-center space-x-1.5">
                        <Clock size={15} className="text-orange-500" />
                        <span>Capacity: {event.capacity}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Price & CTA */}
                <div className="w-full lg:w-auto flex flex-col items-center lg:items-end gap-3">
                  <div className="text-center lg:text-right">
                    <p className="text-3xl font-black">${Number(event.ticket_price).toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground">AUD per ticket</p>
                  </div>
                  <button
                    onClick={() => setSelected(event)}
                    className="px-8 py-3 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-400 hover:to-red-500 text-white rounded-full font-bold hover:scale-105 transition shadow-lg shadow-orange-500/20"
                  >
                    Get Tickets
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
