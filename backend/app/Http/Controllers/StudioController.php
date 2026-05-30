<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Track;
use App\Models\Video;
use Illuminate\Support\Facades\Storage;

class StudioController extends Controller
{
    /**
     * Handle media uploads from the Artist Studio.
     */
    public function upload(Request $request)
    {
        \Log::info('Upload Request Started', [
            'content_type' => $request->header('Content-Type'),
            'content_length' => $request->header('Content-Length'),
            'user_id' => $request->user()?->id,
            'is_artist' => $request->user()?->artist ? 'yes' : 'no'
        ]);

        $user = $request->user();
        if (!$user || !$user->artist) {
            return response()->json(['message' => 'Unauthorized. Only verified artists can upload content.'], 403);
        }

        $request->validate([
            'title' => 'required|string|max:255',
            'media_type' => 'required|in:audio,video',
            'file' => 'required|file|mimes:mp3,mp4,wav,mov|max:512000', // 500MB max
            'cover_image' => 'nullable|image|mimes:jpeg,png,jpg,webp|max:5120', // 5MB max
            'is_premium' => 'required|boolean',
            'price' => 'nullable|numeric|min:0',
        ]);

        $artist = $user->artist;
        $price = $request->input('price', 0.00);
        $isPremium = filter_var($request->input('is_premium'), FILTER_VALIDATE_BOOLEAN);

        // Upload Cover Image
        $coverUrl = null;
        if ($request->hasFile('cover_image')) {
            $coverPath = $request->file('cover_image')->store('covers', 'public');
            $coverUrl = url(Storage::url($coverPath));
        }

        // Upload Media File
        $file = $request->file('file');
        $extension = $file->getClientOriginalExtension();
        $mediaType = $request->input('media_type');
        
        $folder = $mediaType === 'audio' ? 'audio' : 'videos';
        $filePath = $file->store($folder, 'public');
        $fileUrl = url(Storage::url($filePath));

        if ($mediaType === 'audio') {
            $track = Track::create([
                'artist_id' => $artist->id,
                'title' => $request->input('title'),
                'audio_file_path' => $fileUrl, // Storing full URL for simplicity
                'cover_url' => $coverUrl,
                'is_premium' => $isPremium,
                'price' => $price,
            ]);

            return response()->json([
                'message' => 'Audio track uploaded successfully',
                'data' => $track
            ], 201);
        } else {
            $video = Video::create([
                'artist_id' => $artist->id,
                'title' => $request->input('title'),
                'video_file_path' => $fileUrl,
                // Assuming it's a standard MP4 for now, not HLS
                'is_premium' => $isPremium,
                'price' => $price,
                'status' => 'ready'
            ]);

            return response()->json([
                'message' => 'Video uploaded successfully',
                'data' => $video
            ], 201);
        }
    }
}
