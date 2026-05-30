import { create } from 'zustand';
import api from '@/lib/axios';

export interface MediaItem {
  id: number;
  title: string;
  artist?: { id?: number; name?: string; user?: { name?: string } };
  studio?: { name?: string };
  type: 'audio' | 'video';
  stream_url: string;
  cover_url?: string;
  is_premium?: boolean;
  price?: number | string;
  is_purchased?: boolean;
}

interface PlayerState {
  currentMedia: MediaItem | null;
  isPlaying: boolean;
  queue: MediaItem[];
  showExpanded: boolean;
  
  setCurrentMedia: (item: MediaItem | null) => void;
  setIsPlaying: (isPlaying: boolean) => void;
  setShowExpanded: (show: boolean) => void;
  addToQueue: (item: MediaItem) => void;
  playNext: (item: MediaItem) => void;
  nextMedia: () => void;
  prevMedia: () => void;
  removeFromQueue: (id: number) => void;
  clearQueue: () => void;
  fetchAutoPlayNext: () => Promise<MediaItem | null>;
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
  currentMedia: null,
  isPlaying: false,
  queue: [],
  showExpanded: false,

  setCurrentMedia: (item) => set({ 
    currentMedia: item, 
    isPlaying: !!item,
    showExpanded: item?.type === 'video'
  }),

  setIsPlaying: (isPlaying) => set({ isPlaying }),
  setShowExpanded: (show) => set({ showExpanded: show }),

  addToQueue: (item) => {
    const { queue } = get();
    if (queue.some(i => i.id === item.id && i.type === item.type)) return;
    set({ queue: [...queue, item] });
  },

  playNext: (item) => {
    const { queue, currentMedia } = get();
    // Remove if already in queue
    const filteredQueue = queue.filter(i => !(i.id === item.id && i.type === item.type));
    
    if (!currentMedia) {
      set({ currentMedia: item, isPlaying: true, queue: [item] });
      return;
    }

    const currentIndex = queue.findIndex(i => i.id === currentMedia.id && i.type === currentMedia.type);
    const newQueue = [...queue];
    newQueue.splice(currentIndex + 1, 0, item);
    set({ queue: newQueue });
  },

  nextMedia: async () => {
    const { queue, currentMedia, fetchAutoPlayNext } = get();
    if (queue.length === 0) {
      await fetchAutoPlayNext();
      const updatedQueue = get().queue;
      if (updatedQueue.length > 0) {
        set({ currentMedia: updatedQueue[0], isPlaying: true });
      }
      return;
    }
    const currentIndex = currentMedia ? queue.findIndex(i => i.id === currentMedia.id && i.type === currentMedia.type) : -1;
    
    // If at the end of the queue, fetch more
    if (currentIndex === queue.length - 1) {
      const newItem = await fetchAutoPlayNext();
      if (newItem != null) {
        set({ currentMedia: newItem, isPlaying: true });
      }
      return;
    }

    const nextIndex = (currentIndex + 1) % queue.length;
    set({ currentMedia: queue[nextIndex], isPlaying: true });
  },

  prevMedia: () => {
    const { queue, currentMedia } = get();
    if (queue.length === 0) return;
    const currentIndex = currentMedia ? queue.findIndex(i => i.id === currentMedia.id && i.type === currentMedia.type) : -1;
    const prevIndex = (currentIndex - 1 + queue.length) % queue.length;
    set({ currentMedia: queue[prevIndex], isPlaying: true });
  },

  removeFromQueue: (id) => set((state) => ({ 
    queue: state.queue.filter(i => i.id !== id) 
  })),

  clearQueue: () => set({ queue: [], currentMedia: null, isPlaying: false }),

  fetchAutoPlayNext: async () => {
    const { currentMedia, addToQueue } = get();
    try {
      const response = await api.get('/api/player/queue/auto-play', {
        params: {
          current_media_type: currentMedia?.type,
          current_media_id: currentMedia?.id
        }
      });
      if (response.data && response.data.id) {
        addToQueue(response.data);
        return response.data;
      }
    } catch (err) {
      console.error('Auto-play fetch failed', err);
    }
    return null;
  },
}));
