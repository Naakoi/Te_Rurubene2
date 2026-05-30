<?php

namespace App\Services;

use App\Models\User;
use App\Models\Purchase;
use App\Models\PurchasedContent;
use App\Models\Track;
use App\Models\Album;
use App\Models\Podcast;
use App\Models\Event;
use App\Models\Ticket;
use App\Models\Product;
use Illuminate\Support\Facades\DB;
use Exception;

class PurchaseService
{
    protected $walletService;
    protected $revenueSplitService;

    public function __construct(WalletService $walletService, RevenueSplitService $revenueSplitService)
    {
        $this->walletService = $walletService;
        $this->revenueSplitService = $revenueSplitService;
    }

    /**
     * Process a unified purchase.
     */
    public function processCheckout(User $user, array $items)
    {
        return DB::transaction(function () use ($user, $items) {
            $totalAmount = 0;
            $processedItems = [];

            // 1. Calculate total and verify no duplicates
            foreach ($items as $item) {
                $type = $item['type'];
                $id = $item['id'];
                $price = $item['price'] ?? 0;

                // Check for duplicate ownership (if digital asset)
                if (in_array($type, ['song', 'track', 'album', 'podcast'])) {
                    $exists = PurchasedContent::where('user_id', $user->id)
                        ->where('content_type', $type)
                        ->where('content_id', $id)
                        ->exists();

                    if ($exists) {
                        throw new Exception("You already own the {$type} ID {$id}.");
                    }
                }

                $totalAmount += $price;
                
                // Find creator
                $creatorUser = $this->getCreatorForContent($type, $id);

                $processedItems[] = [
                    'type' => $type,
                    'id' => $id,
                    'price' => $price,
                    'creator' => $creatorUser
                ];
            }

            if ($totalAmount < 0) {
                throw new Exception("Invalid checkout amount.");
            }

            // 2. Create the Purchase record
            $purchase = Purchase::create([
                'user_id' => $user->id,
                'total_amount' => $totalAmount,
                'status' => 'completed',
            ]);

            if ($totalAmount > 0) {
                // 3. Debit User Wallet
                $transaction = $this->walletService->debit(
                    $user, 
                    $totalAmount, 
                    'checkout', 
                    "Checkout Order #{$purchase->id}",
                    $purchase->id
                );

                // Save the transaction signature to the purchase for verification
                $purchase->update(['transaction_signature' => $transaction->signature]);
            }

            // 4. Process each item (Grant Access & Split Revenue)
            foreach ($processedItems as $item) {
                // Grant Ownership
                PurchasedContent::create([
                    'user_id' => $user->id,
                    'purchase_id' => $purchase->id,
                    'content_type' => $item['type'],
                    'content_id' => $item['id'],
                    'price' => $item['price'],
                ]);

                // Split Revenue
                if ($item['creator']) {
                    $this->revenueSplitService->distribute(
                        $purchase, 
                        $item['creator'], 
                        $item['price'], 
                        $item['type']
                    );
                }
            }

            return $purchase;
        });
    }

    /**
     * Resolve the creator user for a piece of content.
     */
    private function getCreatorForContent($type, $id)
    {
        switch ($type) {
            case 'song':
            case 'track':
                return Track::findOrFail($id)->artist->user;
            case 'album':
                return Album::findOrFail($id)->artist->user;
            case 'podcast':
                return Podcast::findOrFail($id)->studio->user ?? null;
            case 'ticket':
                return Event::findOrFail($id)->artist->user;
            case 'product':
            case 'merchandise':
                $product = Product::findOrFail($id);
                return $product->artist ? $product->artist->user : $product->studio->user;
            default:
                return null;
        }
    }
}
