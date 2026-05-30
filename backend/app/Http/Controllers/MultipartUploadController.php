<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use App\Models\UploadSession;
use App\Models\Track;
use App\Models\Video;
use Aws\S3\S3Client;

class MultipartUploadController extends Controller
{
    private function getS3Client()
    {
        return Storage::disk('r2')->getClient();
    }

    private function getBucket()
    {
        return config('filesystems.disks.r2.bucket');
    }

    public function init(Request $request)
    {
        $request->validate([
            'file_name' => 'required|string',
            'media_type' => 'required|in:audio,video,podcast_audio,podcast_video',
            'file_type' => 'required|string',
            'is_premium' => 'boolean',
            'price' => 'numeric|min:0'
        ]);

        $user = $request->user();
        if (!$user->artist) {
            return response()->json(['message' => 'Only verified artists can upload.'], 403);
        }

        $folder = match($request->input('media_type')) {
            'video' => 'videos',
            'podcast_audio', 'podcast_video' => 'podcasts',
            default => 'audio'
        };
        $key = $folder . '/' . uniqid() . '_' . preg_replace('/[^A-Za-z0-9.\-]/', '_', $request->input('file_name'));

        $client = $this->getS3Client();
        
        $result = $client->createMultipartUpload([
            'Bucket' => $this->getBucket(),
            'Key'    => $key,
            'ContentType' => $request->input('file_type'),
        ]);

        $uploadId = $result['UploadId'];

        $session = UploadSession::create([
            'user_id' => $user->id,
            'upload_id' => $uploadId,
            'file_name' => $key,
            'media_type' => $request->input('media_type'),
            'is_premium' => $request->input('is_premium', false),
            'price' => $request->input('price', 0),
            'status' => 'uploading',
            'parts' => []
        ]);

        return response()->json([
            'upload_id' => $uploadId,
            'key' => $key,
            'session_id' => $session->id
        ]);
    }

    public function presign(Request $request)
    {
        $request->validate([
            'upload_id' => 'required|string',
            'key' => 'required|string',
            'part_number' => 'required|integer|min:1|max:10000',
        ]);

        $client = $this->getS3Client();

        $command = $client->getCommand('UploadPart', [
            'Bucket'     => $this->getBucket(),
            'Key'        => $request->input('key'),
            'UploadId'   => $request->input('upload_id'),
            'PartNumber' => $request->input('part_number'),
        ]);

        $requestUrl = $client->createPresignedRequest($command, '+1 hour');

        return response()->json([
            'url' => (string) $requestUrl->getUri()
        ]);
    }

    public function complete(Request $request)
    {
        $request->validate([
            'upload_id' => 'required|string',
            'key' => 'required|string',
            'parts' => 'required|array',
            'title' => 'required|string',
            'podcast_id' => 'nullable|exists:podcasts,id'
        ]);

        $client = $this->getS3Client();

        $result = $client->completeMultipartUpload([
            'Bucket'   => $this->getBucket(),
            'Key'      => $request->input('key'),
            'UploadId' => $request->input('upload_id'),
            'MultipartUpload' => [
                'Parts' => $request->input('parts'),
            ],
        ]);

        $session = UploadSession::where('upload_id', $request->input('upload_id'))->firstOrFail();
        $session->update(['status' => 'processing', 'parts' => $request->input('parts')]);

        $artist = $request->user()->artist;
        $studio = $request->user()->studio; // Fallback for studio owners

        // Use the raw R2 URL
        $baseUrl = config('filesystems.disks.r2.url');
        $fileUrl = $baseUrl . '/' . $request->input('key');

        if ($session->media_type === 'audio') {
            $track = Track::create([
                'artist_id' => $artist->id,
                'title' => $request->input('title'),
                'audio_file_path' => $fileUrl, 
                'is_premium' => $session->is_premium,
                'price' => $session->price,
            ]);
            
            // Dispatch ProcessMediaJob
            \App\Jobs\ProcessAudioUpload::dispatch($track, $request->input('key'));
            
            return response()->json(['message' => 'Upload completed', 'data' => $track]);
        } elseif ($session->media_type === 'video') {
            $video = Video::create([
                'artist_id' => $artist->id,
                'title' => $request->input('title'),
                'video_file_path' => $fileUrl,
                'is_premium' => $session->is_premium,
                'price' => $session->price,
                'status' => 'processing'
            ]);

            // Dispatch ProcessMediaJob
            \App\Jobs\ProcessVideoUpload::dispatch($video, $request->input('key'));

            return response()->json(['message' => 'Upload completed', 'data' => $video]);
        } elseif (in_array($session->media_type, ['podcast_audio', 'podcast_video'])) {
            $podcastId = $request->input('podcast_id');
            if (!$podcastId) {
                return response()->json(['message' => 'podcast_id is required for podcast media.'], 422);
            }

            $episode = \App\Models\PodcastEpisode::create([
                'podcast_id' => $podcastId,
                'title' => $request->input('title'),
                'audio_file_path' => $session->media_type === 'podcast_audio' ? $fileUrl : null,
                'video_url' => $session->media_type === 'podcast_video' ? $fileUrl : null,
                'is_premium' => $session->is_premium,
                'price' => $session->price,
                'status' => 'processing'
            ]);

            \App\Jobs\ProcessPodcastJob::dispatch($episode, $request->input('key'), $session->media_type);

            return response()->json(['message' => 'Podcast episode uploaded and processing started.', 'data' => $episode]);
        }
    }
}
