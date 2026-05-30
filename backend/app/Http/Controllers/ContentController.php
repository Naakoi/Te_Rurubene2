<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Podcast;
use App\Models\RadioStation;

class ContentController extends Controller
{
    /**
     * List podcasts
     */
    public function listPodcasts()
    {
        return response()->json(Podcast::with('episodes')->get());
    }

    /**
     * List active radio stations
     */
    public function listRadioStations(Request $request)
    {
        $query = RadioStation::query();
        
        if ($request->has('country_id')) {
            $query->where('country_id', $request->country_id);
        }

        return response()->json($query->get());
    }
    /**
     * List videos (filtered by ready status)
     */
    public function listVideos()
    {
        return response()->json(\App\Models\Video::with('artist')->where('status', 'ready')->latest()->get());
    }

    /**
     * Upload a video and start processing
     */
    public function uploadVideo(Request $request)
    {
        $request->validate([
            'title' => 'required|string',
            'video' => 'required|file|mimes:mp4,mov,avi,wmv|max:102400', // 100MB limit
            'is_short' => 'boolean'
        ]);

        $user = $request->user();
        $artist = $user->artist; // Assuming user has one artist profile

        if (!$artist) {
            return response()->json(['message' => 'Artist profile required to upload videos'], 403);
        }

        $videoFile = $request->file('video');
        $tempPath = $videoFile->store('temp_videos', 'local');

        $video = \App\Models\Video::create([
            'artist_id' => $artist->id,
            'title' => $request->title,
            'is_short' => $request->is_short ?? false,
            'status' => 'processing'
        ]);

        // Dispatch background job for HLS transcoding
        \App\Jobs\ProcessVideoUpload::dispatch($video, $tempPath);

        return response()->json([
            'message' => 'Video uploaded and is now being processed.',
            'video' => $video
        ], 202);
    }
}
