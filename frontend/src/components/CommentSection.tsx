'use client';

import { useState } from 'react';
import { MessageSquare, Send } from 'lucide-react';

export default function CommentSection() {
  const [comments, setComments] = useState([
    { id: 1, user: 'KiriLover', text: 'This track is fire! 🔥', time: '2h ago' },
    { id: 2, user: 'MusicMan', text: 'Love the island vibes.', time: '5h ago' },
  ]);
  const [newComment, setNewComment] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    
    setComments([
      { id: Date.now(), user: 'You', text: newComment, time: 'Just now' },
      ...comments
    ]);
    setNewComment('');
  };

  return (
    <div className="glass-card rounded-2xl p-6 mt-8">
      <div className="flex items-center space-x-2 mb-6">
        <MessageSquare size={20} className="text-primary" />
        <h3 className="text-xl font-bold">Comments</h3>
      </div>

      <form onSubmit={handleSubmit} className="mb-8 relative">
        <input 
          type="text" 
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Add a comment..."
          className="w-full bg-background border border-white/10 rounded-xl px-4 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 text-primary hover:scale-110 transition p-2">
            <Send size={20} />
        </button>
      </form>

      <div className="space-y-6">
        {comments.map(comment => (
          <div key={comment.id} className="flex space-x-4">
            <div className="w-10 h-10 rounded-full bg-secondary shrink-0"></div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-sm">{comment.user}</span>
                <span className="text-[10px] text-muted-foreground uppercase tracking-widest">{comment.time}</span>
              </div>
              <p className="text-sm mt-1 text-foreground/80">{comment.text}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
