<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Track;

class RecommendationController extends Controller
{
    /**
     * Get personalized track recommendations.
     */
    public function getRecommendations(Request $request)
    {
        $user = auth('sanctum')->user();
        $recommendations = Track::with('artist.studio')
            ->inRandomOrder()
            ->limit(10)
            ->get();

        if ($user) {
            $purchasedIds = \App\Models\PurchasedTrack::where('user_id', $user->id)->pluck('track_id')->toArray();
            $unifiedPurchasedIds = \App\Models\PurchasedContent::where('user_id', $user->id)
                ->whereIn('content_type', ['song', 'track'])
                ->pluck('content_id')
                ->toArray();

            $recommendations->map(function ($track) use ($user, $purchasedIds, $unifiedPurchasedIds) {
                $isCreator = ($user->artist && $user->artist->id === $track->artist_id);
                $track->is_purchased = $isCreator || 
                                       in_array($track->id, $purchasedIds) || 
                                       in_array($track->id, $unifiedPurchasedIds);
                return $track;
            });
        }

        return response()->json($recommendations);
    }

    /**
     * Generate a smart playlist based on mood/genre.
     */
    public function generateSmartPlaylist(Request $request)
    {
        $request->validate([
            'mood' => 'required|string|in:Chill,Energetic,Traditional'
        ]);

        // Mock AI generation
        $tracks = Track::with('artist.studio')
            ->inRandomOrder()
            ->limit(15)
            ->get();

        return response()->json([
            'name' => 'Smart ' . ucfirst($request->mood) . ' Mix',
            'description' => 'AI-generated playlist for your ' . $request->mood . ' mood.',
            'tracks' => $tracks
        ]);
    }

    /**
     * Semantic Search (AI-driven simulation).
     */
    public function semanticSearch(Request $request)
    {
        $query = $request->query('q', '');
        $user = auth('sanctum')->user();
        
        // Simulating semantic search by matching keywords against title, artist name, and description
        $results = Track::with('artist.studio')
            ->where('title', 'like', "%{$query}%")
            ->orWhereHas('artist', function($q) use ($query) {
                $q->where('name', 'like', "%{$query}%");
            })
            ->limit(8)
            ->get();

        if ($user) {
            $purchasedIds = \App\Models\PurchasedTrack::where('user_id', $user->id)->pluck('track_id')->toArray();
            $unifiedPurchasedIds = \App\Models\PurchasedContent::where('user_id', $user->id)
                ->whereIn('content_type', ['song', 'track'])
                ->pluck('content_id')
                ->toArray();

            $results->map(function ($track) use ($user, $purchasedIds, $unifiedPurchasedIds) {
                $isCreator = ($user->artist && $user->artist->id === $track->artist_id);
                $track->is_purchased = $isCreator || 
                                       in_array($track->id, $purchasedIds) || 
                                       in_array($track->id, $unifiedPurchasedIds);
                return $track;
            });
        }
        
        return response()->json([
            'query' => $query,
            'results' => $results
        ]);
    }
}
