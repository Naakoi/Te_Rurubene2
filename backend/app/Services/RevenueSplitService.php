<?php

namespace App\Services;

use App\Models\User;
use App\Models\Purchase;
use App\Models\CreatorEarning;
use App\Models\Artist;
use App\Models\Studio;
use Illuminate\Support\Facades\DB;

class RevenueSplitService
{
    /**
     * Distribute earnings based on platform rules.
     * Default: Independent Artist = 90%, Platform = 10%
     * Studio-Managed: Artist = 70%, Studio = 20%, Platform = 10%
     */
    public function distribute(Purchase $purchase, User $creatorUser, float $amount, $contentType = 'song')
    {
        $artist = $creatorUser->artist;
        $studio = null;

        // If not an artist, maybe a studio selling directly
        if (!$artist && $creatorUser->studio) {
            $studio = $creatorUser->studio;
        } else if ($artist && $artist->studio_id) {
            $studio = Studio::find($artist->studio_id);
        }

        // Determine splits
        $artistShare = 0;
        $studioShare = 0;
        $platformShare = $amount * 0.10; // 10% platform fee

        if ($artist && $studio) {
            // Studio-Managed Artist
            $artistShare = $amount * 0.70;
            $studioShare = $amount * 0.20;
        } else if ($artist) {
            // Independent Artist
            $artistShare = $amount * 0.90;
        } else if ($studio) {
            // Studio directly
            $studioShare = $amount * 0.90;
        }

        $releaseAt = now()->addHours(24); // 24-hour escrow hold

        $earnings = [];

        if ($artistShare > 0) {
            $earnings[] = CreatorEarning::create([
                'purchase_id' => $purchase->id,
                'recipient_type' => 'artist',
                'recipient_id' => $artist->id,
                'amount' => $artistShare,
                'status' => 'pending',
                'release_at' => $releaseAt,
            ]);
        }

        if ($studioShare > 0) {
            $earnings[] = CreatorEarning::create([
                'purchase_id' => $purchase->id,
                'recipient_type' => 'studio',
                'recipient_id' => $studio->id,
                'amount' => $studioShare,
                'status' => 'pending',
                'release_at' => $releaseAt,
            ]);
        }

        // Platform fee
        $earnings[] = CreatorEarning::create([
            'purchase_id' => $purchase->id,
            'recipient_type' => 'platform',
            'recipient_id' => null,
            'amount' => $platformShare,
            'status' => 'available', // Platform fee is available immediately
            'release_at' => null,
        ]);

        return $earnings;
    }

    /**
     * Revert earnings for a refunded purchase.
     */
    public function revertEarnings(Purchase $purchase)
    {
        $earnings = CreatorEarning::where('purchase_id', $purchase->id)->get();
        foreach ($earnings as $earning) {
            $earning->update([
                'status' => 'refunded'
            ]);
        }
    }
}
