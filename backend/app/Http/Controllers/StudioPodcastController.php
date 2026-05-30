<?php

namespace App\Http\Controllers;

use App\Models\Podcast;
use App\Models\PodcastEpisode;
use App\Models\Studio;
use Illuminate\Http\Request;

class StudioPodcastController extends Controller
{
    // List all podcasts for the authenticated studio
    public function index(Request $request)
    {
        $studio = Studio::where('user_id', $request->user()->id)->firstOrFail();
        $podcasts = $studio->podcasts()->with('category')->get();
        return response()->json($podcasts);
    }

    public function store(Request $request)
    {
        $studio = Studio::where('user_id', $request->user()->id)->firstOrFail();

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'category_id' => 'nullable|exists:podcast_categories,id',
            'is_premium' => 'boolean',
            'price' => 'numeric|min:0',
        ]);

        $podcast = $studio->podcasts()->create($validated);

        return response()->json($podcast, 201);
    }

    public function show(Request $request, $id)
    {
        $studio = Studio::where('user_id', $request->user()->id)->firstOrFail();
        $podcast = $studio->podcasts()->with(['series', 'episodes'])->findOrFail($id);
        return response()->json($podcast);
    }

    // Episode endpoints
    public function storeEpisode(Request $request, $podcastId)
    {
        $studio = Studio::where('user_id', $request->user()->id)->firstOrFail();
        $podcast = $studio->podcasts()->findOrFail($podcastId);

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'podcast_series_id' => 'nullable|exists:podcast_series,id',
            'season_number' => 'nullable|integer',
            'episode_number' => 'nullable|integer',
            'is_premium' => 'boolean',
            'price' => 'numeric|min:0',
            'guest_speakers' => 'nullable|array',
            // Note: The audio_file_path and media handling is done via MultipartUploadController
            // So we might only update the metadata here or create an empty shell.
        ]);

        // Actually, the episode is typically created after the multipart upload completes.
        // We will expose this for metadata updates.
        return response()->json(['message' => 'Use the multipart upload flow to create episodes.'], 400);
    }

    public function updateEpisode(Request $request, $podcastId, $episodeId)
    {
        $studio = Studio::where('user_id', $request->user()->id)->firstOrFail();
        $podcast = $studio->podcasts()->findOrFail($podcastId);
        $episode = $podcast->episodes()->findOrFail($episodeId);

        $validated = $request->validate([
            'title' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'season_number' => 'nullable|integer',
            'episode_number' => 'nullable|integer',
            'is_premium' => 'boolean',
            'price' => 'numeric|min:0',
        ]);

        $episode->update($validated);

        return response()->json($episode);
    }
}
