<?php

namespace App\Http\Controllers;

use App\Models\Video;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class StreamController extends Controller
{
    /**
     * Get a signed URL for a video's HLS master playlist.
     */
    public function getStreamUrl(Request $request, $id)
    {
        $video = Video::with('artist')->findOrFail($id);
        
        if ($video->status !== 'ready') {
            return response()->json(['message' => 'Video is still being processed'], 422);
        }

        // For premium videos, check if user has purchased it or has active subscription
        if ($video->is_premium) {
            $user = $request->user();
            if (!$user || (!$user->is_subscribed && !$user->hasPurchasedVideo($video->id))) {
                return response()->json(['message' => 'Premium content. Purchase or subscription required.'], 403);
            }
        }

        // For external test URLs (like the ones seeded), return directly.
        // For production R2 paths, generate a signed URL.
        if (filter_var($video->hls_path, FILTER_VALIDATE_URL)) {
            $url = $video->hls_path;
        } else {
            try {
                $url = Storage::disk('r2')->temporaryUrl(
                    $video->hls_path, 
                    now()->addHours(2)
                );
            } catch (\Exception $e) {
                return response()->json(['message' => 'Storage not configured'], 500);
            }
        }

        // Try to get thumbnail URL, fall back gracefully
        $thumbnailUrl = null;
        try {
            $thumbnailUrl = Storage::disk('r2')->url("videos/{$video->id}/thumb.jpg");
        } catch (\Exception $e) {
            $thumbnailUrl = $video->cover_url ?? null;
        }

        return response()->json([
            'stream_url'    => $url,
            'thumbnail_url' => $thumbnailUrl,
            'title'         => $video->title,
            'artist'        => $video->artist->name
        ]);
    }
}
