<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Track;
use App\Models\Video;
use Illuminate\Support\Facades\DB;

class AutoPlayController extends Controller
{
    /**
     * Record a played item to the user's history.
     */
    public function addToHistory(Request $request)
    {
        $request->validate([
            'media_type' => 'required|in:audio,video',
            'media_id' => 'required|integer',
        ]);

        $user = $request->user();

        // In a real scenario we'd track session ID here, but we'll leave it null for now
        DB::table('user_queue_history')->insert([
            'user_id' => $user->id,
            'playback_session_id' => null,
            'media_type' => $request->media_type,
            'media_id' => $request->media_id,
            'played_at' => now(),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return response()->json(['message' => 'History updated.']);
    }

    /**
     * Get the next auto-play recommendation.
     */
    public function getNext(Request $request)
    {
        $request->validate([
            'current_media_type' => 'nullable|in:audio,video',
            'current_media_id' => 'nullable|integer',
        ]);

        $user = $request->user();

        // Get recent history to avoid immediate replays (last 50 items)
        $recentHistory = DB::table('user_queue_history')
            ->where('user_id', $user->id)
            ->where('media_type', 'audio') // Currently auto-play only supports audio transition nicely
            ->orderBy('played_at', 'desc')
            ->limit(50)
            ->pluck('media_id')
            ->toArray();

        $nextTrack = null;

        if ($request->current_media_type === 'audio' && $request->current_media_id) {
            $currentTrack = Track::find($request->current_media_id);
            if ($currentTrack) {
                // 1. Try to find a track by the same artist that hasn't been played recently
                $nextTrack = Track::with('artist')
                    ->where('artist_id', $currentTrack->artist_id)
                    ->where('id', '!=', $currentTrack->id)
                    ->whereNotIn('id', $recentHistory)
                    ->inRandomOrder()
                    ->first();
            }
        }

        // 2. Fallback: Find any random track that hasn't been played recently
        if (!$nextTrack) {
            $nextTrack = Track::with('artist')
                ->whereNotIn('id', $recentHistory)
                ->inRandomOrder()
                ->first();
        }
        
        // 3. Absolute Fallback (if they've played EVERYTHING, just pick random)
        if (!$nextTrack) {
            $nextTrack = Track::with('artist')
                ->inRandomOrder()
                ->first();
        }

        // Format for the frontend MediaItem
        if ($nextTrack) {
            $nextTrack->load('artist.studio');
            return response()->json([
                'id' => $nextTrack->id,
                'title' => $nextTrack->title,
                'artist' => [
                    'name' => $nextTrack->artist ? $nextTrack->artist->name : 'Unknown Artist'
                ],
                'studio' => $nextTrack->artist && $nextTrack->artist->studio ? [
                    'name' => $nextTrack->artist->studio->name
                ] : null,
                'type' => 'audio',
                'stream_url' => $nextTrack->hls_path ?: ($nextTrack->audio_file_path ? asset('storage/' . $nextTrack->audio_file_path) : ''),
                'cover_url' => null, // Placeholder
                'is_premium' => (bool) $nextTrack->is_premium,
            ]);
        }

        return response()->json(['message' => 'No tracks available.'], 404);
    }
}
