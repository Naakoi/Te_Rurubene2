<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Track;
use App\Models\PurchasedTrack;
use App\Models\Transaction;
use Illuminate\Support\Facades\DB;
use App\Services\CommerceService;
use Exception;

class TrackController extends Controller
{
    protected $commerceService;

    public function __construct(CommerceService $commerceService)
    {
        $this->commerceService = $commerceService;
    }
    /**
     * List all tracks with purchase status.
     */
    public function index(Request $request)
    {
        $user = auth('sanctum')->user();
        $tracks = Track::with('artist.studio')->latest()->get();
        
        if ($user) {
            $purchasedIds = PurchasedTrack::where('user_id', $user->id)->pluck('track_id')->toArray();
            
            // Also get unified purchased track IDs
            $unifiedPurchasedIds = \App\Models\PurchasedContent::where('user_id', $user->id)
                ->whereIn('content_type', ['song', 'track'])
                ->pluck('content_id')
                ->toArray();

            $tracks->map(function ($track) use ($user, $purchasedIds, $unifiedPurchasedIds) {
                // User is the uploader/artist
                $isCreator = ($user->artist && $user->artist->id === $track->artist_id);
                
                $track->is_purchased = $isCreator || 
                                       in_array($track->id, $purchasedIds) || 
                                       in_array($track->id, $unifiedPurchasedIds);
                return $track;
            });
        }

        return response()->json($tracks);
    }

    /**
     * Purchase a track using wallet balance.
     */
    public function purchase(Request $request, $id)
    {
        $track = Track::findOrFail($id);
        $user = $request->user();

        try {
            $this->commerceService->purchaseTrack($user, $track);
            $wallet = $user->wallet()->first();
            return response()->json([
                'message' => 'Track purchased successfully', 
                'balance' => $wallet->balance
            ]);
        } catch (Exception $e) {
            return response()->json(['message' => $e->getMessage()], 400);
        }
    }

    /**
     * Get a specific track with details.
     */
    public function show($id)
    {
        $track = Track::with(['artist.studio', 'album', 'comments.user'])->findOrFail($id);
        return response()->json($track);
    }

    /**
     * List tracks purchased by the authenticated user.
     */
    public function myTracks(Request $request)
    {
        $user = $request->user();
        
        // Old purchased tracks
        $oldPurchases = PurchasedTrack::where('user_id', $user->id)
            ->with('track.artist.studio')
            ->get()
            ->pluck('track')
            ->filter();

        // New unified purchased tracks
        $unifiedPurchaseIds = \App\Models\PurchasedContent::where('user_id', $user->id)
            ->whereIn('content_type', ['song', 'track'])
            ->pluck('content_id')
            ->toArray();
            
        $unifiedTracks = Track::whereIn('id', $unifiedPurchaseIds)
            ->with('artist.studio')
            ->get();

        // Merge and unique by ID
        $tracks = $oldPurchases->concat($unifiedTracks)->unique('id')->values();
        
        return response()->json($tracks);
    }

    /**
     * Proxy cross-origin media files to bypass CORS.
     */
    public function proxyMedia(Request $request)
    {
        $url = $request->query('url');
        if (!$url) {
            return response()->json(['error' => 'URL query parameter is required'], 400);
        }

        // Validate the URL is http/https
        if (!filter_var($url, FILTER_VALIDATE_URL)) {
            return response()->json(['error' => 'Invalid URL format'], 400);
        }

        try {
            $client = new \GuzzleHttp\Client([
                'timeout' => 60,
                'verify' => false,
            ]);
            $response = $client->request('GET', $url, [
                'stream' => true,
            ]);

            $headers = [
                'Content-Type' => $response->getHeaderLine('Content-Type') ?: 'audio/mpeg',
                'Access-Control-Allow-Origin' => '*',
                'Access-Control-Allow-Headers' => 'Range',
                'Access-Control-Expose-Headers' => 'Content-Length, Content-Range',
            ];

            if ($response->hasHeader('Content-Length')) {
                $headers['Content-Length'] = $response->getHeaderLine('Content-Length');
            }

            return response()->stream(function () use ($response) {
                $body = $response->getBody();
                while (!$body->eof()) {
                    echo $body->read(8192);
                }
            }, $response->getStatusCode(), $headers);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to proxy media: ' . $e->getMessage()], 500);
        }
    }
}
