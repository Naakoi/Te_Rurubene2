<?php

namespace App\Http\Controllers;

use App\Models\Podcast;
use App\Models\PodcastCategory;
use App\Models\PodcastEpisode;
use Illuminate\Http\Request;

class PodcastPublicController extends Controller
{
    // Discovery Hub
    public function discover(Request $request)
    {
        $categories = PodcastCategory::withCount('podcasts')->get();
        $trending = Podcast::with('studio')->withCount('episodes')->orderByDesc('created_at')->take(10)->get();
        
        return response()->json([
            'categories' => $categories,
            'trending' => $trending,
        ]);
    }

    // Public Channel Page
    public function showChannel($id)
    {
        $podcast = Podcast::with(['studio', 'category', 'series', 'episodes' => function($q) {
            $q->where('status', 'ready')->orderByDesc('published_at');
        }])->findOrFail($id);

        return response()->json($podcast);
    }

    // Single Episode
    public function showEpisode($id)
    {
        $episode = PodcastEpisode::with(['podcast.studio', 'series'])->findOrFail($id);
        
        // Log view/analytics here asynchronously
        
        return response()->json($episode);
    }
}
