<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Comment;
use App\Models\Reaction;
use App\Models\Track;

class SocialController extends Controller
{
    /**
     * Add a comment to a track.
     */
    public function addComment(Request $request)
    {
        $request->validate([
            'track_id' => 'required|exists:tracks,id',
            'content' => 'required|string|max:500'
        ]);

        $comment = Comment::create([
            'user_id' => $request->user()->id,
            'track_id' => $request->track_id,
            'content' => $request->content
        ]);

        return response()->json($comment->load('user'), 201);
    }

    /**
     * Toggle a reaction (like) on a track.
     */
    public function toggleReaction(Request $request)
    {
        $request->validate([
            'track_id' => 'required|exists:tracks,id',
            'type' => 'required|string|in:like,fire,heart'
        ]);

        $reaction = Reaction::where('user_id', $request->user()->id)
            ->where('track_id', $request->track_id)
            ->first();

        if ($reaction) {
            $reaction->delete();
            return response()->json(['message' => 'Reaction removed', 'status' => 'removed']);
        }

        $reaction = Reaction::create([
            'user_id' => $request->user()->id,
            'track_id' => $request->track_id,
            'type' => $request->type
        ]);

        return response()->json(['message' => 'Reaction added', 'status' => 'added', 'reaction' => $reaction], 201);
    }

    /**
     * Get active stories (placeholder logic).
     */
    public function activeStories()
    {
        // Mocking stories for now
        return response()->json([
            [
                'id' => 1,
                'artist' => 'DJ Kiribati',
                'preview_url' => 'stories/story1.jpg',
                'is_live' => true
            ],
            [
                'id' => 2,
                'artist' => 'Pacific Queen',
                'preview_url' => 'stories/story2.jpg',
                'is_live' => false
            ]
        ]);
    }
}
