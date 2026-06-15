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

    /**
     * Upload an Album with a cover image and multiple audio files.
     */
    public function uploadAlbum(Request $request)
    {
        $user = $request->user();
        if (!$user || !$user->artist) {
            return response()->json(['message' => 'Unauthorized. Only verified artists can upload content.'], 403);
        }

        $request->validate([
            'title' => 'required|string|max:255',
            'cover_image' => 'required|image|mimes:jpeg,png,jpg,webp|max:10240', // 10MB max
            'tracks' => 'required|array|min:1',
            'tracks.*.title' => 'required|string|max:255',
            'tracks.*.file' => 'required|file|mimes:mp3,wav|max:512000', // 500MB max per song
            'tracks.*.is_premium' => 'required|string', // validate as string/boolean from Form Data
            'tracks.*.price' => 'nullable|numeric|min:0',
        ]);

        $artist = $user->artist;

        // 1. Upload Cover Image
        $coverUrl = null;
        if ($request->hasFile('cover_image')) {
            $coverPath = $request->file('cover_image')->store('covers', 'public');
            $coverUrl = url(Storage::url($coverPath));
        }

        // 2. Create Album record
        $album = \App\Models\Album::create([
            'artist_id' => $artist->id,
            'title' => $request->input('title'),
            'cover_image' => $coverUrl,
            'release_date' => now()->toDateString(),
        ]);

        // 3. Process and save tracks
        $uploadedTracks = [];
        foreach ($request->file('tracks') as $index => $trackFileGroup) {
            $trackFile = $trackFileGroup['file'];
            $trackData = $request->input('tracks')[$index];
            $trackTitle = $trackData['title'];
            $isPremium = filter_var($trackData['is_premium'], FILTER_VALIDATE_BOOLEAN);
            $price = isset($trackData['price']) ? (float)$trackData['price'] : 0.00;

            // Store file
            $filePath = $trackFile->store('audio', 'public');
            $fileUrl = url(Storage::url($filePath));

            $track = Track::create([
                'artist_id' => $artist->id,
                'album_id' => $album->id,
                'title' => $trackTitle,
                'audio_file_path' => $fileUrl,
                'cover_url' => $coverUrl,
                'is_premium' => $isPremium,
                'price' => $price,
            ]);

            $uploadedTracks[] = $track;
        }

        return response()->json([
            'message' => 'Album and tracks uploaded successfully',
            'album' => $album,
            'tracks' => $uploadedTracks
        ], 201);
    }
}
